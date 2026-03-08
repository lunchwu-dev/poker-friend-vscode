import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import {
  SocketEvent,
  ActionType,
  SETTLE_DELAY_MS,
  RECONNECT_TIMEOUT,
  type RoomCreatePayload,
  type RoomJoinPayload,
  type SeatSitPayload,
  type GameActionPayload,
  type GameHandStartPayload,
  type GameDealHolePayload,
  type GameDealCommunityPayload,
  type GameActionOnPayload,
  type GamePlayerActedPayload,
  type GameHandResultPayload,
  type GameErrorPayload,
  type PlayerAction,
} from '@poker-friends/shared';
import { AuthService } from '../auth/auth.service';
import { RoomService } from '../room/room.service';
import {
  GameEngineService,
  type ActionResult,
} from '../game/game-engine.service';
import { HistoryService } from '../history/history.service';
import {
  type AuthenticatedSocket,
  createWsAuthMiddleware,
} from '../auth/ws-auth.guard';

@WebSocketGateway({ cors: { origin: '*' } })
export class GameGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(GameGateway.name);

  @WebSocketServer()
  server!: Server;

  /** roomCode → timeout handle */
  private readonly actionTimers = new Map<string, NodeJS.Timeout>();

  /** userId → disconnect timeout handle */
  private readonly disconnectTimers = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly authService: AuthService,
    private readonly roomService: RoomService,
    private readonly engine: GameEngineService,
    private readonly history: HistoryService,
  ) {}

  afterInit(server: Server) {
    server.use(createWsAuthMiddleware(this.authService));
  }

  handleConnection(client: AuthenticatedSocket) {
    const { sub: userId, nickname } = client.user;
    this.logger.log(`Connected: ${userId} (${nickname})`);

    // Cancel any pending disconnect timer
    const timer = this.disconnectTimers.get(userId);
    if (timer) {
      clearTimeout(timer);
      this.disconnectTimers.delete(userId);
      this.logger.log(`Reconnect: cancelled disconnect timer for ${userId}`);
    }

    // Check if user was in a room (reconnect scenario)
    const roomCode = this.roomService.findRoomByUserId(userId);
    if (roomCode) {
      this.roomService.updateSocketId(roomCode, userId, client.id);
      client.join(roomCode);
      this.logger.log(`Reconnect: ${userId} rejoined room ${roomCode}`);

      // Send full room state
      const roomState = this.roomService.getRoomState(roomCode);
      if (roomState) {
        client.emit(SocketEvent.RoomState, roomState);
      }

      // If a game is in progress, resend game state snapshot
      const room = this.roomService.getRoom(roomCode);
      if (room?.isPlaying) {
        const gameState = this.engine.getGameState(roomCode);
        if (gameState) {
          // Resend hand start with current seats
          const startPayload: GameHandStartPayload = {
            handNumber: gameState.handNumber,
            dealerSeatIndex: gameState.dealerSeatIndex,
            seats: room.seats,
          };
          client.emit(SocketEvent.GameHandStart, startPayload);

          // Resend this player's hole cards
          const playerState = gameState.players.find(
            (p) => p.playerId === userId,
          );
          if (playerState?.holeCards && playerState.holeCards.length > 0) {
            client.emit(SocketEvent.GameDealHole, {
              cards: playerState.holeCards,
            } as GameDealHolePayload);
          }

          // Resend community cards if any
          if (gameState.communityCards.length > 0) {
            client.emit(SocketEvent.GameDealCommunity, {
              cards: gameState.communityCards,
              stage: gameState.stage,
            } as GameDealCommunityPayload);
          }

          // Resend action-on if waiting for someone
          if (gameState.currentPlayerIndex !== null) {
            const currentPlayer =
              gameState.players[gameState.currentPlayerIndex];
            const seat = room.seats.find(
              (s) => s.playerId === currentPlayer.playerId,
            );
            const actions = this.engine.getAvailableActions(
              roomCode,
              currentPlayer.playerId,
            );
            if (seat && actions) {
              client.emit(SocketEvent.GameActionOn, {
                seatIndex: seat.seatIndex,
                playerId: currentPlayer.playerId,
                availableActions: actions,
                timeoutMs: room.config.actionTimeout * 1000,
              } as GameActionOnPayload);
            }
          }
        }
      }
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const { sub: userId } = client.user;
    this.logger.log(`Disconnected: ${userId}`);

    const roomCode = this.roomService.findRoomByUserId(userId);
    if (!roomCode) return;

    const room = this.roomService.getRoom(roomCode);
    if (!room) return;

    // Start disconnect timer
    const disconnectTimer = setTimeout(() => {
      this.disconnectTimers.delete(userId);
      this.logger.log(`Disconnect timeout: ${userId} in room ${roomCode}`);

      // If game is active and it's this player's turn, auto-fold
      if (room.isPlaying) {
        const gameState = this.engine.getGameState(roomCode);
        if (gameState && gameState.currentPlayerIndex !== null) {
          const currentPlayer =
            gameState.players[gameState.currentPlayerIndex];
          if (currentPlayer.playerId === userId) {
            this.clearActionTimer(roomCode);
            const result = this.engine.handleTimeout(roomCode);
            if (result.valid) {
              const autoAction: PlayerAction = {
                action: ActionType.Fold,
              };
              this.broadcastActionResult(
                roomCode,
                userId,
                autoAction,
                result,
              );
            }
          }
        }
      }

      // If game is NOT active, remove from room
      if (!room.isPlaying) {
        this.roomService.leaveRoom(roomCode, userId);
        this.server
          .to(roomCode)
          .emit(SocketEvent.RoomPlayerLeft, { playerId: userId });
      }
    }, RECONNECT_TIMEOUT * 1000);

    this.disconnectTimers.set(userId, disconnectTimer);
  }

  // ── Room events ──────────────────────────────────────────────────────────

  @SubscribeMessage(SocketEvent.RoomCreate)
  handleRoomCreate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: RoomCreatePayload,
  ) {
    const { sub: userId, nickname } = client.user;
    const room = this.roomService.createRoom(
      userId,
      nickname,
      'default_01',
      client.id,
      payload.config,
    );

    client.join(room.roomCode);

    client.emit(SocketEvent.RoomCreated, {
      roomCode: room.roomCode,
      config: room.config,
    });
    client.emit(
      SocketEvent.RoomState,
      this.roomService.getRoomState(room.roomCode),
    );
  }

  @SubscribeMessage(SocketEvent.RoomJoin)
  handleRoomJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: RoomJoinPayload,
  ) {
    const { sub: userId, nickname } = client.user;

    try {
      this.roomService.joinRoom(
        payload.roomCode,
        userId,
        nickname,
        'default_01',
        client.id,
      );
      client.join(payload.roomCode);

      this.server.to(payload.roomCode).emit(SocketEvent.RoomPlayerJoined, {
        playerId: userId,
        nickname,
        avatar: 'default_01',
      });

      client.emit(
        SocketEvent.RoomState,
        this.roomService.getRoomState(payload.roomCode),
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Join failed';
      client.emit(SocketEvent.GameError, {
        code: 'JOIN_FAILED',
        message,
      } as GameErrorPayload);
    }
  }

  @SubscribeMessage(SocketEvent.RoomLeave)
  handleRoomLeave(@ConnectedSocket() client: AuthenticatedSocket) {
    const { sub: userId } = client.user;
    const roomCode = this.findUserRoom(client);
    if (!roomCode) return;

    this.roomService.leaveRoom(roomCode, userId);
    client.leave(roomCode);
    this.server
      .to(roomCode)
      .emit(SocketEvent.RoomPlayerLeft, { playerId: userId });
  }

  @SubscribeMessage(SocketEvent.SeatSit)
  handleSeatSit(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: SeatSitPayload,
  ) {
    const { sub: userId } = client.user;
    const roomCode = this.findUserRoom(client);
    if (!roomCode) return;

    try {
      this.roomService.sitDown(
        roomCode,
        userId,
        payload.seatIndex,
        payload.buyinAmount,
      );
      this.server
        .to(roomCode)
        .emit(SocketEvent.RoomState, this.roomService.getRoomState(roomCode));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sit failed';
      client.emit(SocketEvent.GameError, {
        code: 'SIT_FAILED',
        message,
      } as GameErrorPayload);
    }
  }

  @SubscribeMessage(SocketEvent.SeatStand)
  handleSeatStand(@ConnectedSocket() client: AuthenticatedSocket) {
    const { sub: userId } = client.user;
    const roomCode = this.findUserRoom(client);
    if (!roomCode) return;

    this.roomService.standUp(roomCode, userId);
    this.server
      .to(roomCode)
      .emit(SocketEvent.RoomState, this.roomService.getRoomState(roomCode));
  }

  // ── Game events ──────────────────────────────────────────────────────────

  @SubscribeMessage(SocketEvent.GameStart)
  handleGameStart(@ConnectedSocket() client: AuthenticatedSocket) {
    const { sub: userId } = client.user;
    const roomCode = this.findUserRoom(client);
    if (!roomCode) return;

    const room = this.roomService.getRoom(roomCode);
    if (!room) return;

    if (room.hostId !== userId) {
      client.emit(SocketEvent.GameError, {
        code: 'NOT_HOST',
        message: 'Only room host can start the game',
      } as GameErrorPayload);
      return;
    }

    const seated = this.roomService.getSeatedPlayers(roomCode);
    if (seated.length < 2) {
      client.emit(SocketEvent.GameError, {
        code: 'NOT_ENOUGH',
        message: 'Need at least 2 seated players',
      } as GameErrorPayload);
      return;
    }

    this.engine.initGame({
      roomCode,
      smallBlind: room.config.smallBlind,
      bigBlind: room.config.bigBlind,
      actionTimeout: room.config.actionTimeout,
      seats: seated,
    });

    this.roomService.setPlaying(roomCode, true);

    const result = this.engine.startHand(roomCode);

    const startPayload: GameHandStartPayload = {
      handNumber: result.handNumber,
      dealerSeatIndex: result.dealerSeatIndex,
      seats: room.seats,
    };
    this.server.to(roomCode).emit(SocketEvent.GameHandStart, startPayload);

    for (const [playerId, cards] of result.playerHoleCards) {
      const socketId = this.roomService.getSocketId(roomCode, playerId);
      if (socketId) {
        this.server
          .to(socketId)
          .emit(SocketEvent.GameDealHole, { cards } as GameDealHolePayload);
      }
    }

    this.emitActionOn(roomCode, result.firstPlayerId);
  }

  @SubscribeMessage(SocketEvent.GameAction)
  handleGameAction(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: GameActionPayload,
  ) {
    const { sub: userId } = client.user;
    const roomCode = this.findUserRoom(client);
    if (!roomCode) return;

    this.clearActionTimer(roomCode);

    const result = this.engine.handleAction(
      roomCode,
      userId,
      payload.action,
    );

    if (!result.valid) {
      client.emit(SocketEvent.GameError, {
        code: 'INVALID_ACTION',
        message: result.error || 'Invalid action',
      } as GameErrorPayload);
      return;
    }

    this.broadcastActionResult(roomCode, userId, payload.action, result);
  }

  // ── Internal helpers ───────────────────────────────────────────────────

  private broadcastActionResult(
    roomCode: string,
    actorId: string,
    action: PlayerAction,
    result: ActionResult,
  ): void {
    const room = this.roomService.getRoom(roomCode);
    if (!room) return;

    const actorSeat = room.seats.find((s) => s.playerId === actorId);

    const actedPayload: GamePlayerActedPayload = {
      seatIndex: actorSeat?.seatIndex ?? -1,
      playerId: actorId,
      action: action.action,
      amount: action.amount ?? 0,
      potTotal: result.pots.reduce((sum, p) => sum + p.amount, 0),
    };
    this.server.to(roomCode).emit(SocketEvent.GamePlayerActed, actedPayload);

    if (result.newCommunityCards?.length) {
      const communityPayload: GameDealCommunityPayload = {
        cards: result.newCommunityCards,
        stage: result.newStage ?? '',
      };
      this.server
        .to(roomCode)
        .emit(SocketEvent.GameDealCommunity, communityPayload);
    }

    if (result.handSettlement) {
      this.handleSettlement(roomCode, result);
      return;
    }

    if (result.nextPlayerId) {
      this.emitActionOn(roomCode, result.nextPlayerId);
    }
  }

  private emitActionOn(roomCode: string, playerId: string): void {
    const room = this.roomService.getRoom(roomCode);
    if (!room) return;

    const seat = room.seats.find((s) => s.playerId === playerId);
    const actions = this.engine.getAvailableActions(roomCode, playerId);
    if (!seat || !actions) return;

    const actionOnPayload: GameActionOnPayload = {
      seatIndex: seat.seatIndex,
      playerId,
      availableActions: actions,
      timeoutMs: room.config.actionTimeout * 1000,
    };
    this.server.to(roomCode).emit(SocketEvent.GameActionOn, actionOnPayload);

    this.startActionTimer(roomCode, room.config.actionTimeout);
  }

  private startActionTimer(roomCode: string, timeoutSec: number): void {
    this.clearActionTimer(roomCode);

    const timer = setTimeout(() => {
      const state = this.engine.getGameState(roomCode);
      if (!state || state.currentPlayerIndex === null) return;

      const timedOutPlayer = state.players[state.currentPlayerIndex];
      const canCheck =
        state.roundMaxBet <= timedOutPlayer.currentRoundBet;

      const result = this.engine.handleTimeout(roomCode);
      if (!result.valid) return;

      const autoAction: PlayerAction = canCheck
        ? { action: ActionType.Check }
        : { action: ActionType.Fold };

      this.broadcastActionResult(
        roomCode,
        timedOutPlayer.playerId,
        autoAction,
        result,
      );
    }, timeoutSec * 1000);

    this.actionTimers.set(roomCode, timer);
  }

  private clearActionTimer(roomCode: string): void {
    const timer = this.actionTimers.get(roomCode);
    if (timer) {
      clearTimeout(timer);
      this.actionTimers.delete(roomCode);
    }
  }

  private async handleSettlement(
    roomCode: string,
    result: ActionResult,
  ): Promise<void> {
    if (!result.handSettlement) return;
    const room = this.roomService.getRoom(roomCode);
    if (!room) return;

    this.clearActionTimer(roomCode);

    const settlement = result.handSettlement;
    const engineState = this.engine.getGameState(roomCode);

    if (engineState) {
      for (const p of engineState.players) {
        this.roomService.updateSeatChips(roomCode, p.playerId, p.chips);
      }
    }

    const resultPayload: GameHandResultPayload = {
      winners: settlement.winners.map((w) => {
        const seat = room.seats.find((s) => s.playerId === w.playerId);
        return {
          playerId: w.playerId,
          seatIndex: seat?.seatIndex ?? -1,
          handResult: settlement.showdownHands.get(w.playerId) ?? {
            rank: 0,
            rankName: '',
            bestCards: [],
            keyValues: [],
          },
          chipsWon: w.amount,
        };
      }),
      communityCards: engineState?.communityCards ?? [],
      showdownPlayers: Array.from(settlement.showdownHands.entries()).map(
        ([pid, hr]) => {
          const seat = room.seats.find((s) => s.playerId === pid);
          const playerState = engineState?.players.find(
            (p) => p.playerId === pid,
          );
          return {
            playerId: pid,
            seatIndex: seat?.seatIndex ?? -1,
            holeCards: playerState?.holeCards ?? [],
            handResult: hr,
          };
        },
      ),
    };

    this.server.to(roomCode).emit(SocketEvent.GameHandResult, resultPayload);

    // Save hand history (fire and forget — don't block settlement)
    if (engineState) {
      this.history
        .saveHandResult(roomCode, engineState, settlement)
        .catch((err) =>
          this.logger.error('Failed to save hand history', err),
        );
    }

    setTimeout(() => {
      this.roomService.setPlaying(roomCode, false);
      this.server
        .to(roomCode)
        .emit(SocketEvent.RoomState, this.roomService.getRoomState(roomCode));
    }, SETTLE_DELAY_MS);
  }

  private findUserRoom(client: AuthenticatedSocket): string | undefined {
    const rooms = Array.from(client.rooms);
    return rooms.find((r) => r !== client.id);
  }
}

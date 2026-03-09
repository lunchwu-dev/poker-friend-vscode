import { io, Socket } from 'socket.io-client';
import {
  SocketEvent,
  type RoomCreatePayload,
  type RoomJoinPayload,
  type SeatSitPayload,
  type GameActionPayload,
  type RoomCreatedPayload,
  type RoomState,
  type RoomPlayerJoinedPayload,
  type RoomPlayerLeftPayload,
  type GameHandStartPayload,
  type GameDealHolePayload,
  type GameDealCommunityPayload,
  type GameActionOnPayload,
  type GamePlayerActedPayload,
  type GameHandResultPayload,
  type GameErrorPayload,
} from '@poker-friends/shared';

const SERVER_URL = __DEV__ ? 'http://10.0.2.2:3000' : 'https://poker-friends-server.fly.dev';

type Listener<T = unknown> = (data: T) => void;

class SocketService {
  private socket: Socket | null = null;
  private listeners = new Map<string, Set<Listener>>();

  connect(token: string): void {
    if (this.socket?.connected) return;

    this.socket = io(SERVER_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => this.emit('connect', {}));
    this.socket.on('disconnect', (reason) => this.emit('disconnect', { reason }));

    // Server → Client events
    const serverEvents = [
      SocketEvent.RoomCreated,
      SocketEvent.RoomState,
      SocketEvent.RoomPlayerJoined,
      SocketEvent.RoomPlayerLeft,
      SocketEvent.GameHandStart,
      SocketEvent.GameDealHole,
      SocketEvent.GameDealCommunity,
      SocketEvent.GameActionOn,
      SocketEvent.GamePlayerActed,
      SocketEvent.GameHandResult,
      SocketEvent.GameError,
    ];

    for (const event of serverEvents) {
      this.socket.on(event, (data: unknown) => this.emit(event, data));
    }
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  get connected(): boolean {
    return this.socket?.connected ?? false;
  }

  // Client → Server
  createRoom(payload: RoomCreatePayload): void {
    this.socket?.emit(SocketEvent.RoomCreate, payload);
  }

  joinRoom(payload: RoomJoinPayload): void {
    this.socket?.emit(SocketEvent.RoomJoin, payload);
  }

  leaveRoom(): void {
    this.socket?.emit(SocketEvent.RoomLeave, {});
  }

  sitDown(payload: SeatSitPayload): void {
    this.socket?.emit(SocketEvent.SeatSit, payload);
  }

  standUp(): void {
    this.socket?.emit(SocketEvent.SeatStand, {});
  }

  startGame(): void {
    this.socket?.emit(SocketEvent.GameStart, {});
  }

  sendAction(payload: GameActionPayload): void {
    this.socket?.emit(SocketEvent.GameAction, payload);
  }

  // Typed event subscription
  on(event: 'connect', fn: Listener<Record<string, never>>): () => void;
  on(event: 'disconnect', fn: Listener<{ reason: string }>): () => void;
  on(event: typeof SocketEvent.RoomCreated, fn: Listener<RoomCreatedPayload>): () => void;
  on(event: typeof SocketEvent.RoomState, fn: Listener<RoomState>): () => void;
  on(event: typeof SocketEvent.RoomPlayerJoined, fn: Listener<RoomPlayerJoinedPayload>): () => void;
  on(event: typeof SocketEvent.RoomPlayerLeft, fn: Listener<RoomPlayerLeftPayload>): () => void;
  on(event: typeof SocketEvent.GameHandStart, fn: Listener<GameHandStartPayload>): () => void;
  on(event: typeof SocketEvent.GameDealHole, fn: Listener<GameDealHolePayload>): () => void;
  on(event: typeof SocketEvent.GameDealCommunity, fn: Listener<GameDealCommunityPayload>): () => void;
  on(event: typeof SocketEvent.GameActionOn, fn: Listener<GameActionOnPayload>): () => void;
  on(event: typeof SocketEvent.GamePlayerActed, fn: Listener<GamePlayerActedPayload>): () => void;
  on(event: typeof SocketEvent.GameHandResult, fn: Listener<GameHandResultPayload>): () => void;
  on(event: typeof SocketEvent.GameError, fn: Listener<GameErrorPayload>): () => void;
  on(event: string, fn: Listener<any>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(fn);
    return () => { this.listeners.get(event)?.delete(fn); };
  }

  private emit(event: string, data: unknown): void {
    this.listeners.get(event)?.forEach((fn) => fn(data));
  }
}

export const socketService = new SocketService();

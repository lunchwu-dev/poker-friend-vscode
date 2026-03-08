import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import {
  RoomConfig,
  RoomState,
  SeatInfo,
  SeatStatus,
} from '@poker-friends/shared';

export interface RoomData {
  roomCode: string;
  config: RoomConfig;
  hostId: string;
  seats: SeatInfo[];
  isPlaying: boolean;
  /** userId → { nickname, avatar, socketId } */
  players: Map<string, { nickname: string; avatar: string; socketId: string }>;
}

@Injectable()
export class RoomService {
  private readonly rooms = new Map<string, RoomData>();

  createRoom(
    hostId: string,
    nickname: string,
    avatar: string,
    socketId: string,
    config: RoomConfig,
  ): RoomData {
    const roomCode = this.generateRoomCode();

    const seats: SeatInfo[] = Array.from({ length: config.maxPlayers }, (_, i) => ({
      seatIndex: i,
      playerId: null,
      nickname: null,
      avatar: null,
      chips: 0,
      status: 'empty' as SeatStatus,
      currentBet: 0,
    }));

    const room: RoomData = {
      roomCode,
      config,
      hostId,
      seats,
      isPlaying: false,
      players: new Map([[hostId, { nickname, avatar, socketId }]]),
    };

    this.rooms.set(roomCode, room);
    return room;
  }

  joinRoom(
    roomCode: string,
    userId: string,
    nickname: string,
    avatar: string,
    socketId: string,
  ): RoomData {
    const room = this.getRoom(roomCode);
    if (!room) throw new Error('Room not found');
    room.players.set(userId, { nickname, avatar, socketId });
    return room;
  }

  leaveRoom(roomCode: string, userId: string): void {
    const room = this.getRoom(roomCode);
    if (!room) return;

    this.standUp(roomCode, userId);
    room.players.delete(userId);

    if (room.players.size === 0) {
      this.rooms.delete(roomCode);
    }
  }

  sitDown(
    roomCode: string,
    userId: string,
    seatIndex: number,
    buyinAmount: number,
  ): SeatInfo {
    const room = this.getRoom(roomCode);
    if (!room) throw new Error('Room not found');
    if (room.isPlaying) throw new Error('Game in progress');

    const seat = room.seats[seatIndex];
    if (!seat) throw new Error('Invalid seat');
    if (seat.status !== 'empty') throw new Error('Seat occupied');

    if (room.seats.some((s) => s.playerId === userId)) {
      throw new Error('Already seated');
    }

    const player = room.players.get(userId);
    if (!player) throw new Error('Not in room');

    seat.playerId = userId;
    seat.nickname = player.nickname;
    seat.avatar = player.avatar;
    seat.chips = buyinAmount;
    seat.status = 'seated';
    seat.currentBet = 0;

    return seat;
  }

  standUp(roomCode: string, userId: string): void {
    const room = this.getRoom(roomCode);
    if (!room) return;
    if (room.isPlaying) return;

    const seat = room.seats.find((s) => s.playerId === userId);
    if (seat) {
      seat.playerId = null;
      seat.nickname = null;
      seat.avatar = null;
      seat.chips = 0;
      seat.status = 'empty';
      seat.currentBet = 0;
    }
  }

  getRoom(roomCode: string): RoomData | undefined {
    return this.rooms.get(roomCode);
  }

  getRoomState(roomCode: string): RoomState | null {
    const room = this.getRoom(roomCode);
    if (!room) return null;
    return {
      roomCode: room.roomCode,
      config: room.config,
      hostId: room.hostId,
      seats: room.seats,
      isPlaying: room.isPlaying,
    };
  }

  getSeatedPlayers(
    roomCode: string,
  ): Array<{ playerId: string; seatIndex: number; chips: number }> {
    const room = this.getRoom(roomCode);
    if (!room) return [];
    return room.seats
      .filter((s) => s.playerId !== null && s.status !== 'empty')
      .map((s) => ({
        playerId: s.playerId!,
        seatIndex: s.seatIndex,
        chips: s.chips,
      }));
  }

  setPlaying(roomCode: string, playing: boolean): void {
    const room = this.getRoom(roomCode);
    if (room) room.isPlaying = playing;
  }

  updateSocketId(roomCode: string, userId: string, socketId: string): void {
    const room = this.getRoom(roomCode);
    if (!room) return;
    const player = room.players.get(userId);
    if (player) player.socketId = socketId;
  }

  getSocketId(roomCode: string, userId: string): string | undefined {
    return this.getRoom(roomCode)?.players.get(userId)?.socketId;
  }

  /** Find which room a user is currently in */
  findRoomByUserId(userId: string): string | undefined {
    for (const [roomCode, room] of this.rooms) {
      if (room.players.has(userId)) return roomCode;
    }
    return undefined;
  }

  updateSeatChips(roomCode: string, playerId: string, chips: number): void {
    const room = this.getRoom(roomCode);
    if (!room) return;
    const seat = room.seats.find((s) => s.playerId === playerId);
    if (seat) seat.chips = chips;
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code: string;
    do {
      const bytes = randomBytes(6);
      code = Array.from(bytes)
        .map((b) => chars[b % chars.length])
        .join('');
    } while (this.rooms.has(code));
    return code;
  }
}

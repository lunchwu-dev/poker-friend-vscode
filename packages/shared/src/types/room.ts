export interface RoomConfig {
  maxPlayers: number; // 2-9
  smallBlind: number;
  bigBlind: number;
  minBuyin: number;
  maxBuyin: number;
  actionTimeout: number; // 秒
  password?: string;
}

export type SeatStatus =
  | 'empty'
  | 'seated'
  | 'playing'
  | 'folded'
  | 'allin'
  | 'standing';

export interface SeatInfo {
  seatIndex: number;
  playerId: string | null;
  nickname: string | null;
  avatar: string | null;
  chips: number;
  status: SeatStatus;
  currentBet: number;
}

export interface RoomState {
  roomCode: string;
  config: RoomConfig;
  hostId: string;
  seats: SeatInfo[];
  isPlaying: boolean;
}

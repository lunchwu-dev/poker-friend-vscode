import type { Card, HandResult } from './card';
import type { ActionType, AvailableActions, PlayerAction } from './game';
import type { RoomConfig, SeatInfo } from './room';

/** Socket 事件名枚举 */
export enum SocketEvent {
  // 客户端 → 服务端
  RoomCreate = 'room:create',
  RoomJoin = 'room:join',
  RoomLeave = 'room:leave',
  SeatSit = 'seat:sit',
  SeatStand = 'seat:stand',
  SeatRebuy = 'seat:rebuy',
  GameStart = 'game:start',
  GameAction = 'game:action',
  Reconnect = 'reconnect_attempt',

  // 服务端 → 客户端
  RoomCreated = 'room:created',
  RoomState = 'room:state',
  RoomPlayerJoined = 'room:player_joined',
  RoomPlayerLeft = 'room:player_left',
  GameHandStart = 'game:hand_start',
  GameDealHole = 'game:deal_hole',
  GameDealCommunity = 'game:deal_community',
  GameActionOn = 'game:action_on',
  GamePlayerActed = 'game:player_acted',
  GameHandResult = 'game:hand_result',
  GameError = 'game:error',
}

/** 各事件对应的载荷类型 */

// --- 客户端 → 服务端 ---
export interface RoomCreatePayload {
  config: RoomConfig;
}

export interface RoomJoinPayload {
  roomCode: string;
  password?: string;
}

export interface SeatSitPayload {
  seatIndex: number;
  buyinAmount: number;
}

export interface SeatRebuyPayload {
  amount: number;
}

export interface GameActionPayload {
  action: PlayerAction;
}

// --- 服务端 → 客户端 ---
export interface RoomCreatedPayload {
  roomCode: string;
  config: RoomConfig;
}

export interface RoomPlayerJoinedPayload {
  playerId: string;
  nickname: string;
  avatar: string;
}

export interface RoomPlayerLeftPayload {
  playerId: string;
}

export interface GameHandStartPayload {
  handNumber: number;
  dealerSeatIndex: number;
  seats: SeatInfo[];
}

export interface GameDealHolePayload {
  cards: Card[];
}

export interface GameDealCommunityPayload {
  cards: Card[];
  stage: string;
}

export interface GameActionOnPayload {
  seatIndex: number;
  playerId: string;
  availableActions: AvailableActions;
  timeoutMs: number;
}

export interface GamePlayerActedPayload {
  seatIndex: number;
  playerId: string;
  action: ActionType;
  amount: number;
  potTotal: number;
}

export interface GameHandResultPayload {
  winners: Array<{
    playerId: string;
    seatIndex: number;
    handResult: HandResult;
    chipsWon: number;
  }>;
  communityCards: Card[];
  showdownPlayers: Array<{
    playerId: string;
    seatIndex: number;
    holeCards: Card[];
    handResult: HandResult;
  }>;
}

export interface GameErrorPayload {
  code: string;
  message: string;
}

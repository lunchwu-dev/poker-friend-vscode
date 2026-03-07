import type { Card } from './card';

export enum GameStage {
  IDLE = 'IDLE',
  DEALING = 'DEALING',
  PRE_FLOP = 'PRE_FLOP',
  FLOP = 'FLOP',
  TURN = 'TURN',
  RIVER = 'RIVER',
  SHOWDOWN = 'SHOWDOWN',
  SETTLE = 'SETTLE',
}

export enum ActionType {
  Fold = 'fold',
  Check = 'check',
  Call = 'call',
  Raise = 'raise',
  AllIn = 'allin',
}

export interface PlayerAction {
  action: ActionType;
  amount?: number;
}

export interface AvailableActions {
  canFold: boolean;
  canCheck: boolean;
  canCall: boolean;
  callAmount?: number;
  canRaise: boolean;
  minRaise?: number;
  maxRaise?: number;
  canAllIn: boolean;
  allInAmount?: number;
}

export interface GameState {
  stage: GameStage;
  handNumber: number;
  dealerSeatIndex: number;
  communityCards: Card[];
  pots: Pot[];
  currentPlayerIndex: number | null;
  actionTimeout: number;
}

export interface Pot {
  amount: number;
  eligiblePlayerIds: string[];
}

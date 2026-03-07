import type { Card, GameStage, Pot } from '@poker-friends/shared';

/** Internal player state tracked by the game engine (not sent over the wire as-is) */
export interface EnginePlayerState {
  playerId: string;
  seatIndex: number;
  chips: number; // chips currently at the table
  holeCards: [Card, Card] | null;
  status: PlayerStatus;
  currentRoundBet: number; // chips committed in the current betting round
  totalHandBet: number; // chips committed across entire hand (for side-pot calc)
  hasActedThisRound: boolean;
}

export type PlayerStatus =
  | 'sitting' // at table, not yet playing
  | 'playing' // active in current hand
  | 'folded' // folded this hand
  | 'allin' // all-in, can't act further
  | 'standing'; // leaving

/** Full mutable game state managed by the engine */
export interface EngineGameState {
  roomCode: string;
  handNumber: number;
  stage: GameStage;
  dealerSeatIndex: number;
  smallBlind: number;
  bigBlind: number;
  actionTimeout: number; // seconds
  deck: Card[];
  communityCards: Card[];
  players: EnginePlayerState[]; // only active/sitting players, ordered by seat
  currentPlayerIndex: number | null; // index into players[]
  pots: Pot[];
  roundMaxBet: number; // highest bet in current betting round
  lastRaiseAmount: number; // for min-raise calculation
  handStartTime: number; // Date.now()
}

/** Result of pot distribution at showdown */
export interface PotDistribution {
  playerId: string;
  amount: number;
}

/** Per-betting-action validation context */
export interface ActionValidation {
  valid: boolean;
  reason?: string;
}

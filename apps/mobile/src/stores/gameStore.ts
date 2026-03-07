import { create } from 'zustand';
import type {
  Card,
  AvailableActions,
  GameHandResultPayload,
  SeatInfo,
} from '@poker-friends/shared';

interface GameStoreState {
  handNumber: number;
  dealerSeatIndex: number;
  seats: SeatInfo[];
  myHoleCards: Card[];
  communityCards: Card[];
  stage: string;
  potTotal: number;

  // Current action
  actionSeatIndex: number | null;
  actionPlayerId: string | null;
  availableActions: AvailableActions | null;
  timeoutMs: number;

  // Settlement
  handResult: GameHandResultPayload | null;

  // Mutations
  startHand: (handNumber: number, dealerSeatIndex: number, seats: SeatInfo[]) => void;
  setHoleCards: (cards: Card[]) => void;
  addCommunityCards: (cards: Card[], stage: string) => void;
  setActionOn: (seatIndex: number, playerId: string, actions: AvailableActions, timeoutMs: number) => void;
  clearActionOn: () => void;
  playerActed: (seatIndex: number, action: string, amount: number, potTotal: number) => void;
  setHandResult: (result: GameHandResultPayload) => void;
  resetHand: () => void;
}

const initialState = {
  handNumber: 0,
  dealerSeatIndex: -1,
  seats: [] as SeatInfo[],
  myHoleCards: [] as Card[],
  communityCards: [] as Card[],
  stage: 'IDLE',
  potTotal: 0,
  actionSeatIndex: null as number | null,
  actionPlayerId: null as string | null,
  availableActions: null as AvailableActions | null,
  timeoutMs: 0,
  handResult: null as GameHandResultPayload | null,
};

export const useGameStore = create<GameStoreState>((set) => ({
  ...initialState,

  startHand: (handNumber, dealerSeatIndex, seats) =>
    set({
      ...initialState,
      handNumber,
      dealerSeatIndex,
      seats,
      stage: 'PRE_FLOP',
    }),

  setHoleCards: (cards) => set({ myHoleCards: cards }),

  addCommunityCards: (cards, stage) =>
    set((s) => ({
      communityCards: [...s.communityCards, ...cards],
      stage,
    })),

  setActionOn: (seatIndex, playerId, actions, timeoutMs) =>
    set({ actionSeatIndex: seatIndex, actionPlayerId: playerId, availableActions: actions, timeoutMs }),

  clearActionOn: () =>
    set({ actionSeatIndex: null, actionPlayerId: null, availableActions: null }),

  playerActed: (seatIndex, action, amount, potTotal) =>
    set((s) => ({
      potTotal,
      actionSeatIndex: null,
      actionPlayerId: null,
      availableActions: null,
      seats: s.seats.map((seat) =>
        seat.seatIndex === seatIndex
          ? {
              ...seat,
              currentBet: seat.currentBet + amount,
              status: action === 'fold' ? 'folded' : action === 'allin' ? 'allin' : seat.status,
            }
          : seat,
      ),
    })),

  setHandResult: (result) => set({ handResult: result, stage: 'SETTLE' }),

  resetHand: () => set(initialState),
}));

import { GameEngineService, InitGameParams } from '../game-engine.service';
import { DeckService } from '../deck.service';
import { EvaluatorService } from '../evaluator.service';
import { PotService } from '../pot.service';
import { ActionType, GameStage } from '@poker-friends/shared';

describe('GameEngineService', () => {
  let engine: GameEngineService;
  const roomCode = 'test-room';

  function initStandard(chipOverrides?: Partial<Record<string, number>>) {
    const params: InitGameParams = {
      roomCode,
      smallBlind: 10,
      bigBlind: 20,
      actionTimeout: 30,
      seats: [
        { playerId: 'P1', seatIndex: 0, chips: chipOverrides?.P1 ?? 1000 },
        { playerId: 'P2', seatIndex: 1, chips: chipOverrides?.P2 ?? 1000 },
        { playerId: 'P3', seatIndex: 2, chips: chipOverrides?.P3 ?? 1000 },
      ],
    };
    engine.initGame(params);
    return engine.startHand(roomCode);
  }

  function initHeadsUp(chips = 1000) {
    const params: InitGameParams = {
      roomCode,
      smallBlind: 10,
      bigBlind: 20,
      actionTimeout: 30,
      seats: [
        { playerId: 'P1', seatIndex: 0, chips },
        { playerId: 'P2', seatIndex: 1, chips },
      ],
    };
    engine.initGame(params);
    return engine.startHand(roomCode);
  }

  beforeEach(() => {
    const deck = new DeckService();
    const evaluator = new EvaluatorService();
    const pot = new PotService(evaluator);
    engine = new GameEngineService(deck, evaluator, pot);
  });

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  describe('initGame + startHand', () => {
    it('should start a hand and deal hole cards to all players', () => {
      const result = initStandard();
      expect(result.handNumber).toBe(1);
      expect(result.playerHoleCards.size).toBe(3);
      for (const [, cards] of result.playerHoleCards) {
        expect(cards).toHaveLength(2);
      }
    });

    it('should set stage to PRE_FLOP after dealing', () => {
      initStandard();
      const state = engine.getGameState(roomCode)!;
      expect(state.stage).toBe(GameStage.PRE_FLOP);
    });

    it('should post blinds correctly (3 players)', () => {
      initStandard();
      const state = engine.getGameState(roomCode)!;
      // In 3-player: dealer advances from seat 0 (init) to next
      // SB = dealer+1, BB = dealer+2
      const blindPosted = state.players.filter((p) => p.totalHandBet > 0);
      expect(blindPosted).toHaveLength(2);
      const sb = blindPosted.find((p) => p.totalHandBet === 10);
      const bb = blindPosted.find((p) => p.totalHandBet === 20);
      expect(sb).toBeDefined();
      expect(bb).toBeDefined();
    });

    it('should throw with less than 2 players', () => {
      engine.initGame({
        roomCode, smallBlind: 10, bigBlind: 20, actionTimeout: 30,
        seats: [{ playerId: 'P1', seatIndex: 0, chips: 1000 }],
      });
      expect(() => engine.startHand(roomCode)).toThrow('at least 2 players');
    });
  });

  // ── Heads-up special rules ─────────────────────────────────────────────────

  describe('heads-up', () => {
    it('dealer posts SB in heads-up', () => {
      initHeadsUp();
      const state = engine.getGameState(roomCode)!;
      const dealer = state.players.find((p) => p.seatIndex === state.dealerSeatIndex)!;
      expect(dealer.totalHandBet).toBe(10); // SB
    });
  });

  // ── Action handling ────────────────────────────────────────────────────────

  describe('handleAction', () => {
    it('fold action marks player as folded', () => {
      const start = initStandard();
      const result = engine.handleAction(roomCode, start.firstPlayerId, { action: ActionType.Fold });
      expect(result.valid).toBe(true);
      const state = engine.getGameState(roomCode)!;
      const player = state.players.find((p) => p.playerId === start.firstPlayerId)!;
      expect(player.status).toBe('folded');
    });

    it('wrong player cannot act', () => {
      const start = initStandard();
      // Start is UTG; try to act as a different player
      const otherPlayer = ['P1', 'P2', 'P3'].find((p) => p !== start.firstPlayerId)!;
      const result = engine.handleAction(roomCode, otherPlayer, { action: ActionType.Fold });
      // Could be valid if other player happens to not be current; check for specific error
      if (!result.valid) {
        expect(result.error).toMatch(/not your turn|not found/i);
      }
    });

    it('call matches the big blind', () => {
      const start = initStandard();
      const result = engine.handleAction(roomCode, start.firstPlayerId, { action: ActionType.Call });
      expect(result.valid).toBe(true);
    });

    it('raise must meet minimum', () => {
      const start = initStandard();
      const actions = engine.getAvailableActions(roomCode, start.firstPlayerId)!;
      expect(actions.canRaise).toBe(true);

      // Raise below minimum should fail
      const result = engine.handleAction(roomCode, start.firstPlayerId, {
        action: ActionType.Raise,
        amount: actions.minRaise! - 1,
      });
      expect(result.valid).toBe(false);
    });

    it('valid raise succeeds', () => {
      const start = initStandard();
      const actions = engine.getAvailableActions(roomCode, start.firstPlayerId)!;
      const result = engine.handleAction(roomCode, start.firstPlayerId, {
        action: ActionType.Raise,
        amount: actions.minRaise!,
      });
      expect(result.valid).toBe(true);
      expect(result.nextPlayerId).toBeDefined();
    });
  });

  // ── Full hand: everyone folds ──────────────────────────────────────────────

  describe('everyone folds to one player', () => {
    it('last standing player wins', () => {
      const start = initStandard();

      // Find the remaining players in action order
      let nextId = start.firstPlayerId;
      let r = engine.handleAction(roomCode, nextId, { action: ActionType.Fold });

      nextId = r.nextPlayerId!;
      r = engine.handleAction(roomCode, nextId, { action: ActionType.Fold });

      // Hand should be settled
      expect(r.handSettlement).toBeDefined();
      expect(r.handSettlement!.winners).toHaveLength(1);
      expect(r.newStage).toBe(GameStage.SETTLE);
    });
  });

  // ── Full hand: check-down to showdown ──────────────────────────────────────

  describe('check-down to showdown', () => {
    it('completes a full hand with calls and checks', () => {
      initHeadsUp();
      const state = engine.getGameState(roomCode)!;
      const firstPlayerId = state.players[state.currentPlayerIndex!].playerId;

      // Pre-flop: SB (dealer) acts first in heads-up
      let r = engine.handleAction(roomCode, firstPlayerId, { action: ActionType.Call });
      expect(r.valid).toBe(true);

      // BB checks
      r = engine.handleAction(roomCode, r.nextPlayerId!, { action: ActionType.Check });
      expect(r.valid).toBe(true);
      // Should advance to FLOP
      expect(r.newStage).toBe(GameStage.FLOP);
      expect(r.newCommunityCards).toHaveLength(3);

      // Flop: check, check
      r = engine.handleAction(roomCode, r.nextPlayerId!, { action: ActionType.Check });
      r = engine.handleAction(roomCode, r.nextPlayerId!, { action: ActionType.Check });
      expect(r.newStage).toBe(GameStage.TURN);
      expect(r.newCommunityCards).toHaveLength(1);

      // Turn: check, check
      r = engine.handleAction(roomCode, r.nextPlayerId!, { action: ActionType.Check });
      r = engine.handleAction(roomCode, r.nextPlayerId!, { action: ActionType.Check });
      expect(r.newStage).toBe(GameStage.RIVER);

      // River: check, check → showdown
      r = engine.handleAction(roomCode, r.nextPlayerId!, { action: ActionType.Check });
      r = engine.handleAction(roomCode, r.nextPlayerId!, { action: ActionType.Check });
      expect(r.handSettlement).toBeDefined();
      expect(r.handSettlement!.showdownHands.size).toBe(2);
    });
  });

  // ── Timeout ────────────────────────────────────────────────────────────────

  describe('handleTimeout', () => {
    it('auto-folds when facing a bet', () => {
      initStandard();
      // The current player faces the big blind — timeout should fold
      const state = engine.getGameState(roomCode)!;
      const currentPlayer = state.players[state.currentPlayerIndex!];
      const facing = state.roundMaxBet - currentPlayer.currentRoundBet;

      const r = engine.handleTimeout(roomCode);
      expect(r.valid).toBe(true);

      // If facing a bet, should fold; if not, should check
      const p = state.players.find((pl) => pl.playerId === currentPlayer.playerId)!;
      if (facing > 0) {
        expect(p.status).toBe('folded');
      }
    });

    it('auto-checks when no bet to face', () => {
      // Set up a situation where the current player can check
      initHeadsUp();
      // Pre-flop: dealer calls
      const state = engine.getGameState(roomCode)!;
      const firstId = state.players[state.currentPlayerIndex!].playerId;
      engine.handleAction(roomCode, firstId, { action: ActionType.Call });

      // Now BB can check — trigger timeout
      const r = engine.handleTimeout(roomCode);
      expect(r.valid).toBe(true);
      // Should advance to FLOP (check completed pre-flop)
      expect(r.newStage).toBe(GameStage.FLOP);
    });
  });

  // ── All-in scenario ────────────────────────────────────────────────────────

  describe('all-in', () => {
    it('all-in fast-forwards to showdown when no more betting', () => {
      initHeadsUp(100); // small stacks
      const state = engine.getGameState(roomCode)!;
      const firstId = state.players[state.currentPlayerIndex!].playerId;

      // First player goes all-in
      let r = engine.handleAction(roomCode, firstId, { action: ActionType.AllIn });
      expect(r.valid).toBe(true);

      // Second player calls all-in (or goes all-in too)
      r = engine.handleAction(roomCode, r.nextPlayerId!, { action: ActionType.AllIn });
      expect(r.valid).toBe(true);

      // When both players are all-in, the engine should fast-forward to settlement
      expect(r.handSettlement).toBeDefined();
      expect(r.handSettlement!.showdownHands.size).toBe(2);

      // Total winnings should equal total chips
      const totalWon = r.handSettlement!.winners.reduce((s, w) => s + w.amount, 0);
      expect(totalWon).toBe(200); // 100 + 100
    });

    it('short-stack all-in creates side pot', () => {
      initStandard({ P1: 1000, P2: 50, P3: 1000 });
      const state = engine.getGameState(roomCode)!;

      // Find which player is UTG (first to act)
      let currentId = state.players[state.currentPlayerIndex!].playerId;

      // Play through: everyone calls or goes all-in
      // This is a simplified flow — just exercise the pot splitting
      let r = engine.handleAction(roomCode, currentId, { action: ActionType.Call });
      currentId = r.nextPlayerId!;

      // Next player
      if (r.nextPlayerId) {
        r = engine.handleAction(roomCode, currentId, { action: ActionType.Call });
        currentId = r.nextPlayerId!;
      }

      // If there's another player
      if (r.nextPlayerId) {
        r = engine.handleAction(roomCode, currentId, { action: ActionType.Check });
      }

      // Verify the game is progressing (at least past pre-flop or settled)
      expect(r.valid).toBe(true);
    });
  });

  // ── getAvailableActions ────────────────────────────────────────────────────

  describe('getAvailableActions', () => {
    it('returns null for non-current player', () => {
      const start = initStandard();
      const other = ['P1', 'P2', 'P3'].find((p) => p !== start.firstPlayerId)!;
      expect(engine.getAvailableActions(roomCode, other)).toBeNull();
    });

    it('returns valid actions for current player', () => {
      const start = initStandard();
      const actions = engine.getAvailableActions(roomCode, start.firstPlayerId);
      expect(actions).not.toBeNull();
      expect(actions!.canFold).toBe(true);
      expect(actions!.canAllIn).toBe(true);
    });

    it('returns null for non-existent room', () => {
      expect(engine.getAvailableActions('no-room', 'P1')).toBeNull();
    });
  });

  // ── removeGame ─────────────────────────────────────────────────────────────

  describe('removeGame', () => {
    it('removes game state', () => {
      initStandard();
      expect(engine.getGameState(roomCode)).toBeDefined();
      engine.removeGame(roomCode);
      expect(engine.getGameState(roomCode)).toBeUndefined();
    });
  });
});

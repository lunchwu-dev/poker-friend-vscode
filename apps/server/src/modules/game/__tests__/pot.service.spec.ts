import { PotService } from '../pot.service';
import { EvaluatorService } from '../evaluator.service';
import { Pot, Card, Rank } from '@poker-friends/shared';
import { HandRanking, HAND_RANKING_NAMES } from '@poker-friends/shared';

describe('PotService', () => {
  let service: PotService;

  beforeEach(() => {
    service = new PotService(new EvaluatorService());
  });

  // ── calculatePots ──────────────────────────────────────────────────────────

  describe('calculatePots', () => {
    it('single main pot — no all-ins', () => {
      const contributions = new Map([['A', 100], ['B', 100], ['C', 100]]);
      const allIn = new Set<string>();
      const pots = service.calculatePots(contributions, allIn);
      expect(pots).toHaveLength(1);
      expect(pots[0].amount).toBe(300);
      expect(pots[0].eligiblePlayerIds.sort()).toEqual(['A', 'B', 'C']);
    });

    it('one all-in creates main + side pot', () => {
      // A goes all-in for 50, B and C call/bet 100
      const contributions = new Map([['A', 50], ['B', 100], ['C', 100]]);
      const allIn = new Set(['A']);
      const pots = service.calculatePots(contributions, allIn);

      // Main pot: 50 × 3 = 150 (A, B, C eligible)
      // Side pot: 50 × 2 = 100 (B, C eligible)
      expect(pots).toHaveLength(2);
      expect(pots[0].amount).toBe(150);
      expect(pots[0].eligiblePlayerIds.sort()).toEqual(['A', 'B', 'C']);
      expect(pots[1].amount).toBe(100);
      expect(pots[1].eligiblePlayerIds.sort()).toEqual(['B', 'C']);
    });

    it('two all-ins at different levels', () => {
      // A: 30 all-in, B: 70 all-in, C: 100
      const contributions = new Map([['A', 30], ['B', 70], ['C', 100]]);
      const allIn = new Set(['A', 'B']);
      const pots = service.calculatePots(contributions, allIn);

      // Pot 1: 30 × 3 = 90 (A, B, C)
      // Pot 2: 40 × 2 = 80 (B, C)
      // Pot 3: 30 × 1 = 30 (C)
      expect(pots).toHaveLength(3);
      expect(pots[0].amount).toBe(90);
      expect(pots[0].eligiblePlayerIds).toContain('A');
      expect(pots[1].amount).toBe(80);
      expect(pots[1].eligiblePlayerIds.sort()).toEqual(['B', 'C']);
      expect(pots[2].amount).toBe(30);
      expect(pots[2].eligiblePlayerIds).toEqual(['C']);
    });

    it('all players same contribution — merged into one', () => {
      const contributions = new Map([['A', 200], ['B', 200]]);
      const allIn = new Set(['A', 'B']);
      const pots = service.calculatePots(contributions, allIn);
      expect(pots).toHaveLength(1);
      expect(pots[0].amount).toBe(400);
    });

    it('empty contributions returns empty', () => {
      const pots = service.calculatePots(new Map(), new Set());
      expect(pots).toHaveLength(0);
    });

    it('folded player partial contribution counted', () => {
      // A folded after betting 30, B and C still in at 100
      const contributions = new Map([['A', 30], ['B', 100], ['C', 100]]);
      const allIn = new Set<string>();
      const pots = service.calculatePots(contributions, allIn);
      // All 230 chips in one pot (no all-in caps = max level 100)
      expect(service.totalChips(pots)).toBe(230);
    });
  });

  // ── distributePots ─────────────────────────────────────────────────────────

  describe('distributePots', () => {
    const makeHand = (ranking: HandRanking, keyValues: number[]) => ({
      rank: ranking,
      rankName: HAND_RANKING_NAMES[ranking],
      bestCards: [] as Card[],
      keyValues,
    });

    it('single pot, single winner', () => {
      const pots: Pot[] = [{ amount: 300, eligiblePlayerIds: ['A', 'B', 'C'] }];
      const hands = new Map([
        ['A', makeHand(HandRanking.OnePair, [Rank.Ace])],
        ['B', makeHand(HandRanking.TwoPair, [Rank.King, Rank.Queen, Rank.Five])],
        ['C', makeHand(HandRanking.HighCard, [Rank.King])],
      ]);
      const result = service.distributePots(pots, hands, ['A', 'B', 'C']);
      // B has TwoPair which beats OnePair
      expect(result).toHaveLength(1);
      expect(result[0].playerId).toBe('B');
      expect(result[0].amount).toBe(300);
    });

    it('split pot — tie', () => {
      const pots: Pot[] = [{ amount: 200, eligiblePlayerIds: ['A', 'B'] }];
      const hands = new Map([
        ['A', makeHand(HandRanking.OnePair, [Rank.Ace, Rank.King, Rank.Queen, Rank.Jack])],
        ['B', makeHand(HandRanking.OnePair, [Rank.Ace, Rank.King, Rank.Queen, Rank.Jack])],
      ]);
      const result = service.distributePots(pots, hands, ['A', 'B']);
      expect(result).toHaveLength(2);
      expect(result.find((r) => r.playerId === 'A')!.amount).toBe(100);
      expect(result.find((r) => r.playerId === 'B')!.amount).toBe(100);
    });

    it('odd chip goes to first player in eligibility order', () => {
      const pots: Pot[] = [{ amount: 301, eligiblePlayerIds: ['A', 'B'] }];
      const hands = new Map([
        ['A', makeHand(HandRanking.OnePair, [Rank.Ace])],
        ['B', makeHand(HandRanking.OnePair, [Rank.Ace])],
      ]);
      // B is first in eligibility order
      const result = service.distributePots(pots, hands, ['B', 'A']);
      const bWinnings = result.find((r) => r.playerId === 'B')!.amount;
      const aWinnings = result.find((r) => r.playerId === 'A')!.amount;
      expect(bWinnings).toBe(151); // gets the odd chip
      expect(aWinnings).toBe(150);
    });

    it('side pot won by different player', () => {
      const pots: Pot[] = [
        { amount: 150, eligiblePlayerIds: ['A', 'B', 'C'] },
        { amount: 100, eligiblePlayerIds: ['B', 'C'] },
      ];
      const hands = new Map([
        ['A', makeHand(HandRanking.Flush, [Rank.Ace])],   // best hand but only in main pot
        ['B', makeHand(HandRanking.TwoPair, [Rank.King, Rank.Queen, Rank.Five])],
        ['C', makeHand(HandRanking.OnePair, [Rank.Jack])],
      ]);
      const result = service.distributePots(pots, hands, ['A', 'B', 'C']);
      const aWin = result.find((r) => r.playerId === 'A')!.amount;
      const bWin = result.find((r) => r.playerId === 'B')!.amount;
      expect(aWin).toBe(150);  // wins main pot
      expect(bWin).toBe(100);  // wins side pot
    });

    it('folded player not eligible to win', () => {
      const pots: Pot[] = [{ amount: 300, eligiblePlayerIds: ['A', 'B', 'C'] }];
      // A folded — not in handResults
      const hands = new Map([
        ['B', makeHand(HandRanking.HighCard, [Rank.King])],
        ['C', makeHand(HandRanking.HighCard, [Rank.Queen])],
      ]);
      const result = service.distributePots(pots, hands, ['A', 'B', 'C']);
      expect(result).toHaveLength(1);
      expect(result[0].playerId).toBe('B');
      expect(result[0].amount).toBe(300);
    });
  });

  // ── totalChips ─────────────────────────────────────────────────────────────

  describe('totalChips', () => {
    it('sums all pots', () => {
      const pots: Pot[] = [
        { amount: 150, eligiblePlayerIds: ['A', 'B'] },
        { amount: 100, eligiblePlayerIds: ['B'] },
      ];
      expect(service.totalChips(pots)).toBe(250);
    });

    it('returns 0 for empty', () => {
      expect(service.totalChips([])).toBe(0);
    });
  });
});

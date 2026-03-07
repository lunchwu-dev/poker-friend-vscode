import { EvaluatorService } from '../evaluator.service';
import { Card, Suit, Rank } from '@poker-friends/shared';
import { HandRanking } from '@poker-friends/shared';

/** Helper: create a card with short notation */
const c = (rank: Rank, suit: Suit): Card => ({ rank, suit });
const S = Suit.Spades;
const H = Suit.Hearts;
const D = Suit.Diamonds;
const C = Suit.Clubs;

describe('EvaluatorService', () => {
  let service: EvaluatorService;

  beforeEach(() => {
    service = new EvaluatorService();
  });

  // ── 5-card evaluation ──────────────────────────────────────────────────────

  describe('evaluateHand (5-card)', () => {
    it('Royal Flush', () => {
      const cards = [c(Rank.Ace, S), c(Rank.King, S), c(Rank.Queen, S), c(Rank.Jack, S), c(Rank.Ten, S)];
      const result = service.evaluateHand(cards);
      expect(result.rank).toBe(HandRanking.RoyalFlush);
      expect(result.rankName).toBe('皇家同花顺');
    });

    it('Straight Flush (9-high)', () => {
      const cards = [c(Rank.Nine, H), c(Rank.Eight, H), c(Rank.Seven, H), c(Rank.Six, H), c(Rank.Five, H)];
      const result = service.evaluateHand(cards);
      expect(result.rank).toBe(HandRanking.StraightFlush);
      expect(result.keyValues[0]).toBe(Rank.Nine);
    });

    it('Straight Flush — wheel A-2-3-4-5', () => {
      const cards = [c(Rank.Five, D), c(Rank.Four, D), c(Rank.Three, D), c(Rank.Two, D), c(Rank.Ace, D)];
      const result = service.evaluateHand(cards);
      expect(result.rank).toBe(HandRanking.StraightFlush);
      expect(result.keyValues[0]).toBe(5); // high card is 5
    });

    it('Four of a Kind', () => {
      const cards = [c(Rank.Jack, S), c(Rank.Jack, H), c(Rank.Jack, D), c(Rank.Jack, C), c(Rank.Three, S)];
      const result = service.evaluateHand(cards);
      expect(result.rank).toBe(HandRanking.FourOfAKind);
      expect(result.keyValues[0]).toBe(Rank.Jack);
      expect(result.keyValues[1]).toBe(Rank.Three); // kicker
    });

    it('Full House', () => {
      const cards = [c(Rank.Ten, S), c(Rank.Ten, H), c(Rank.Ten, D), c(Rank.Four, C), c(Rank.Four, S)];
      const result = service.evaluateHand(cards);
      expect(result.rank).toBe(HandRanking.FullHouse);
      expect(result.keyValues).toEqual([Rank.Ten, Rank.Four]);
    });

    it('Flush', () => {
      const cards = [c(Rank.King, C), c(Rank.Jack, C), c(Rank.Nine, C), c(Rank.Six, C), c(Rank.Two, C)];
      const result = service.evaluateHand(cards);
      expect(result.rank).toBe(HandRanking.Flush);
      expect(result.keyValues[0]).toBe(Rank.King);
    });

    it('Straight (T-high)', () => {
      const cards = [c(Rank.Ten, S), c(Rank.Nine, H), c(Rank.Eight, D), c(Rank.Seven, C), c(Rank.Six, S)];
      const result = service.evaluateHand(cards);
      expect(result.rank).toBe(HandRanking.Straight);
      expect(result.keyValues[0]).toBe(Rank.Ten);
    });

    it('Straight — wheel A-2-3-4-5', () => {
      const cards = [c(Rank.Five, S), c(Rank.Four, H), c(Rank.Three, D), c(Rank.Two, C), c(Rank.Ace, S)];
      const result = service.evaluateHand(cards);
      expect(result.rank).toBe(HandRanking.Straight);
      expect(result.keyValues[0]).toBe(5);
    });

    it('Three of a Kind', () => {
      const cards = [c(Rank.Seven, S), c(Rank.Seven, H), c(Rank.Seven, D), c(Rank.King, C), c(Rank.Two, S)];
      const result = service.evaluateHand(cards);
      expect(result.rank).toBe(HandRanking.ThreeOfAKind);
      expect(result.keyValues[0]).toBe(Rank.Seven);
    });

    it('Two Pair', () => {
      const cards = [c(Rank.Ace, S), c(Rank.Ace, H), c(Rank.Eight, D), c(Rank.Eight, C), c(Rank.Five, S)];
      const result = service.evaluateHand(cards);
      expect(result.rank).toBe(HandRanking.TwoPair);
      expect(result.keyValues).toEqual([Rank.Ace, Rank.Eight, Rank.Five]);
    });

    it('One Pair', () => {
      const cards = [c(Rank.Queen, S), c(Rank.Queen, H), c(Rank.Nine, D), c(Rank.Six, C), c(Rank.Three, S)];
      const result = service.evaluateHand(cards);
      expect(result.rank).toBe(HandRanking.OnePair);
      expect(result.keyValues[0]).toBe(Rank.Queen);
    });

    it('High Card', () => {
      const cards = [c(Rank.Ace, S), c(Rank.Jack, H), c(Rank.Nine, D), c(Rank.Six, C), c(Rank.Three, S)];
      const result = service.evaluateHand(cards);
      expect(result.rank).toBe(HandRanking.HighCard);
      expect(result.keyValues[0]).toBe(Rank.Ace);
    });

    it('should throw when not given exactly 5 cards', () => {
      const cards = [c(Rank.Ace, S), c(Rank.King, S)];
      expect(() => service.evaluateHand(cards)).toThrow('exactly 5 cards');
    });
  });

  // ── 7-card best hand evaluation ────────────────────────────────────────────

  describe('evaluateBestHand (7-card)', () => {
    it('should find the best hand from 7 cards', () => {
      const hole: Card[] = [c(Rank.Ace, S), c(Rank.King, S)];
      const community: Card[] = [
        c(Rank.Queen, S), c(Rank.Jack, S), c(Rank.Ten, S),
        c(Rank.Two, H), c(Rank.Three, D),
      ];
      const result = service.evaluateBestHand(hole, community);
      expect(result.rank).toBe(HandRanking.RoyalFlush);
    });

    it('should choose the strongest 5 from 7', () => {
      // Hole: pair of Aces, community has pair of Kings + junk
      const hole: Card[] = [c(Rank.Ace, S), c(Rank.Ace, H)];
      const community: Card[] = [
        c(Rank.King, D), c(Rank.King, C), c(Rank.Seven, S),
        c(Rank.Three, H), c(Rank.Two, D),
      ];
      const result = service.evaluateBestHand(hole, community);
      expect(result.rank).toBe(HandRanking.TwoPair);
      expect(result.keyValues[0]).toBe(Rank.Ace);
      expect(result.keyValues[1]).toBe(Rank.King);
    });

    it('should identify full house from 7 cards with trips + two pairs', () => {
      const hole: Card[] = [c(Rank.Nine, S), c(Rank.Nine, H)];
      const community: Card[] = [
        c(Rank.Nine, D), c(Rank.Six, C), c(Rank.Six, S),
        c(Rank.Two, H), c(Rank.Two, D),
      ];
      const result = service.evaluateBestHand(hole, community);
      expect(result.rank).toBe(HandRanking.FullHouse);
      expect(result.keyValues[0]).toBe(Rank.Nine);
      expect(result.keyValues[1]).toBe(Rank.Six); // best pair kicker
    });
  });

  // ── Hand comparison ────────────────────────────────────────────────────────

  describe('compareHands', () => {
    it('higher ranking beats lower ranking', () => {
      const flush = service.evaluateHand([c(Rank.King, S), c(Rank.Jack, S), c(Rank.Nine, S), c(Rank.Seven, S), c(Rank.Two, S)]);
      const straight = service.evaluateHand([c(Rank.Nine, S), c(Rank.Eight, H), c(Rank.Seven, D), c(Rank.Six, C), c(Rank.Five, S)]);
      expect(service.compareHands(flush, straight)).toBeGreaterThan(0);
    });

    it('same ranking: higher kicker wins', () => {
      const pairAces = service.evaluateHand([c(Rank.Ace, S), c(Rank.Ace, H), c(Rank.King, D), c(Rank.Seven, C), c(Rank.Two, S)]);
      const pairKings = service.evaluateHand([c(Rank.King, S), c(Rank.King, H), c(Rank.Ace, D), c(Rank.Seven, C), c(Rank.Two, S)]);
      expect(service.compareHands(pairAces, pairKings)).toBeGreaterThan(0);
    });

    it('exact same hand returns 0', () => {
      const h1 = service.evaluateHand([c(Rank.Ace, S), c(Rank.King, H), c(Rank.Queen, D), c(Rank.Jack, C), c(Rank.Nine, S)]);
      const h2 = service.evaluateHand([c(Rank.Ace, H), c(Rank.King, D), c(Rank.Queen, C), c(Rank.Jack, S), c(Rank.Nine, H)]);
      expect(service.compareHands(h1, h2)).toBe(0);
    });

    it('two-pair kicker comparison', () => {
      // AA88K vs AA887
      const h1 = service.evaluateHand([c(Rank.Ace, S), c(Rank.Ace, H), c(Rank.Eight, D), c(Rank.Eight, C), c(Rank.King, S)]);
      const h2 = service.evaluateHand([c(Rank.Ace, D), c(Rank.Ace, C), c(Rank.Eight, S), c(Rank.Eight, H), c(Rank.Seven, S)]);
      expect(service.compareHands(h1, h2)).toBeGreaterThan(0);
    });

    it('flush comparison by highest card', () => {
      const flushA = service.evaluateHand([c(Rank.Ace, S), c(Rank.Jack, S), c(Rank.Nine, S), c(Rank.Seven, S), c(Rank.Two, S)]);
      const flushK = service.evaluateHand([c(Rank.King, S), c(Rank.Jack, S), c(Rank.Nine, S), c(Rank.Seven, S), c(Rank.Two, S)]);
      expect(service.compareHands(flushA, flushK)).toBeGreaterThan(0);
    });
  });

  // ── getCombinations ────────────────────────────────────────────────────────

  describe('getCombinations', () => {
    it('C(7,5) = 21 combinations', () => {
      const arr = [1, 2, 3, 4, 5, 6, 7];
      expect(service.getCombinations(arr, 5)).toHaveLength(21);
    });

    it('C(5,5) = 1 combination', () => {
      const arr = [1, 2, 3, 4, 5];
      const combos = service.getCombinations(arr, 5);
      expect(combos).toHaveLength(1);
      expect(combos[0]).toEqual([1, 2, 3, 4, 5]);
    });
  });
});

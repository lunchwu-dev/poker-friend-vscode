import { Injectable } from '@nestjs/common';
import { Card, HandResult, Rank } from '@poker-friends/shared';
import { HandRanking, HAND_RANKING_NAMES } from '@poker-friends/shared';

@Injectable()
export class EvaluatorService {
  /**
   * Evaluates the best possible 5-card hand from 7 cards
   * (2 hole cards + 5 community cards, or any subset up to 7).
   */
  evaluateBestHand(holeCards: Card[], communityCards: Card[]): HandResult {
    const all = [...holeCards, ...communityCards];
    const combos = this.getCombinations(all, 5);
    let best: HandResult | null = null;
    for (const combo of combos) {
      const result = this.evaluateHand(combo);
      if (!best || this.compareHands(result, best) > 0) {
        best = result;
      }
    }
    return best!;
  }

  /**
   * Evaluates exactly 5 cards and returns the hand type + key values
   * used for comparison.
   */
  evaluateHand(cards: Card[]): HandResult {
    if (cards.length !== 5) {
      throw new Error(`evaluateHand requires exactly 5 cards, got ${cards.length}`);
    }

    // Sort descending by rank
    const sorted = [...cards].sort((a, b) => b.rank - a.rank);
    const ranks = sorted.map((c) => c.rank);
    const suits = sorted.map((c) => c.suit);

    const isFlush = suits.every((s) => s === suits[0]);
    const straightHigh = this.getStraightHighCard(ranks); // null if not a straight
    const isStraight = straightHigh !== null;

    // --- Straight Flush / Royal Flush ---
    if (isFlush && isStraight) {
      if (straightHigh === Rank.Ace && ranks[1] === Rank.King) {
        return this.make(HandRanking.RoyalFlush, sorted, [Rank.Ace]);
      }
      return this.make(HandRanking.StraightFlush, sorted, [straightHigh]);
    }

    // Build frequency map: rank → count
    const freq = new Map<number, number>();
    for (const r of ranks) freq.set(r, (freq.get(r) ?? 0) + 1);

    // Sort groups: first by frequency desc, then by rank desc
    const groups = [...freq.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
    const [top, second] = groups;

    // --- Four of a Kind ---
    if (top[1] === 4) {
      const kicker = groups.find((g) => g[1] === 1)![0];
      return this.make(HandRanking.FourOfAKind, sorted, [top[0], kicker]);
    }

    // --- Full House ---
    if (top[1] === 3 && second?.[1] === 2) {
      return this.make(HandRanking.FullHouse, sorted, [top[0], second[0]]);
    }

    // --- Flush ---
    if (isFlush) {
      return this.make(HandRanking.Flush, sorted, ranks);
    }

    // --- Straight ---
    if (isStraight) {
      // Reorder bestCards for the wheel (A-2-3-4-5): put ace last
      const bestCards =
        straightHigh === 5 && ranks[0] === Rank.Ace
          ? [...sorted.slice(1), sorted[0]]
          : sorted;
      return this.make(HandRanking.Straight, bestCards, [straightHigh]);
    }

    // --- Three of a Kind ---
    if (top[1] === 3) {
      const kickers = groups
        .filter((g) => g[1] === 1)
        .map((g) => g[0])
        .sort((a, b) => b - a);
      return this.make(HandRanking.ThreeOfAKind, sorted, [top[0], ...kickers]);
    }

    // --- Two Pair ---
    if (top[1] === 2 && second?.[1] === 2) {
      const pairs = groups
        .filter((g) => g[1] === 2)
        .map((g) => g[0])
        .sort((a, b) => b - a);
      const kicker = groups.find((g) => g[1] === 1)![0];
      return this.make(HandRanking.TwoPair, sorted, [pairs[0], pairs[1], kicker]);
    }

    // --- One Pair ---
    if (top[1] === 2) {
      const kickers = groups
        .filter((g) => g[1] === 1)
        .map((g) => g[0])
        .sort((a, b) => b - a);
      return this.make(HandRanking.OnePair, sorted, [top[0], ...kickers]);
    }

    // --- High Card ---
    return this.make(HandRanking.HighCard, sorted, ranks);
  }

  /**
   * Compares two HandResults.
   * Returns > 0 if a is better, < 0 if b is better, 0 if equal.
   */
  compareHands(a: HandResult, b: HandResult): number {
    // Lower rank number = stronger hand
    if (a.rank !== b.rank) return b.rank - a.rank;

    // Same category: compare keyValues lexicographically
    const len = Math.max(a.keyValues.length, b.keyValues.length);
    for (let i = 0; i < len; i++) {
      const av = a.keyValues[i] ?? 0;
      const bv = b.keyValues[i] ?? 0;
      if (av !== bv) return av - bv;
    }
    return 0; // exact tie
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Returns the high-card rank of a straight, or null if not a straight.
   * Handles the wheel (A-2-3-4-5) where the high card is 5.
   * ranks must be sorted descending.
   */
  private getStraightHighCard(ranks: number[]): number | null {
    // Need 5 unique ranks
    if (new Set(ranks).size !== 5) return null;

    // Normal straight: top rank minus bottom rank equals 4
    if (ranks[0] - ranks[4] === 4) return ranks[0];

    // Wheel: A-5-4-3-2  (ranks = [14, 5, 4, 3, 2])
    if (ranks[0] === Rank.Ace && ranks[1] === 5 && ranks[2] === 4 && ranks[3] === 3 && ranks[4] === 2) {
      return 5;
    }

    return null;
  }

  /** Generates all C(n, k) combinations of the array */
  getCombinations<T>(arr: T[], k: number): T[][] {
    const result: T[][] = [];
    const combo: T[] = [];

    const recurse = (start: number) => {
      if (combo.length === k) {
        result.push([...combo]);
        return;
      }
      for (let i = start; i < arr.length; i++) {
        combo.push(arr[i]);
        recurse(i + 1);
        combo.pop();
      }
    };

    recurse(0);
    return result;
  }

  /** Convenience builder for HandResult */
  private make(ranking: HandRanking, bestCards: Card[], keyValues: number[]): HandResult {
    return {
      rank: ranking,
      rankName: HAND_RANKING_NAMES[ranking],
      bestCards,
      keyValues,
    };
  }
}

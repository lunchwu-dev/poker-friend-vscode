import { Injectable } from '@nestjs/common';
import { Pot, HandResult } from '@poker-friends/shared';
import { PotDistribution } from './types/engine.types';
import { EvaluatorService } from './evaluator.service';

@Injectable()
export class PotService {
  constructor(private readonly evaluator: EvaluatorService) {}

  /**
   * Calculates main pot and any side pots based on each player's
   * total contribution to the hand.
   *
   * @param contributions Map<playerId, totalChipsCommittedThisHand>
   *   - Includes both all-in and non-all-in players.
   *   - Folded players still count toward pots they were eligible for.
   * @param allInPlayerIds Set of player IDs who are all-in (determines pot caps)
   */
  calculatePots(contributions: Map<string, number>, allInPlayerIds: Set<string>): Pot[] {
    if (contributions.size === 0) return [];

    // Collect distinct contribution levels from all-in players (they cap side pots)
    const allInLevels = [...contributions.entries()]
      .filter(([id]) => allInPlayerIds.has(id))
      .map(([, amount]) => amount)
      .sort((a, b) => a - b);

    // Include max contribution as final level
    const maxContribution = Math.max(...contributions.values());
    const levels = [...new Set([...allInLevels, maxContribution])].sort((a, b) => a - b);

    const pots: Pot[] = [];
    let prevLevel = 0;

    for (const level of levels) {
      const increment = level - prevLevel;
      if (increment <= 0) continue;

      let potAmount = 0;
      const eligible: string[] = [];

      for (const [playerId, contribution] of contributions) {
        if (contribution >= level) {
          // Player contributed fully up to this level
          potAmount += increment;
          eligible.push(playerId);
        } else if (contribution > prevLevel) {
          // Player contributed partially (went all-in below this level)
          potAmount += contribution - prevLevel;
          // NOT eligible for this pot tier
        }
      }

      if (potAmount > 0) {
        pots.push({ amount: potAmount, eligiblePlayerIds: eligible });
      }

      prevLevel = level;
    }

    // Merge consecutive pots with identical eligible sets (simplification)
    return this.mergePots(pots);
  }

  /**
   * Distributes each pot to the winner(s) based on hand strength.
   *
   * @param pots  Pots calculated by calculatePots()
   * @param handResults  Map<playerId, HandResult> — only NON-FOLDED players at showdown
   * @param eligibilityOrder  Player IDs in seat order starting from player left of dealer,
   *   used to decide who gets the odd chip when splitting a pot.
   */
  distributePots(
    pots: Pot[],
    handResults: Map<string, HandResult>,
    eligibilityOrder: string[],
  ): PotDistribution[] {
    const winnings = new Map<string, number>();

    for (const pot of pots) {
      // Among eligible players, only those who haven't folded contest the pot
      const contestants = pot.eligiblePlayerIds.filter((id) => handResults.has(id));

      if (contestants.length === 0) {
        // Edge case: all eligible players folded — this should not happen in practice
        // but if it does, distribute to any remaining active player
        continue;
      }

      // Find the strongest hand among contestants
      let bestResult: HandResult | null = null;
      for (const playerId of contestants) {
        const result = handResults.get(playerId)!;
        if (!bestResult || this.evaluator.compareHands(result, bestResult) > 0) {
          bestResult = result;
        }
      }

      // Collect all players tied for the best hand
      const winners = contestants.filter(
        (id) => this.evaluator.compareHands(handResults.get(id)!, bestResult!) === 0,
      );

      // Even split
      const share = Math.floor(pot.amount / winners.length);
      const remainder = pot.amount % winners.length;

      for (const winner of winners) {
        winnings.set(winner, (winnings.get(winner) ?? 0) + share);
      }

      // Odd chips go to the first winner in eligibility order (closest to dealer's left)
      if (remainder > 0) {
        const firstWinner =
          eligibilityOrder.find((id) => winners.includes(id)) ?? winners[0];
        winnings.set(firstWinner, (winnings.get(firstWinner) ?? 0) + remainder);
      }
    }

    return [...winnings.entries()].map(([playerId, amount]) => ({ playerId, amount }));
  }

  /**
   * Returns the total chips across all pots.
   */
  totalChips(pots: Pot[]): number {
    return pots.reduce((sum, p) => sum + p.amount, 0);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Merges adjacent pots that have identical eligible player sets.
   * This simplifies output when multiple all-in levels produce the same set.
   */
  private mergePots(pots: Pot[]): Pot[] {
    if (pots.length === 0) return [];

    const merged: Pot[] = [];
    let current = { ...pots[0], eligiblePlayerIds: [...pots[0].eligiblePlayerIds] };

    for (let i = 1; i < pots.length; i++) {
      const pot = pots[i];
      const sameEligible =
        current.eligiblePlayerIds.length === pot.eligiblePlayerIds.length &&
        current.eligiblePlayerIds.every((id) => pot.eligiblePlayerIds.includes(id));

      if (sameEligible) {
        current.amount += pot.amount;
      } else {
        merged.push(current);
        current = { ...pot, eligiblePlayerIds: [...pot.eligiblePlayerIds] };
      }
    }
    merged.push(current);
    return merged;
  }
}

import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { Card, Suit, Rank } from '@poker-friends/shared';

@Injectable()
export class DeckService {
  private readonly SUITS: Suit[] = [Suit.Spades, Suit.Hearts, Suit.Diamonds, Suit.Clubs];
  private readonly RANKS: Rank[] = [
    Rank.Two, Rank.Three, Rank.Four, Rank.Five, Rank.Six,
    Rank.Seven, Rank.Eight, Rank.Nine, Rank.Ten,
    Rank.Jack, Rank.Queen, Rank.King, Rank.Ace,
  ];

  /** Creates a fresh ordered 52-card deck */
  createDeck(): Card[] {
    const deck: Card[] = [];
    for (const suit of this.SUITS) {
      for (const rank of this.RANKS) {
        deck.push({ suit, rank });
      }
    }
    return deck;
  }

  /**
   * Shuffles a deck in-place using Fisher-Yates algorithm with
   * cryptographically secure random numbers.
   * Returns the same array reference for convenience.
   */
  shuffle(deck: Card[]): Card[] {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = this.cryptoRandomInt(0, i);
      const temp = deck[i];
      deck[i] = deck[j];
      deck[j] = temp;
    }
    return deck;
  }

  /** Creates and shuffles a new deck in one call */
  createShuffledDeck(): Card[] {
    return this.shuffle(this.createDeck());
  }

  /**
   * Deals `count` cards from the front of the deck.
   * Mutates the deck array (removes dealt cards).
   */
  deal(deck: Card[], count: number): Card[] {
    if (deck.length < count) {
      throw new Error(`Not enough cards: need ${count}, have ${deck.length}`);
    }
    return deck.splice(0, count);
  }

  /** Deals exactly 1 card from the front of the deck */
  dealOne(deck: Card[]): Card {
    return this.deal(deck, 1)[0];
  }

  /**
   * Returns a cryptographically random integer in [0, max] (inclusive).
   * Uses rejection sampling to eliminate modulo bias.
   */
  private cryptoRandomInt(min: number, max: number): number {
    const range = max - min + 1;
    const bytesNeeded = Math.ceil(Math.log2(range) / 8) + 1;
    const maxAcceptable = Math.floor(256 ** bytesNeeded / range) * range;

    let value: number;
    do {
      const bytes = randomBytes(bytesNeeded);
      value = bytes.reduce((acc, byte) => acc * 256 + byte, 0);
    } while (value >= maxAcceptable);

    return min + (value % range);
  }
}

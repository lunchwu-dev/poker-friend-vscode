import { DeckService } from './deck.service';
import { Suit, Rank } from '@poker-friends/shared';

describe('DeckService', () => {
  let service: DeckService;

  beforeEach(() => {
    service = new DeckService();
  });

  describe('createDeck', () => {
    it('should create exactly 52 cards', () => {
      const deck = service.createDeck();
      expect(deck).toHaveLength(52);
    });

    it('should contain all 4 suits × 13 ranks', () => {
      const deck = service.createDeck();
      const suits = [Suit.Spades, Suit.Hearts, Suit.Diamonds, Suit.Clubs];
      const ranks = [
        Rank.Two, Rank.Three, Rank.Four, Rank.Five, Rank.Six,
        Rank.Seven, Rank.Eight, Rank.Nine, Rank.Ten,
        Rank.Jack, Rank.Queen, Rank.King, Rank.Ace,
      ];
      for (const suit of suits) {
        for (const rank of ranks) {
          expect(deck).toContainEqual({ suit, rank });
        }
      }
    });

    it('should have no duplicate cards', () => {
      const deck = service.createDeck();
      const keys = deck.map((c) => `${c.suit}${c.rank}`);
      const unique = new Set(keys);
      expect(unique.size).toBe(52);
    });
  });

  describe('shuffle', () => {
    it('should return the same array reference', () => {
      const deck = service.createDeck();
      const ref = deck;
      service.shuffle(deck);
      expect(deck).toBe(ref);
    });

    it('should still contain all 52 cards after shuffling', () => {
      const deck = service.createDeck();
      service.shuffle(deck);
      expect(deck).toHaveLength(52);
      const keys = deck.map((c) => `${c.suit}${c.rank}`);
      expect(new Set(keys).size).toBe(52);
    });

    it('should produce different orderings across multiple shuffles', () => {
      // With 52! possible permutations, the probability of two identical shuffles is ~0
      const deck1 = service.createShuffledDeck();
      const deck2 = service.createShuffledDeck();
      const same = deck1.every((c, i) => c.suit === deck2[i].suit && c.rank === deck2[i].rank);
      expect(same).toBe(false);
    });
  });

  describe('deal', () => {
    it('should deal the requested number of cards from the front', () => {
      const deck = service.createDeck();
      const firstCard = deck[0];
      const dealt = service.deal(deck, 1);
      expect(dealt).toHaveLength(1);
      expect(dealt[0]).toEqual(firstCard);
      expect(deck).toHaveLength(51);
    });

    it('should deal 2 cards and remove them from the deck', () => {
      const deck = service.createDeck();
      const hand = service.deal(deck, 2);
      expect(hand).toHaveLength(2);
      expect(deck).toHaveLength(50);
    });

    it('should throw when trying to deal more cards than the deck has', () => {
      const deck = service.createDeck();
      expect(() => service.deal(deck, 53)).toThrow('Not enough cards');
    });
  });

  describe('dealOne', () => {
    it('should deal a single card', () => {
      const deck = service.createDeck();
      const top = deck[0];
      const card = service.dealOne(deck);
      expect(card).toEqual(top);
      expect(deck).toHaveLength(51);
    });
  });
});

import { DeckService } from '../deck.service';

describe('DeckService', () => {
  let service: DeckService;

  beforeEach(() => {
    service = new DeckService();
  });

  describe('createDeck', () => {
    it('should create a 52-card deck', () => {
      const deck = service.createDeck();
      expect(deck).toHaveLength(52);
    });

    it('should contain all 4 suits × 13 ranks', () => {
      const deck = service.createDeck();
      const suits = new Set(deck.map((c) => c.suit));
      const ranks = new Set(deck.map((c) => c.rank));
      expect(suits.size).toBe(4);
      expect(ranks.size).toBe(13);
    });

    it('should have no duplicates', () => {
      const deck = service.createDeck();
      const keys = deck.map((c) => `${c.suit}${c.rank}`);
      expect(new Set(keys).size).toBe(52);
    });
  });

  describe('shuffle', () => {
    it('should return the same array reference', () => {
      const deck = service.createDeck();
      const shuffled = service.shuffle(deck);
      expect(shuffled).toBe(deck);
    });

    it('should keep all 52 cards after shuffling', () => {
      const deck = service.createShuffledDeck();
      expect(deck).toHaveLength(52);
      const keys = deck.map((c) => `${c.suit}${c.rank}`);
      expect(new Set(keys).size).toBe(52);
    });

    it('should produce different orders on separate shuffles (probabilistic)', () => {
      const d1 = service.createShuffledDeck();
      const d2 = service.createShuffledDeck();
      // Extremely unlikely that two shuffles are identical
      const same = d1.every((c, i) => c.suit === d2[i].suit && c.rank === d2[i].rank);
      expect(same).toBe(false);
    });
  });

  describe('deal', () => {
    it('should deal the requested number of cards', () => {
      const deck = service.createShuffledDeck();
      const dealt = service.deal(deck, 5);
      expect(dealt).toHaveLength(5);
      expect(deck).toHaveLength(47);
    });

    it('should deal from the front of the deck', () => {
      const deck = service.createDeck(); // ordered
      const first = { ...deck[0] };
      const dealt = service.deal(deck, 1);
      expect(dealt[0]).toEqual(first);
    });

    it('should throw when not enough cards', () => {
      const deck = service.createDeck();
      service.deal(deck, 52);
      expect(() => service.deal(deck, 1)).toThrow('Not enough cards');
    });
  });

  describe('dealOne', () => {
    it('should deal exactly one card', () => {
      const deck = service.createShuffledDeck();
      const card = service.dealOne(deck);
      expect(card).toHaveProperty('suit');
      expect(card).toHaveProperty('rank');
      expect(deck).toHaveLength(51);
    });
  });
});

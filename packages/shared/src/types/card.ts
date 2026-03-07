export enum Suit {
  Spades = 'S',
  Hearts = 'H',
  Diamonds = 'D',
  Clubs = 'C',
}

export enum Rank {
  Two = 2,
  Three = 3,
  Four = 4,
  Five = 5,
  Six = 6,
  Seven = 7,
  Eight = 8,
  Nine = 9,
  Ten = 10,
  Jack = 11,
  Queen = 12,
  King = 13,
  Ace = 14,
}

export interface Card {
  suit: Suit;
  rank: Rank;
}

export interface HandResult {
  rank: number; // 1(皇家同花顺) ~ 10(高牌)
  rankName: string;
  bestCards: Card[];
  keyValues: number[]; // 用于同牌型比较的关键值序列
}

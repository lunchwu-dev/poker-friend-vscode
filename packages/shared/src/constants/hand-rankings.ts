export enum HandRanking {
  RoyalFlush = 1,
  StraightFlush = 2,
  FourOfAKind = 3,
  FullHouse = 4,
  Flush = 5,
  Straight = 6,
  ThreeOfAKind = 7,
  TwoPair = 8,
  OnePair = 9,
  HighCard = 10,
}

export const HAND_RANKING_NAMES: Record<HandRanking, string> = {
  [HandRanking.RoyalFlush]: '皇家同花顺',
  [HandRanking.StraightFlush]: '同花顺',
  [HandRanking.FourOfAKind]: '四条',
  [HandRanking.FullHouse]: '葫芦',
  [HandRanking.Flush]: '同花',
  [HandRanking.Straight]: '顺子',
  [HandRanking.ThreeOfAKind]: '三条',
  [HandRanking.TwoPair]: '两对',
  [HandRanking.OnePair]: '一对',
  [HandRanking.HighCard]: '高牌',
};

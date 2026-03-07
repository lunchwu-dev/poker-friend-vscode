export interface UserProfile {
  id: string;
  nickname: string;
  avatar: string;
  coins: number;
  totalHands: number;
  totalWins: number;
  totalProfit: number;
  bestHandRank: number | null;
  maxSingleWin: number;
}

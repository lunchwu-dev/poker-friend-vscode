"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HAND_RANKING_NAMES = exports.HandRanking = void 0;
var HandRanking;
(function (HandRanking) {
    HandRanking[HandRanking["RoyalFlush"] = 1] = "RoyalFlush";
    HandRanking[HandRanking["StraightFlush"] = 2] = "StraightFlush";
    HandRanking[HandRanking["FourOfAKind"] = 3] = "FourOfAKind";
    HandRanking[HandRanking["FullHouse"] = 4] = "FullHouse";
    HandRanking[HandRanking["Flush"] = 5] = "Flush";
    HandRanking[HandRanking["Straight"] = 6] = "Straight";
    HandRanking[HandRanking["ThreeOfAKind"] = 7] = "ThreeOfAKind";
    HandRanking[HandRanking["TwoPair"] = 8] = "TwoPair";
    HandRanking[HandRanking["OnePair"] = 9] = "OnePair";
    HandRanking[HandRanking["HighCard"] = 10] = "HighCard";
})(HandRanking || (exports.HandRanking = HandRanking = {}));
exports.HAND_RANKING_NAMES = {
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
//# sourceMappingURL=hand-rankings.js.map
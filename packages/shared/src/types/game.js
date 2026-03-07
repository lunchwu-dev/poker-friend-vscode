"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionType = exports.GameStage = void 0;
var GameStage;
(function (GameStage) {
    GameStage["IDLE"] = "IDLE";
    GameStage["DEALING"] = "DEALING";
    GameStage["PRE_FLOP"] = "PRE_FLOP";
    GameStage["FLOP"] = "FLOP";
    GameStage["TURN"] = "TURN";
    GameStage["RIVER"] = "RIVER";
    GameStage["SHOWDOWN"] = "SHOWDOWN";
    GameStage["SETTLE"] = "SETTLE";
})(GameStage || (exports.GameStage = GameStage = {}));
var ActionType;
(function (ActionType) {
    ActionType["Fold"] = "fold";
    ActionType["Check"] = "check";
    ActionType["Call"] = "call";
    ActionType["Raise"] = "raise";
    ActionType["AllIn"] = "allin";
})(ActionType || (exports.ActionType = ActionType = {}));
//# sourceMappingURL=game.js.map
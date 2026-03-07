"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketEvent = void 0;
/** Socket 事件名枚举 */
var SocketEvent;
(function (SocketEvent) {
    // 客户端 → 服务端
    SocketEvent["RoomCreate"] = "room:create";
    SocketEvent["RoomJoin"] = "room:join";
    SocketEvent["RoomLeave"] = "room:leave";
    SocketEvent["SeatSit"] = "seat:sit";
    SocketEvent["SeatStand"] = "seat:stand";
    SocketEvent["SeatRebuy"] = "seat:rebuy";
    SocketEvent["GameStart"] = "game:start";
    SocketEvent["GameAction"] = "game:action";
    SocketEvent["Reconnect"] = "reconnect_attempt";
    // 服务端 → 客户端
    SocketEvent["RoomCreated"] = "room:created";
    SocketEvent["RoomState"] = "room:state";
    SocketEvent["RoomPlayerJoined"] = "room:player_joined";
    SocketEvent["RoomPlayerLeft"] = "room:player_left";
    SocketEvent["GameHandStart"] = "game:hand_start";
    SocketEvent["GameDealHole"] = "game:deal_hole";
    SocketEvent["GameDealCommunity"] = "game:deal_community";
    SocketEvent["GameActionOn"] = "game:action_on";
    SocketEvent["GamePlayerActed"] = "game:player_acted";
    SocketEvent["GameHandResult"] = "game:hand_result";
    SocketEvent["GameError"] = "game:error";
})(SocketEvent || (exports.SocketEvent = SocketEvent = {}));
//# sourceMappingURL=events.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INITIAL_COINS = exports.BANKRUPTCY_BONUS_AMOUNT = exports.BANKRUPTCY_THRESHOLD = exports.DAILY_BONUS_AMOUNT = exports.SETTLE_DELAY_MS = exports.MAX_PLAYERS = exports.MIN_PLAYERS = exports.RECONNECT_TIMEOUT = exports.DEFAULT_ACTION_TIMEOUT = exports.BUYIN_MAX_BB = exports.BUYIN_MIN_BB = exports.BLIND_OPTIONS = void 0;
/** 盲注预设选项 */
exports.BLIND_OPTIONS = [
    { small: 10, big: 20 },
    { small: 25, big: 50 },
    { small: 50, big: 100 },
    { small: 100, big: 200 },
    { small: 250, big: 500 },
];
/** 买入倍数（相对大盲） */
exports.BUYIN_MIN_BB = 20;
exports.BUYIN_MAX_BB = 100;
/** 操作超时时间（秒） */
exports.DEFAULT_ACTION_TIMEOUT = 30;
/** 断线重连窗口（秒） */
exports.RECONNECT_TIMEOUT = 30;
/** 最大/最小玩家数 */
exports.MIN_PLAYERS = 2;
exports.MAX_PLAYERS = 9;
/** 结算展示延迟（毫秒） */
exports.SETTLE_DELAY_MS = 3000;
/** 每日补给配置 */
exports.DAILY_BONUS_AMOUNT = 5000;
exports.BANKRUPTCY_THRESHOLD = 500;
exports.BANKRUPTCY_BONUS_AMOUNT = 2000;
/** 初始筹码 */
exports.INITIAL_COINS = 10000;
//# sourceMappingURL=game-config.js.map
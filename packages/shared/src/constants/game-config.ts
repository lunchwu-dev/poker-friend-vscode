/** 盲注预设选项 */
export const BLIND_OPTIONS = [
  { small: 10, big: 20 },
  { small: 25, big: 50 },
  { small: 50, big: 100 },
  { small: 100, big: 200 },
  { small: 250, big: 500 },
] as const;

/** 买入倍数（相对大盲） */
export const BUYIN_MIN_BB = 20;
export const BUYIN_MAX_BB = 100;

/** 操作超时时间（秒） */
export const DEFAULT_ACTION_TIMEOUT = 30;

/** 断线重连窗口（秒） */
export const RECONNECT_TIMEOUT = 30;

/** 最大/最小玩家数 */
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 9;

/** 结算展示延迟（毫秒） */
export const SETTLE_DELAY_MS = 3000;

/** 每日补给配置 */
export const DAILY_BONUS_AMOUNT = 5000;
export const BANKRUPTCY_THRESHOLD = 500;
export const BANKRUPTCY_BONUS_AMOUNT = 2000;

/** 初始筹码 */
export const INITIAL_COINS = 10000;

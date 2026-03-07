# Poker Friends V1.0 — 技术方案设计

> 基于 [总体技术架构](tech-stack.md) 的 V1 具体技术实现方案。
> 配合 [V1 游戏设计文档](v1-game-design.md) 阅读。

---

## 1. V1 技术范围

### 1.1 需要实现的技术能力

| 能力 | 说明 |
|------|------|
| 用户认证 | 游客登录、手机号+验证码登录、Apple Sign In、微信登录 |
| 实时通信 | Socket.IO 长连接，支持房间广播与私密消息 |
| 游戏引擎 | 服务端状态机驱动的完整德扑逻辑 |
| 房间管理 | 创建/加入/离开/销毁，座位管理 |
| 数据持久化 | 用户信息、牌局记录、战绩统计 |
| 深度链接 | 分享链接直达房间（Deep Link） |
| 断线重连 | 30秒窗口内自动恢复牌局 |

### 1.2 不需要实现的技术能力（后续版本）

| 能力 | 版本 |
|------|------|
| 匹配系统 | V2 |
| 聊天/表情消息路由 | V2 |
| 音频系统 | V2 |
| 语音通话 SDK 集成 | V3 |
| 锦标赛调度引擎 | V3 |
| 牌局回放存储与播放 | V3 |
| 内购支付验证 | V4 |
| 任务队列（BullMQ） | V4 |
| 多节点部署 / Redis Adapter | V2+（V1 单机即可） |

---

## 2. 项目工程结构

### 2.1 Monorepo 结构

```
poker-friends/
├── package.json                 # 根配置
├── pnpm-workspace.yaml          # pnpm workspace 定义
├── turbo.json                   # Turborepo 构建编排（可选）
├── docker-compose.yml           # 本地开发：PG + Redis
├── .github/
│   └── workflows/
│       ├── ci.yml               # 自动测试 + 代码检查
│       └── deploy.yml           # 部署流水线
│
├── packages/
│   └── shared/                  # 前后端共享包
│       ├── package.json
│       ├── src/
│       │   ├── types/
│       │   │   ├── card.ts      # Card, Suit, Rank 类型
│       │   │   ├── game.ts      # GameState, GameStage, PlayerAction
│       │   │   ├── room.ts      # RoomConfig, RoomState, SeatInfo
│       │   │   ├── user.ts      # UserProfile
│       │   │   └── events.ts    # Socket 事件名枚举 + 载荷类型
│       │   ├── constants/
│       │   │   ├── hand-rankings.ts  # 牌型定义与排名
│       │   │   └── game-config.ts    # 盲注选项、超时时间等
│       │   └── index.ts         # 统一导出
│       └── tsconfig.json
│
├── apps/
│   ├── server/                  # NestJS 服务端
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── Dockerfile
│   │   ├── prisma/
│   │   │   └── schema.prisma   # 数据库 Schema
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── modules/
│   │   │   │   ├── auth/       # 认证模块
│   │   │   │   ├── user/       # 用户模块
│   │   │   │   ├── room/       # 房间模块
│   │   │   │   ├── game/       # 核心游戏引擎
│   │   │   │   └── stats/      # 战绩模块
│   │   │   └── infrastructure/
│   │   │       ├── database/
│   │   │       ├── redis/
│   │   │       └── config/
│   │   └── test/
│   │       ├── unit/           # 单元测试
│   │       └── e2e/            # 端到端测试
│   │
│   └── mobile/                  # React Native 客户端
│       ├── package.json
│       ├── app.json
│       ├── tsconfig.json
│       ├── src/
│       │   ├── App.tsx
│       │   ├── navigation/     # React Navigation 路由
│       │   ├── screens/        # 页面组件
│       │   │   ├── LoginScreen.tsx
│       │   │   ├── HomeScreen.tsx
│       │   │   ├── CreateRoomScreen.tsx
│       │   │   ├── JoinRoomScreen.tsx
│       │   │   ├── RoomLobbyScreen.tsx
│       │   │   ├── GameTableScreen.tsx
│       │   │   ├── StatsScreen.tsx
│       │   │   └── SettingsScreen.tsx
│       │   ├── components/     # 可复用组件
│       │   │   ├── Card.tsx
│       │   │   ├── Chip.tsx
│       │   │   ├── PlayerSeat.tsx
│       │   │   ├── ActionPanel.tsx
│       │   │   ├── PotDisplay.tsx
│       │   │   └── CountdownTimer.tsx
│       │   ├── stores/         # Zustand 状态管理
│       │   │   ├── authStore.ts
│       │   │   ├── roomStore.ts
│       │   │   └── gameStore.ts
│       │   ├── services/       # 网络/业务服务
│       │   │   ├── socketService.ts
│       │   │   └── apiService.ts
│       │   ├── hooks/          # 自定义 Hooks
│       │   ├── utils/
│       │   └── assets/         # 图片/字体
│       └── __tests__/
│
└── docs/                        # 设计文档（当前目录）
```

### 2.2 共享包核心类型定义

```typescript
// packages/shared/src/types/card.ts
export enum Suit {
  Spades = 'S',    // ♠
  Hearts = 'H',    // ♥
  Diamonds = 'D',  // ♦
  Clubs = 'C',     // ♣
}

export enum Rank {
  Two = 2, Three, Four, Five, Six, Seven,
  Eight, Nine, Ten, Jack, Queen, King, Ace = 14,
}

export interface Card {
  suit: Suit;
  rank: Rank;
}

// packages/shared/src/types/game.ts
export enum GameStage {
  IDLE = 'IDLE',
  DEALING = 'DEALING',
  PRE_FLOP = 'PRE_FLOP',
  FLOP = 'FLOP',
  TURN = 'TURN',
  RIVER = 'RIVER',
  SHOWDOWN = 'SHOWDOWN',
  SETTLE = 'SETTLE',
}

export enum ActionType {
  Fold = 'fold',
  Check = 'check',
  Call = 'call',
  Raise = 'raise',
  AllIn = 'allin',
}

export interface PlayerAction {
  action: ActionType;
  amount?: number;  // raise/allin 时的金额
}

export interface AvailableActions {
  canFold: boolean;
  canCheck: boolean;
  canCall: boolean;
  callAmount?: number;
  canRaise: boolean;
  minRaise?: number;
  maxRaise?: number;
  canAllIn: boolean;
  allInAmount?: number;
}

// packages/shared/src/types/room.ts
export interface RoomConfig {
  maxPlayers: number;       // 2-9
  smallBlind: number;
  bigBlind: number;
  minBuyin: number;
  maxBuyin: number;
  actionTimeout: number;    // 秒
  password?: string;
}

export interface SeatInfo {
  seatIndex: number;
  playerId: string | null;
  nickname: string | null;
  avatar: string | null;
  chips: number;            // 桌面筹码
  status: 'empty' | 'seated' | 'playing' | 'folded' | 'allin' | 'standing';
  currentBet: number;       // 当前轮下注额
}

// packages/shared/src/types/events.ts
export enum SocketEvent {
  // 客户端 → 服务端
  RoomCreate = 'room:create',
  RoomJoin = 'room:join',
  RoomLeave = 'room:leave',
  SeatSit = 'seat:sit',
  SeatStand = 'seat:stand',
  SeatRebuy = 'seat:rebuy',
  GameStart = 'game:start',
  GameAction = 'game:action',
  Reconnect = 'reconnect_attempt',

  // 服务端 → 客户端
  RoomCreated = 'room:created',
  RoomState = 'room:state',
  RoomPlayerJoined = 'room:player_joined',
  RoomPlayerLeft = 'room:player_left',
  GameHandStart = 'game:hand_start',
  GameDealHole = 'game:deal_hole',
  GameDealCommunity = 'game:deal_community',
  GameActionOn = 'game:action_on',
  GamePlayerActed = 'game:player_acted',
  GameHandResult = 'game:hand_result',
  GameError = 'game:error',
}
```

---

## 3. 服务端详细设计

### 3.1 模块依赖关系

```
AppModule
├── ConfigModule (全局)
├── DatabaseModule (Prisma)
├── RedisModule
├── AuthModule
│   └── 依赖: UserModule
├── UserModule
│   └── 依赖: DatabaseModule
├── RoomModule
│   └── 依赖: RedisModule, UserModule, GameModule
├── GameModule ⭐
│   └── 依赖: RedisModule, StatsModule
└── StatsModule
    └── 依赖: DatabaseModule
```

### 3.2 游戏引擎核心逻辑

#### 3.2.1 GameService — 状态机主控

```typescript
// 伪代码：核心状态机流转
class GameService {
  async startNewHand(roomCode: string) {
    // 1. 移动庄家按钮
    // 2. 收盲注
    // 3. 洗牌发底牌（仅推送给对应玩家）
    // 4. 设置阶段为 PRE_FLOP
    // 5. 确定第一个行动玩家，启动计时器
  }

  async handleAction(roomCode: string, playerId: string, action: PlayerAction) {
    // 1. 验证：是否轮到该玩家、操作是否合法、金额是否合规
    // 2. 执行操作：更新玩家下注额、桌面筹码
    // 3. 广播 player_acted 事件
    // 4. 判断下注轮是否结束
    //    - 未结束 → 移到下一个玩家，重启计时器
    //    - 结束 → 进入下一阶段
    // 5. 判断特殊情况
    //    - 仅剩1人未弃牌 → 直接获胜
    //    - 所有人 All-in → 快速发完公共牌 → showdown
  }

  async advanceStage(roomCode: string) {
    // PRE_FLOP → FLOP（发3张公共牌）
    // FLOP → TURN（发1张）
    // TURN → RIVER（发1张）
    // RIVER → SHOWDOWN（比牌）
  }

  async showdown(roomCode: string) {
    // 1. 评估每位未弃牌玩家的最佳5张牌
    // 2. 计算各池（主池+边池）赢家
    // 3. 分配筹码
    // 4. 广播 hand_result
    // 5. 记录战绩
    // 6. 延迟 3 秒后开始下一手
  }
}
```

#### 3.2.2 DeckService — 洗牌发牌

```typescript
class DeckService {
  // Fisher-Yates 洗牌算法（使用 crypto.randomBytes 保证真随机）
  shuffle(deck: Card[]): Card[] {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = cryptoRandomInt(0, i);
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  createDeck(): Card[] {
    // 生成 52 张标准扑克牌
  }

  deal(deck: Card[], count: number): Card[] {
    return deck.splice(0, count);
  }
}
```

#### 3.2.3 EvaluatorService — 牌力评估

```typescript
class EvaluatorService {
  // 从 7 张牌（2 底牌 + 5 公共牌）中选出最佳 5 张
  evaluateBestHand(holeCards: Card[], communityCards: Card[]): HandResult {
    const allCards = [...holeCards, ...communityCards];
    const combinations = this.getCombinations(allCards, 5); // C(7,5) = 21 种
    let best: HandResult | null = null;
    for (const combo of combinations) {
      const result = this.evaluateHand(combo);
      if (!best || this.compareHands(result, best) > 0) {
        best = result;
      }
    }
    return best!;
  }

  // 判定 5 张牌的牌型
  evaluateHand(cards: Card[]): HandResult {
    // 检查顺序：皇家同花顺 → 同花顺 → 四条 → ... → 高牌
  }

  // 比较两手牌大小，返回 >0 / 0 / <0
  compareHands(a: HandResult, b: HandResult): number {
    // 先比牌型等级，再比关键牌，再比踢脚牌
  }
}

interface HandResult {
  rank: number;          // 1(皇家同花顺) ~ 10(高牌)
  rankName: string;
  bestCards: Card[];     // 最佳 5 张
  keyValues: number[];   // 用于同牌型比较的关键值序列
}
```

#### 3.2.4 PotService — 底池计算

```typescript
class PotService {
  // 计算主池和边池
  calculatePots(seats: SeatInfo[]): Pot[] {
    // 1. 找出所有不同的 All-in 金额（排序）
    // 2. 逐级计算每个池的金额和有资格的玩家
    // 3. 返回 Pot 数组
  }

  // 根据牌力分配各池给赢家
  distributePots(pots: Pot[], handResults: Map<string, HandResult>): Distribution[] {
    // 对每个池，在有资格的玩家中找牌力最大的
    // 平局时均分
  }
}

interface Pot {
  amount: number;
  eligiblePlayerIds: string[];
}
```

### 3.3 房间生命周期管理

```typescript
// RoomService 关键方法
class RoomService {
  async createRoom(hostId: string, config: RoomConfig): Promise<string> {
    // 1. 生成唯一 6 位房间码
    // 2. 在 Redis 中创建房间 Hash
    // 3. 将房主加入 Socket.IO Room
    // 4. 返回房间码
  }

  async joinRoom(playerId: string, roomCode: string, password?: string): Promise<void> {
    // 1. 校验房间是否存在
    // 2. 校验密码（如果有）
    // 3. 校验人数上限
    // 4. 将玩家加入 Socket.IO Room
    // 5. 广播 player_joined
  }

  async sitDown(playerId: string, seatIndex: number, buyinAmount: number): Promise<void> {
    // 1. 校验座位是否空闲
    // 2. 校验买入金额范围
    // 3. 从用户账户扣除筹码
    // 4. 更新 Redis 座位信息
    // 5. 广播 room:state
  }

  // 房间码生成：6位数字，避免冲突
  private async generateRoomCode(): Promise<string> {
    let code: string;
    do {
      code = String(Math.floor(100000 + Math.random() * 900000));
    } while (await this.redis.exists(`room:code:${code}`));
    return code;
  }
}
```

### 3.4 认证流程

```
游客登录:
  客户端生成 deviceId → POST /auth/guest { deviceId }
  → 服务端创建/查找用户 → 返回 JWT

手机号登录:
  POST /auth/sms/send { phone }
  → POST /auth/sms/verify { phone, code }
  → 服务端验证验证码 → 创建/查找用户 → 返回 JWT

微信登录:
  客户端拉起微信授权 → 获取 code
  → POST /auth/wechat { code }
  → 服务端用 code 换 openid → 创建/查找用户 → 返回 JWT

Apple 登录:
  客户端 Apple 授权 → 获取 identityToken
  → POST /auth/apple { identityToken }
  → 服务端验证 token → 创建/查找用户 → 返回 JWT

Socket.IO 连接认证:
  客户端连接时在 auth 参数中携带 JWT
  → 服务端 WsGuard 中间件验证 JWT → 允许/拒绝连接
```

### 3.5 数据库 Schema（Prisma）

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id             String    @id @default(uuid()) @db.Uuid
  nickname       String    @db.VarChar(20)
  avatar         String    @default("default_01") @db.VarChar(50)
  phone          String?   @unique @db.VarChar(20)
  coins          BigInt    @default(10000)
  totalHands     Int       @default(0) @map("total_hands")
  totalWins      Int       @default(0) @map("total_wins")
  totalProfit    BigInt    @default(0) @map("total_profit")
  bestHandRank   Int?      @map("best_hand_rank") @db.SmallInt
  maxSingleWin   BigInt    @default(0) @map("max_single_win")
  guestDeviceId  String?   @map("guest_device_id") @db.VarChar(100)
  wechatOpenid   String?   @unique @map("wechat_openid") @db.VarChar(100)
  appleSub       String?   @unique @map("apple_sub") @db.VarChar(100)
  lastDailyBonus DateTime? @map("last_daily_bonus") @db.Date
  createdAt      DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt      DateTime  @updatedAt @map("updated_at") @db.Timestamptz

  handPlayers    HandPlayer[]

  @@map("users")
}

model HandHistory {
  id             String    @id @default(uuid()) @db.Uuid
  roomCode       String    @map("room_code") @db.VarChar(6)
  handNumber     Int       @map("hand_number")
  playerCount    Int       @map("player_count") @db.SmallInt
  communityCards String?   @map("community_cards") @db.VarChar(20)
  potTotal       BigInt    @map("pot_total")
  createdAt      DateTime  @default(now()) @map("created_at") @db.Timestamptz

  handPlayers    HandPlayer[]

  @@index([createdAt])
  @@map("hand_histories")
}

model HandPlayer {
  id            String    @id @default(uuid()) @db.Uuid
  handId        String    @map("hand_id") @db.Uuid
  userId        String    @map("user_id") @db.Uuid
  seatIndex     Int       @map("seat_index") @db.SmallInt
  holeCards     String?   @map("hole_cards") @db.VarChar(10)
  finalHandRank Int?      @map("final_hand_rank") @db.SmallInt
  chipsChange   BigInt    @map("chips_change")
  isWinner      Boolean   @default(false) @map("is_winner")
  createdAt     DateTime  @default(now()) @map("created_at") @db.Timestamptz

  hand          HandHistory @relation(fields: [handId], references: [id])
  user          User        @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([handId])
  @@map("hand_players")
}
```

---

## 4. 客户端详细设计

### 4.1 状态管理架构

```typescript
// stores/authStore.ts — 认证状态
interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isLoading: boolean;
  loginAsGuest: () => Promise<void>;
  loginWithPhone: (phone: string, code: string) => Promise<void>;
  logout: () => void;
}

// stores/roomStore.ts — 房间状态
interface RoomState {
  roomCode: string | null;
  config: RoomConfig | null;
  seats: SeatInfo[];
  isHost: boolean;
  mySeaIndex: number | null;
  createRoom: (config: RoomConfig) => Promise<string>;
  joinRoom: (roomCode: string, password?: string) => Promise<void>;
  leaveRoom: () => void;
  sitDown: (seatIndex: number, buyinAmount: number) => void;
}

// stores/gameStore.ts — 游戏状态
interface GameState {
  stage: GameStage;
  communityCards: Card[];
  holeCards: [Card, Card] | null;
  pot: number;
  currentSeatIndex: number | null;
  availableActions: AvailableActions | null;
  timeout: number;
  handResult: HandResult | null;
  performAction: (action: PlayerAction) => void;
}
```

### 4.2 Socket 连接管理

```typescript
// services/socketService.ts
class SocketService {
  private socket: Socket | null = null;

  connect(token: string) {
    this.socket = io(SERVER_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    this.socket.on('connect', this.onConnect);
    this.socket.on('disconnect', this.onDisconnect);
    this.socket.on('connect_error', this.onError);

    // 注册所有游戏事件监听
    this.registerGameEvents();
  }

  private registerGameEvents() {
    // 将服务端推送事件桥接到 Zustand Store
    this.socket.on(SocketEvent.RoomState, (data) => {
      useRoomStore.getState().updateState(data);
    });
    this.socket.on(SocketEvent.GameDealHole, (data) => {
      useGameStore.getState().setHoleCards(data.cards);
    });
    // ... 其他事件
  }

  emit(event: SocketEvent, data?: any) {
    this.socket?.emit(event, data);
  }
}
```

### 4.3 深度链接（Deep Link）

```typescript
// React Navigation Deep Link 配置
const linking = {
  prefixes: ['pokerfriends://', 'https://pokerfriends.app'],
  config: {
    screens: {
      JoinRoom: {
        path: 'room/:roomCode',
        parse: { roomCode: (code: string) => code },
      },
    },
  },
};

// App.tsx
<NavigationContainer linking={linking}>
  <Stack.Navigator>
    {/* ... screens */}
  </Stack.Navigator>
</NavigationContainer>
```

### 4.4 关键页面交互流程

#### 创建房间 → 等待 → 开始游戏

```
CreateRoomScreen          RoomLobbyScreen           GameTableScreen
     │                         │                         │
     │  填写配置并提交          │                         │
     │ ─── room:create ──►     │                         │
     │ ◄── room:created ───    │                         │
     │                         │                         │
     │  导航到房间大厅 ──────►  │                         │
     │                         │  展示座位 + 房间码       │
     │                         │  等待玩家加入            │
     │                         │  ◄── player_joined ──   │
     │                         │                         │
     │                         │  入座 sit:down          │
     │                         │  房主点击开始             │
     │                         │ ─── game:start ──►      │
     │                         │                         │
     │                         │  导航到牌桌 ──────────►  │
     │                         │                         │  接收发牌/操作
```

---

## 5. 部署与运维

### 5.1 Docker Compose（本地开发）

```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: poker_friends
      POSTGRES_USER: poker
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - '5432:5432'
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redisdata:/data

volumes:
  pgdata:
  redisdata:
```

### 5.2 服务端 Dockerfile

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/server/package.json apps/server/
RUN corepack enable && pnpm install --frozen-lockfile
COPY packages/shared/ packages/shared/
COPY apps/server/ apps/server/
RUN pnpm --filter server build
RUN pnpm --filter server prisma generate

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/apps/server/node_modules ./node_modules
COPY --from=builder /app/apps/server/prisma ./prisma
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

### 5.3 环境变量

```env
# .env.example
NODE_ENV=development
PORT=3000

# 数据库
DATABASE_URL=postgresql://poker:password@localhost:5432/poker_friends

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=30d

# 短信（阿里云）
SMS_ACCESS_KEY_ID=
SMS_ACCESS_KEY_SECRET=
SMS_SIGN_NAME=
SMS_TEMPLATE_CODE=

# 微信开放平台
WECHAT_APP_ID=
WECHAT_APP_SECRET=

# Apple Sign In
APPLE_CLIENT_ID=
APPLE_TEAM_ID=
APPLE_KEY_ID=
APPLE_PRIVATE_KEY=
```

### 5.4 V1 生产部署拓扑（最简）

```
                    ┌──────────┐
  客户端 ──────────►│  Nginx   │ ← SSL 终止
  (App)            │ (反向代理) │
                    └────┬─────┘
                         │
                    ┌────┴─────┐
                    │  NestJS  │ ← 单实例
                    │  :3000   │
                    └────┬─────┘
                         │
                ┌────────┼────────┐
                ▼                 ▼
          ┌──────────┐     ┌──────────┐
          │PostgreSQL│     │  Redis   │
          │  (RDS)   │     │ (云Redis) │
          └──────────┘     └──────────┘
```

### 5.5 Nginx 配置要点

```nginx
server {
    listen 443 ssl http2;
    server_name api.pokerfriends.app;

    # SSL 证书
    ssl_certificate     /etc/letsencrypt/live/api.pokerfriends.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.pokerfriends.app/privkey.pem;

    # HTTP API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Socket.IO（WebSocket 升级）
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;  # 长连接保持
    }
}
```

---

## 6. 测试策略

### 6.1 测试覆盖重点

| 模块 | 测试类型 | 覆盖要求 | 说明 |
|------|---------|---------|------|
| **EvaluatorService** | 单元测试 | 100% | 10种牌型识别 + 牌型比较 + 踢脚牌 |
| **PotService** | 单元测试 | 100% | 主池/边池/多边池/平局分配 |
| **DeckService** | 单元测试 | 100% | 洗牌随机性、发牌正确性 |
| **GameService** | 单元测试 + 集成测试 | ≥ 90% | 状态机流转、操作验证、超时处理 |
| **RoomService** | 集成测试 | ≥ 80% | 创建/加入/离开/座位管理 |
| **AuthService** | 集成测试 | ≥ 80% | 登录流程、JWT 验证 |
| **Socket 通信** | E2E 测试 | 关键路径 | 完整一局游戏流程 |

### 6.2 关键测试用例示例

```typescript
// 牌力评估测试
describe('EvaluatorService', () => {
  it('should detect Royal Flush', () => { /* ... */ });
  it('should detect Straight Flush', () => { /* ... */ });
  it('should handle A-2-3-4-5 as lowest straight', () => { /* ... */ });
  it('should not treat K-A-2-3-4 as straight', () => { /* ... */ });
  it('should compare same rank by kicker', () => { /* ... */ });
  it('should split pot on identical hands', () => { /* ... */ });
  it('should pick best 5 from 7 cards', () => { /* ... */ });
});

// 边池计算测试
describe('PotService', () => {
  it('should create side pot when player all-in with less', () => { /* ... */ });
  it('should handle multiple all-in at different amounts', () => { /* ... */ });
  it('should distribute odd chips to player closest to dealer left', () => { /* ... */ });
});
```

---

## 7. V1 技术风险与应对

| 风险 | 影响 | 应对方案 |
|------|------|---------|
| 游戏引擎状态机 bug | 牌局逻辑错误 | 高覆盖率单元测试 + 详细日志 |
| Socket.IO 连接不稳定 | 用户断线体验差 | 心跳保活 + 指数退避重连 + 状态快照恢复 |
| 并发操作冲突（同时操作同一房间） | 数据不一致 | Redis 分布式锁保护关键操作 |
| Deep Link 平台兼容性 | 分享链接失效 | Universal Links(iOS) + App Links(Android) + 降级方案 |
| React Native 性能 | 动画卡顿 | 使用 Reanimated 3 在 UI 线程执行动画 |
| 数据库连接池耗尽 | 服务不可用 | Prisma 连接池限制 + 超时配置 |

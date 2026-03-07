# Poker Friends — 技术架构设计

> 本文档定义项目整体技术架构与选型，适用于所有版本。V1 版本具体技术方案详见 [v1-tech-design.md](v1-tech-design.md)。
>
> 原则：**最简单但最健壮**。优先选择成熟稳定、社区活跃、学习曲线平缓的技术，避免过度工程化。

---

## 总览

```
┌─────────────────────────────────────────────────────────┐
│                        客户端                            │
│              React Native + TypeScript                   │
│               (iOS & Android 一套代码)                    │
├─────────────────────────────────────────────────────────┤
│                     通信层                               │
│              Socket.IO (WebSocket)                       │
├─────────────────────────────────────────────────────────┤
│                        服务端                            │
│               Node.js + TypeScript                      │
│                  (NestJS 框架)                           │
├──────────────┬──────────────┬───────────────────────────┤
│   PostgreSQL │    Redis     │       第三方服务            │
│   (持久化)    │  (缓存/实时)  │  Agora·Firebase·S3       │
└──────────────┴──────────────┴───────────────────────────┘
```

---

## 1. 客户端

### 推荐方案：React Native + TypeScript

| 项目 | 选型 | 理由 |
|------|------|------|
| **框架** | React Native 0.76+ | 一套代码双端运行，热更新能力强，2D卡牌游戏性能完全满足 |
| **语言** | TypeScript | 类型安全，前后端统一语言，减少上下文切换 |
| **状态管理** | Zustand | 极简 API，比 Redux 轻量 80%，适合游戏状态管理 |
| **实时通信** | Socket.IO Client | 自动重连、房间概念、与服务端完美匹配 |
| **动画引擎** | React Native Reanimated 3 | 60fps 原生动画，发牌/筹码动画流畅 |
| **2D渲染** | React Native Skia | 牌面渲染、粒子特效（胜利烟花等） |
| **导航** | React Navigation 7 | 成熟稳定，支持深度链接（分享邀请链接直接进房间） |
| **音频** | expo-av | 背景音乐、音效播放，API 简单 |
| **本地存储** | MMKV | 比 AsyncStorage 快 30 倍，存储用户设置/缓存 |
| **推送通知** | Firebase Cloud Messaging | 跨平台统一推送方案 |

### 为什么不选 Unity / Cocos？

| 对比项 | React Native | Unity / Cocos |
|--------|-------------|---------------|
| 学习曲线 | 低（Web技术栈） | 高（游戏引擎特有概念） |
| 包体大小 | ~15MB | ~50-80MB |
| 热更新 | CodePush 原生支持 | 需额外方案 |
| 原生能力 | 直接调用 | 需要桥接插件 |
| 社交功能开发 | 擅长 | 较弱 |
| 2D卡牌性能 | 完全够用 | 过度（为3D游戏设计） |
| 前后端统一语言 | ✅ TypeScript | ❌ C# / TS + 后端语言 |

**结论**：德州扑克是纯2D回合制卡牌游戏，不需要物理引擎、3D渲染。React Native 在 UI 开发效率、包体大小、热更新能力上全面领先。

---

## 2. 服务端

### 推荐方案：Node.js + NestJS + TypeScript

| 项目 | 选型 | 理由 |
|------|------|------|
| **运行时** | Node.js 22 LTS | 事件驱动非阻塞IO，天然适合高并发WebSocket连接 |
| **框架** | NestJS 11 | 模块化架构、依赖注入、开箱即用的 WebSocket 网关 |
| **语言** | TypeScript | 与客户端统一，可共享类型定义和验证逻辑 |
| **实时通信** | Socket.IO (NestJS Gateway) | NestJS 原生集成，房间/命名空间/自动重连 |
| **ORM** | Prisma | 类型安全、自动迁移、直觉化 API |
| **验证** | class-validator + class-transformer | NestJS 原生集成，DTO 验证防注入 |
| **认证** | JWT + Passport | 无状态认证，支持微信/Apple 第三方登录 |
| **任务调度** | @nestjs/schedule (cron) | 赛季重置、定时锦标赛、日常奖励发放 |
| **日志** | Pino | 高性能 JSON 日志，比 Winston 快 5 倍 |

### 核心服务拆分

```
src/
├── modules/
│   ├── auth/           # 登录认证（JWT、第三方OAuth）
│   ├── user/           # 用户信息、好友关系
│   ├── lobby/          # 房间列表、快速匹配
│   ├── room/           # 房间管理（创建/加入/离开）
│   ├── game/           # ⭐ 核心牌局引擎
│   │   ├── deck.ts           # 洗牌发牌（Fisher-Yates）
│   │   ├── evaluator.ts      # 牌力评估
│   │   ├── pot-calculator.ts # 底池/边池计算
│   │   ├── game-state.ts     # 状态机（FSM）
│   │   └── game.gateway.ts   # WebSocket 事件处理
│   ├── tournament/     # 锦标赛逻辑
│   ├── club/           # 俱乐部系统
│   ├── chat/           # 聊天消息
│   ├── shop/           # 商城/内购验证
│   ├── stats/          # 战绩统计/排行榜
│   └── admin/          # 运营后台API
├── shared/
│   ├── types/          # 前后端共享类型
│   ├── constants/      # 牌型定义、游戏常量
│   └── utils/          # 通用工具
└── infrastructure/
    ├── database/       # Prisma 配置
    ├── redis/          # Redis 模块
    ├── queue/          # BullMQ 任务队列
    └── logger/         # 日志配置
```

### 为什么不选 Go / Java？

| 对比项 | Node.js + NestJS | Go | Java (Spring) |
|--------|-------------------|-----|----------------|
| 前后端统一语言 | ✅ | ❌ | ❌ |
| 学习门槛 | 低 | 中 | 高 |
| WebSocket 生态 | Socket.IO 成熟 | gorilla/websocket | 需额外配置 |
| 开发速度 | 最快 | 中 | 慢 |
| 单机并发（WebSocket） | 1万+ 连接 | 10万+ | 5万+ |
| 团队招人难度 | 最容易 | 中等 | 容易 |

**结论**：德州扑克并发要求不高（每桌最多9人，千桌级别单机 Node.js 轻松承载），统一 TypeScript 技术栈带来的开发效率提升远大于 Go 的性能优势。

---

## 3. 数据库

### 3.1 PostgreSQL（主数据库）

| 用途 | 说明 |
|------|------|
| 用户数据 | 账号、资产、好友关系、俱乐部 |
| 牌局记录 | 每局完整操作日志（用于回放和反作弊） |
| 锦标赛数据 | 赛事配置、排名、奖励发放 |
| 商城/支付 | 商品、订单、内购验证记录 |

**为什么选 PostgreSQL 而非 MySQL**：
- JSONB 类型原生支持，适合存储牌局变长数据
- 更强的并发控制（MVCC）
- 数组类型可直接存储手牌 `{AS, KH}` 无需额外表
- Prisma 对 PostgreSQL 支持最好

### 3.2 Redis（缓存 + 实时状态）

| 用途 | 数据结构 | 说明 |
|------|---------|------|
| 房间状态 | Hash | 当前牌局的完整实时状态 |
| 玩家在线状态 | Set | 在线用户集合，秒级更新 |
| 匹配队列 | Sorted Set | 按段位/等待时间排序的匹配池 |
| 排行榜 | Sorted Set | 实时排行，O(logN) 更新 |
| 会话缓存 | String | JWT Token 黑名单、限流计数器 |
| 分布式锁 | String + TTL | 防止并发操作导致数据不一致 |

### 数据库 Schema 核心表

```sql
-- 用户表
users (id, nickname, avatar, level, exp, coins, diamonds, rank_tier, created_at)

-- 好友关系
friendships (user_id, friend_id, status, created_at)

-- 房间
rooms (id, host_id, type, config_json, status, created_at)

-- 牌局记录（用于回放）
game_hands (id, room_id, hand_number, community_cards, pot, actions_json, winners_json, created_at)

-- 玩家牌局参与记录
hand_players (hand_id, user_id, seat, hole_cards, result, chips_change)

-- 俱乐部
clubs (id, name, owner_id, member_count, created_at)

-- 交易/内购记录
transactions (id, user_id, type, amount, currency, platform_receipt, created_at)
```

---

## 4. 实时通信方案

### Socket.IO（推荐）

```
客户端                              服务端
  │                                   │
  │──── join_room {room_id} ────────►│
  │◄─── room_state {players,config} ──│
  │                                   │
  │──── player_action {fold/raise} ──►│
  │◄─── game_update {new_state} ──────│  (广播给房间所有人)
  │◄─── deal_cards {hole_cards} ──────│  (仅发给当事人)
  │                                   │
  │◄─── hand_result {winners,pot} ────│
  │                                   │
```

**关键事件定义**：

| 事件名 | 方向 | 说明 |
|--------|------|------|
| `join_room` | C→S | 加入房间 |
| `leave_room` | C→S | 离开房间 |
| `sit_down` | C→S | 坐下（选座位+买入） |
| `player_action` | C→S | 玩家操作（fold/check/call/raise/allin） |
| `room_state` | S→C | 房间完整状态快照 |
| `game_start` | S→C | 新一手牌开始 |
| `deal_hole` | S→C（私密） | 发底牌（仅发给当事人） |
| `deal_community` | S→C | 发公共牌 |
| `game_update` | S→C | 游戏状态增量更新 |
| `hand_result` | S→C | 一手牌结算结果 |
| `chat_message` | 双向 | 聊天消息 |
| `emoji_reaction` | 双向 | 表情互动 |

### 为什么不用原生 WebSocket / gRPC？

- **Socket.IO** 自带房间（Room）概念，完美匹配德州扑克的"房间"模型
- 自动重连 + 断线缓冲，省去大量手写重连逻辑
- 支持降级到 HTTP Long Polling（弱网兜底）
- NestJS `@WebSocketGateway` 原生集成

---

## 5. 第三方服务

| 服务 | 推荐方案 | 用途 |
|------|---------|------|
| **语音通话** | Agora（声网） | 房间内实时语音，SDK成熟，计费合理 |
| **推送通知** | Firebase Cloud Messaging | 好友邀请、锦标赛提醒 |
| **崩溃监控** | Sentry | 客户端+服务端异常捕获 |
| **数据分析** | Mixpanel / 自建 | 用户行为埋点分析 |
| **对象存储** | 阿里云 OSS / AWS S3 | 用户头像、静态资源CDN |
| **内购验证** | Apple StoreKit / Google Play Billing | 服务端验证收据，防刷单 |
| **第三方登录** | 微信开放平台 / Apple Sign In | 国内主推微信，海外主推Apple |
| **短信验证** | 阿里云短信 / Twilio | 手机号注册/绑定 |

---

## 6. DevOps 与部署

### 6.1 部署架构

```
                    ┌─────────┐
                    │  CDN    │ ← 静态资源/热更新包
                    └────┬────┘
                         │
┌──────────┐      ┌──────┴──────┐
│  客户端   │ ──► │  Nginx/ALB  │  ← SSL 终止、负载均衡
└──────────┘      └──────┬──────┘
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
         ┌────────┐ ┌────────┐ ┌────────┐
         │ Node 1 │ │ Node 2 │ │ Node 3 │  ← NestJS 实例
         └───┬────┘ └───┬────┘ └───┬────┘
             │          │          │
             ▼          ▼          ▼
         ┌─────────────────────────────┐
         │   Redis Cluster (Adapter)   │  ← Socket.IO 跨实例广播
         └─────────────────────────────┘
                       │
              ┌────────┴────────┐
              ▼                 ▼
         ┌──────────┐    ┌──────────┐
         │ PG 主库   │    │ PG 从库   │
         └──────────┘    └──────────┘
```

### 6.2 基础设施

| 项目 | 选型 | 说明 |
|------|------|------|
| **容器化** | Docker + Docker Compose | 本地开发一键启动所有服务 |
| **编排** | 阿里云 ACK / AWS ECS | 生产环境容器编排（初期不需要K8s） |
| **CI/CD** | GitHub Actions | 自动测试、构建、部署 |
| **监控** | Prometheus + Grafana | 服务器指标监控 |
| **日志** | ELK (Elasticsearch + Logstash + Kibana) | 集中日志检索 |
| **APM** | Sentry Performance | 链路追踪、慢请求定位 |

### 6.3 环境配置

| 环境 | 用途 | 配置 |
|------|------|------|
| local | 本地开发 | Docker Compose（PG + Redis + Node） |
| staging | 测试环境 | 单节点，模拟生产 |
| production | 生产环境 | 多节点，自动扩缩容 |

---

## 7. 前后端共享代码

统一 TypeScript 的最大优势——**共享类型和常量**：

```
packages/
├── shared/                    # 前后端共享包
│   ├── types/
│   │   ├── game.ts           # GameState, PlayerAction, Card 等类型
│   │   ├── room.ts           # RoomConfig, SeatInfo 等
│   │   ├── user.ts           # UserProfile, FriendInfo 等
│   │   └── events.ts         # Socket 事件名枚举 + 载荷类型
│   ├── constants/
│   │   ├── hand-rankings.ts  # 牌型定义和排名
│   │   ├── game-config.ts    # 盲注结构、超时时间
│   │   └── error-codes.ts    # 统一错误码
│   └── utils/
│       ├── card-utils.ts     # 花色/点数解析
│       └── chip-format.ts    # 筹码数字格式化（1000→1K）
├── client/                    # React Native 客户端
└── server/                    # NestJS 服务端
```

使用 **pnpm workspace** 管理 monorepo，共享包零配置引用。

---

## 8. 安全方案

| 威胁 | 防护措施 | 实现方式 |
|------|---------|---------|
| **协议篡改** | 服务端权威 | 所有游戏逻辑服务端计算，客户端仅渲染 |
| **重放攻击** | 请求签名 + 时间戳 | 每个 Socket 消息带递增序列号 |
| **数据窃听** | 传输加密 | WSS (WebSocket Secure) + TLS 1.3 |
| **SQL注入** | ORM参数化 | Prisma 自动参数化查询 |
| **XSS** | 输入过滤 | 聊天消息 HTML 转义 + 敏感词过滤 |
| **合谋作弊** | 行为分析 | 同IP/设备检测 + 操作模式异常报警 |
| **刷金币** | 服务端校验 | 所有货币变动经服务端验证，内购收据服务端验签 |
| **DDoS** | 限流 + CDN | Nginx rate limiting + 云厂商DDoS防护 |

---

## 9. 性能估算

| 指标 | 预估值 | 说明 |
|------|--------|------|
| 单机 WebSocket 连接 | ~10,000 | Node.js 单进程 |
| 单桌内存占用 | ~5KB | 游戏状态 + 玩家信息 |
| 单机支撑桌数 | ~2,000 | 保守估计 |
| 同时在线玩家 | ~20,000 | 3台 Node.js 实例即可 |
| 消息延迟（同区域） | <50ms | Socket.IO + Redis Adapter |
| 数据库QPS | ~5,000 | 仅牌局结算时写入，实时状态在Redis |

**结论**：初期 3台 2核4G 服务器 + 1台 PG + 1台 Redis 即可支撑2万在线用户，月成本约 ¥2,000-3,000。

---

## 10. 技术选型汇总

| 层级 | 技术 | 版本 |
|------|------|------|
| **客户端框架** | React Native | 0.76+ |
| **客户端语言** | TypeScript | 5.x |
| **状态管理** | Zustand | 5.x |
| **动画** | Reanimated 3 + Skia | 最新 |
| **导航** | React Navigation | 7.x |
| **服务端框架** | NestJS | 11.x |
| **服务端运行时** | Node.js | 22 LTS |
| **实时通信** | Socket.IO | 4.x |
| **ORM** | Prisma | 6.x |
| **主数据库** | PostgreSQL | 16 |
| **缓存/实时** | Redis | 7.x |
| **任务队列** | BullMQ | 5.x |
| **语音SDK** | Agora | 最新 |
| **推送** | Firebase Cloud Messaging | 最新 |
| **监控** | Sentry + Prometheus + Grafana | — |
| **CI/CD** | GitHub Actions | — |
| **容器化** | Docker | — |
| **包管理** | pnpm workspace (monorepo) | — |

---

## 核心优势总结

1. **全栈 TypeScript**：前后端统一语言，共享类型/常量/工具，开发效率最大化
2. **成熟稳定**：所有选型均为生产验证过的主流方案，社区活跃，问题可搜索
3. **最小复杂度**：无需游戏引擎、无需微服务（初期单体即可），聚焦核心玩法
4. **弹性扩展**：Socket.IO Redis Adapter 天然支持水平扩展，流量增长时加机器即可
5. **低成本起步**：3台云服务器即可支撑万级在线，月成本可控在 ¥3,000 以内

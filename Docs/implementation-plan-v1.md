# Poker Friends V1.0 — 实施计划

> 基于 [V1 游戏设计文档](v1-game-design.md) 和 [V1 技术方案](v1-tech-design.md) 制定的具体实施计划。

---

## 1. 实施阶段总览

将 V1 开发拆分为 **6 个阶段**，每个阶段产出可验证的交付物：

```
阶段0 项目初始化      ████
阶段1 游戏引擎        ████████████
阶段2 服务端基础      ████████████
阶段3 客户端基础      ████████████████
阶段4 联调与集成      ████████████
阶段5 测试与上线准备  ████████
```

| 阶段 | 名称 | 核心产出 | 验收标志 |
|------|------|---------|---------|
| **P0** | 项目初始化 | Monorepo 脚手架、基础设施、CI | `pnpm dev` 一键启动，CI 绿灯 |
| **P1** | 游戏引擎 | 服务端核心牌局逻辑（纯逻辑，无网络） | 所有单元测试通过，覆盖率 ≥ 95% |
| **P2** | 服务端基础 | 认证 + 房间 + WebSocket + 战绩 | Postman/wscat 可跑通完整流程 |
| **P3** | 客户端基础 | 全部页面 + Socket 通信 + 基础动画 | 模拟器上可完整走通一局游戏 |
| **P4** | 联调与集成 | 前后端联调 + Deep Link + 断线重连 | 真机多人联网对战成功 |
| **P5** | 测试与上线 | Bug 修复 + 性能优化 + 部署 + 提审 | App Store / Google Play 提审通过 |

---

## 2. P0 — 项目初始化

### 2.1 任务清单

| # | 任务 | 详情 | 产出 |
|---|------|------|------|
| 0.1 | 创建 Monorepo | pnpm workspace + packages/shared + apps/server + apps/mobile | 项目骨架 |
| 0.2 | 配置 TypeScript | 根 tsconfig + 各包 tsconfig，路径别名 | 编译通过 |
| 0.3 | 配置 ESLint + Prettier | 统一代码风格，husky + lint-staged 提交检查 | 代码规范 |
| 0.4 | NestJS 初始化 | `nest new`，配置 Module 结构，集成 Prisma | 空服务启动 |
| 0.5 | React Native 初始化 | 使用 Expo 或 bare RN，配置 React Navigation | 空 App 启动 |
| 0.6 | Docker Compose | PostgreSQL 16 + Redis 7 本地开发环境 | `docker-compose up` 可用 |
| 0.7 | Prisma Schema | 编写 V1 三张表的 Schema + 首次迁移 | 数据库表已创建 |
| 0.8 | GitHub Actions CI | lint + typecheck + test 自动运行 | PR 自动检查 |
| 0.9 | 共享包 (shared) | 定义 Card/Game/Room/Events 核心类型和常量 | shared 包可被 server/mobile 引用 |
| 0.10 | 环境变量管理 | .env.example + ConfigModule 集成 | 配置项集中管理 |

### 2.2 验收标准
- `pnpm install` 无报错
- `pnpm dev:server` 启动 NestJS，访问 health check 返回 200
- `pnpm dev:mobile` 启动 Metro，模拟器显示空白 App
- `docker-compose up` 启动 PG + Redis
- CI 流水线全绿

---

## 3. P1 — 游戏引擎

> **核心原则**：游戏引擎是纯逻辑层，不依赖网络/数据库，通过单元测试驱动开发。

### 3.1 任务清单

| # | 任务 | 详情 | 测试要求 |
|---|------|------|---------|
| 1.1 | DeckService | 52 张牌生成、Fisher-Yates 洗牌、发牌 | 牌数正确、无重复、随机性 |
| 1.2 | EvaluatorService — 牌型识别 | 实现 10 种牌型判定逻辑 | 每种牌型 ≥ 3 个测试用例 |
| 1.3 | EvaluatorService — 7 选 5 最佳 | C(7,5)=21 种组合取最佳 | 多场景测试 |
| 1.4 | EvaluatorService — 牌型比较 | 同牌型比关键牌、踢脚牌 | 含边界（A 高低、平局） |
| 1.5 | PotService — 主池计算 | 普通下注场景底池汇总 | 多人下注场景 |
| 1.6 | PotService — 边池计算 | 单人/多人不同金额 All-in | ≥ 5 种 All-in 场景 |
| 1.7 | PotService — 底池分配 | 根据牌力分配各池（含平局均分） | 平局、多边池场景 |
| 1.8 | GameStateMachine | 状态流转：IDLE→DEALING→PRE_FLOP→...→SETTLE | 每个转换有测试 |
| 1.9 | BettingRound 逻辑 | 下注轮管理：轮转顺序、操作验证、轮结束判断 | 含 2 人桌特殊规则 |
| 1.10 | GameService 完整流程 | 整合上述模块，模拟完整一手牌 | 集成测试串联全流程 |
| 1.11 | 超时自动操作 | 超时后 auto-check/auto-fold 逻辑 | 超时场景测试 |
| 1.12 | 边界场景处理 | 所有人 All-in、连续弃牌到剩 1 人、盲注不足 All-in | 边界测试用例 |

### 3.2 验收标准
- 所有单元测试通过
- 游戏引擎测试覆盖率 ≥ 95%
- 可通过代码模拟一局完整的 6 人桌/2 人桌游戏

---

## 4. P2 — 服务端基础

### 4.1 任务清单

| # | 任务 | 详情 | 依赖 |
|---|------|------|------|
| 2.1 | RedisModule | Redis 连接模块封装 | P0 |
| 2.2 | AuthModule — 游客登录 | POST /auth/guest，JWT 生成 | P0 |
| 2.3 | AuthModule — 手机号登录 | 发送验证码 + 验证码校验 | 短信服务 SDK |
| 2.4 | AuthModule — Apple / 微信 | 第三方 token 验证 | 第三方开放平台注册 |
| 2.5 | AuthModule — WsGuard | Socket.IO 连接认证中间件 | 2.2 |
| 2.6 | UserModule | 用户 CRUD、筹码查询/扣减、每日补给 | Prisma |
| 2.7 | RoomModule — 创建房间 | room:create 事件 → Redis 存储 → 返回房间码 | 2.1 |
| 2.8 | RoomModule — 加入/离开 | room:join / room:leave + 密码校验 | 2.7 |
| 2.9 | RoomModule — 座位管理 | seat:sit / seat:stand / seat:rebuy + 筹码扣减 | 2.6, 2.7 |
| 2.10 | GameGateway | 将 GameService 接入 WebSocket 事件流 | P1, 2.5 |
| 2.11 | 操作计时器 | setTimeout 管理 + 超时自动操作 + 清理 | 2.10 |
| 2.12 | 断线重连 | disconnect 检测→Timer→reconnect 恢复快照 | 2.10 |
| 2.13 | StatsModule | 手牌记录写入 + 用户汇总更新 + 战绩查询 API | 2.10, Prisma |
| 2.14 | 错误处理 | 统一异常过滤器、Socket 错误事件 | 全局 |

### 4.2 验收标准
- 使用 wscat 或 Postman WebSocket 可跑通：
  - 游客登录 → 创建房间 → 加入房间 → 入座 → 开始游戏 → 操作 → 结算
- 多个 WebSocket 客户端模拟多人对战成功
- 战绩 API 返回正确数据
- 断线 30 秒内重连恢复状态

---

## 5. P3 — 客户端基础

### 5.1 任务清单

| # | 任务 | 详情 | 依赖 |
|---|------|------|------|
| 3.1 | 导航架构 | React Navigation：Auth Stack + Main Tab + Game Stack | P0 |
| 3.2 | SocketService | Socket.IO 封装：连接/断开/重连/事件监听 | shared 类型 |
| 3.3 | Zustand Stores | authStore + roomStore + gameStore | shared 类型 |
| 3.4 | 登录页 | 游客一键登录 + 手机号登录 + 第三方登录入口 | 3.1, 3.2 |
| 3.5 | 主界面 | 头像/昵称/筹码 + 创建房间 + 加入房间 + 底部 Tab | 3.1 |
| 3.6 | 创建房间页 | 参数配置表单 + 创建提交 | 3.2 |
| 3.7 | 加入房间页 | 6 位房间码输入 + 密码弹窗 | 3.2 |
| 3.8 | 房间等待页 | 座位展示 + 房间码 + 分享 + 入座 + 开始 | 3.2, 3.3 |
| 3.9 | Card 组件 | 扑克牌渲染组件（正面/背面） | Skia 或 Image |
| 3.10 | PlayerSeat 组件 | 玩家座位（头像/昵称/筹码/状态/当前下注） | 3.9 |
| 3.11 | 牌桌页 — 布局 | 牌桌背景 + 座位排列 + 公共牌区 + 底池 + 底牌 | 3.9, 3.10 |
| 3.12 | 牌桌页 — 操作面板 | Fold/Check/Call/Raise 按钮 + 加注滑动条 | 3.11 |
| 3.13 | 牌桌页 — 倒计时 | 环形进度条倒计时（Reanimated） | 3.11 |
| 3.14 | 牌桌页 — 核心动画 | 发牌飞牌、筹码滑动、翻牌、弃牌 | Reanimated 3 |
| 3.15 | 结算弹窗 | 显示赢家/牌型/手牌/盈亏 | 3.11 |
| 3.16 | 战绩页 | 汇总数据 + 最近牌局列表 | API 对接 |
| 3.17 | 设置页 | 修改昵称/头像 + 绑定手机号 + 音效开关 + 退出 | 3.3 |
| 3.18 | 分享功能 | 生成房间链接 + 系统分享面板 | React Native Share |
| 3.19 | Deep Link | URL Scheme + Universal Links 配置 + 路由处理 | 3.1 |

### 5.2 验收标准
- 模拟器上完成完整登录 → 建房 → 分享 → 对战 → 查看战绩流程
- 所有页面 UI 与设计稿一致
- 核心动画流畅运行（≥ 30fps）

---

## 6. P4 — 联调与集成

### 6.1 任务清单

| # | 任务 | 详情 |
|---|------|------|
| 4.1 | 前后端联调 — 认证 | 客户端登录 → 服务端认证 → Socket 连接 |
| 4.2 | 前后端联调 — 房间 | 创建/加入/座位全流程 |
| 4.3 | 前后端联调 — 游戏 | 完整牌局（发牌→下注→翻牌→结算） |
| 4.4 | 多设备联调 | 2台+真机同时游戏，验证广播、私密消息 |
| 4.5 | 断线重连联调 | 主动断网 → 恢复 → 牌局继续 |
| 4.6 | Deep Link 联调 | 分享链接 → 其他设备点击 → 打开 App → 进入房间 |
| 4.7 | 边界场景联调 | 掉线后超时、All-in 边池、2 人桌、满桌 9 人 |
| 4.8 | 战绩联调 | 多局游戏后战绩数据正确累计显示 |
| 4.9 | 每日补给联调 | 每日首次登录奖励 + 破产补助 |
| 4.10 | 异常处理联调 | 网络断开提示、服务端错误提示、房间已满提示 |

### 6.2 验收标准
- 3+ 台真机同时联网对战，完整流程无报错
- 断线重连 30 秒内恢复
- Deep Link 在 iOS + Android 双端正常工作
- 边界场景（All-in 边池、2人桌）表现正确

---

## 7. P5 — 测试与上线准备

### 7.1 任务清单

| # | 任务 | 详情 |
|---|------|------|
| 5.1 | Bug 修复 | 联调阶段发现的问题逐一修复 |
| 5.2 | 性能优化 | FPS 检测、内存泄漏排查、包体瘦身 |
| 5.3 | 网络优化 | 弱网测试（3G模拟）、消息压缩 |
| 5.4 | UI 打磨 | 细节调整、适配不同屏幕尺寸、安全区域 |
| 5.5 | 生产环境搭建 | 云服务器 + RDS + Redis + Nginx + SSL 证书 |
| 5.6 | 部署流水线 | GitHub Actions → Docker 构建 → 推送部署 |
| 5.7 | 域名 + Deep Link | 注册域名、配置 Universal Links / App Links |
| 5.8 | 监控与日志 | Sentry 集成（客户端 + 服务端）、日志收集 |
| 5.9 | 隐私政策 + 用户协议 | 编写合规文档（App Store 提审必需） |
| 5.10 | App Store 资料准备 | 应用名/描述/截图/图标/分级 |
| 5.11 | 内部测试 | 邀请 10-20 人封闭测试，收集反馈 |
| 5.12 | 提审上架 | Apple App Store + Google Play 提审 |

### 7.2 验收标准
- 操作响应延迟 < 200ms
- 客户端 FPS ≥ 30
- App 冷启动 < 3 秒
- 包体 < 30MB
- Sentry 无 P0 级崩溃
- App Store / Google Play 审核通过

---

## 8. 任务依赖关系图

```
P0 项目初始化
 │
 ├───► P1 游戏引擎（可与 P0 完成后立即开始）
 │         │
 │         ▼
 │     P2 服务端基础（依赖 P1 游戏引擎核心）
 │         │
 ├───► P3 客户端基础（可与 P1 并行，P0 完成后即可开始 UI 部分）
 │         │
 │         ▼
 │     P4 联调与集成（依赖 P2 + P3 完成）
 │         │
 │         ▼
 └───► P5 测试与上线（依赖 P4）
```

### 并行计划（假设 2-3 人团队）

```
          ┌─ P1 游戏引擎 ──► P2 服务端 ────┐
P0 初始化 ─┤                                ├─► P4 联调 ──► P5 上线
          └─ P3 客户端 UI ─────────────────┘
```

- **开发者 A（后端主力）**：P0 → P1 → P2 → P4（服务端侧）→ P5
- **开发者 B（前端主力）**：P0 → P3（在 P1 并行期间先做 UI）→ P4（客户端侧）→ P5
- **两人重叠阶段**：P0 协作，P4 联调，P5 测试

---

## 9. 风险管理

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|---------|
| 游戏引擎 bug（边池/牌型） | 高 | 高 | P1 阶段高测试覆盖率，TDD 开发 |
| React Native 性能不达标 | 中 | 高 | 尽早在真机测试，动画使用 Reanimated |
| Deep Link 平台兼容问题 | 中 | 中 | 提前调研配置，备用方案（剪贴板粘贴房间码） |
| 第三方登录审核（微信/Apple） | 中 | 中 | 优先开发游客登录，第三方登录不阻塞主流程 |
| App Store 审核被拒 | 低 | 高 | 提前研究扑克类 App 审核要点，准备申诉材料 |
| 单人开发进度风险 | 高 | 高 | 严格控制 V1 范围，不加额外功能 |

---

## 10. 开发规范

### 10.1 Git 分支策略

```
main            ← 生产发布分支
 └── develop    ← 开发主分支
      ├── feature/game-engine     ← P1 功能分支
      ├── feature/server-auth     ← P2 功能分支
      ├── feature/client-ui       ← P3 功能分支
      └── fix/xxx                 ← Bug 修复分支
```

- 所有功能分支从 `develop` 拉出，完成后 PR 合并回 `develop`
- `develop` → `main` 通过 Release PR
- 提交信息格式：`type(scope): message`
  - `feat(game): implement pot calculation`
  - `fix(room): handle duplicate room code`
  - `test(evaluator): add flush comparison tests`

### 10.2 代码审查要求

| 模块 | 审查重点 |
|------|---------|
| 游戏引擎 | 逻辑正确性、边界处理、测试覆盖 |
| 网络通信 | 认证校验、输入验证、错误处理 |
| 数据层 | SQL 安全（Prisma ORM）、事务完整性 |
| 客户端 | 状态管理合理性、内存泄漏、动画性能 |

### 10.3 每日开发节奏

```
每日开始 → 更新 develop → 进入当前任务功能分支
    │
    ▼
开发 + 编写测试 → 本地测试通过
    │
    ▼
提交 PR → CI 检查通过 → Code Review
    │
    ▼
合并到 develop → 更新任务进度
```

---

## 11. 相关文档索引

| 文档 | 路径 | 说明 |
|------|------|------|
| 游戏总设计文档 | [game-design-document.md](game-design-document.md) | 全版本完整设计 |
| 版本路线图 | [version-roadmap.md](version-roadmap.md) | V1-V4 版本规划 |
| V1 游戏设计 | [v1-game-design.md](v1-game-design.md) | V1 功能/规则/UI 详细设计 |
| 总体技术架构 | [tech-stack.md](tech-stack.md) | 全版本技术选型 |
| V1 技术方案 | [v1-tech-design.md](v1-tech-design.md) | V1 具体技术实现方案 |

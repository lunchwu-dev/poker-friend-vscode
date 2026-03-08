# Poker Friends — 项目进度记录

> 记录每个阶段的完成情况，便于回顾和对齐。

---

## 阶段一：游戏设计拆分与 V1 详细方案（✅ 已完成）

**完成时间**: 2026-03-07

| # | 任务 | 产出文件 | 状态 |
|---|------|---------|------|
| 1 | 将完整游戏设计拆分为 4 个版本里程碑 | `version-roadmap.md` | ✅ |
| 2 | 产出 V1 详细游戏设计方案（12个章节） | `v1-game-design.md` | ✅ |
| 3 | 更新主设计文档，添加版本规划引用 | `game-design-document.md` 第15节 | ✅ |

**要点**:
- V1 核心对战版 → V2 社交增强版 → V3 竞技成长版 → V4 运营商业版
- V1 覆盖：完整德州扑克规则、玩家登录、战绩统计、房间创建、多人对战（分享链接/邀请码）

---

## 阶段二：技术架构拆分与 V1 实施计划（✅ 已完成）

**完成时间**: 2026-03-07

| # | 任务 | 产出文件 | 状态 |
|---|------|---------|------|
| 1 | 将 tech-stack 改为总技术架构文档 | `tech-stack.md`（标题改为"技术架构设计"） | ✅ |
| 2 | 产出 V1 技术实现方案（Prisma schema、共享类型、模块结构、Docker） | `v1-tech-design.md` | ✅ |
| 3 | 产出 V1 实施计划（6阶段、50+任务） | `implementation-plan-v1.md` | ✅ |
| 4 | 更新所有文档间的交叉引用 | 各文档 | ✅ |

**要点**:
- 技术栈: React Native + NestJS + PostgreSQL + Redis + Socket.IO
- Monorepo: pnpm workspace (packages/shared + apps/server + apps/mobile)
- 6个实施阶段: P0项目初始化 → P1游戏引擎 → P2服务端 → P3客户端 → P4联调 → P5测试上线

---

## 阶段三：UX 交互视觉方案与 HTML 原型（✅ 已完成）

**完成时间**: 2026-03-07

| # | 任务 | 产出文件 | 状态 |
|---|------|---------|------|
| 1 | 分析 WePoker 截图，提取设计模式 | — (分析结论融入后续文档) | ✅ |
| 2 | 更新 V1 游戏设计文档 UI/UX 章节（Section 6） | `v1-game-design.md` | ✅ |
| 3 | 产出完整 UX 交互与视觉设计方案 | `ux-v1.md` | ✅ |
| 4 | 产出可交互 HTML 牌桌原型（6个屏幕状态） | `prototype/game-table.html` | ✅ |

**要点**:
- 参考 WePoker 设计：椭圆牌桌、自己固定底部、圆形头像、D庄家标记、弃牌遮罩、阶段进度条
- UX 文档覆盖：色彩/字体/图标规范、6页面交互设计、13种动画规范、5组件规范、3交互流程图
- HTML 原型包含：登录→主界面→等待页→游戏中→加注面板→结算 六个状态，支持标注开关

---

## 阶段四：进度跟踪与文档体系（✅ 已完成）

**完成时间**: 2026-03-07

| # | 任务 | 产出文件 | 状态 |
|---|------|---------|------|
| 1 | 创建项目进度记录文档 | `progress.md` | ✅ |
| 2 | 创建文档结构与说明文档 | `file-arch.md` | ✅ |

---

## P0 — 项目初始化（✅ 已完成）

**完成时间**: 2026-03-07

| # | 任务 | 状态 | 备注 |
|---|------|------|------|
| 1 | Monorepo 脚手架搭建 | ✅ | pnpm workspace, root configs (tsconfig, eslint, prettier) |
| 2 | 共享类型包 (packages/shared) | ✅ | Card/Game/Room/User/Events 类型 + 常量, composite build |
| 3 | CI/CD 基础流程 | ✅ | GitHub Actions ci.yml (lint, typecheck, build, test) |
| 4 | 开发环境配置 (Docker Compose) | ✅ | PostgreSQL 16 + Redis 7 容器, healthcheck |
| 5 | NestJS 服务端骨架 | ✅ | Health endpoint, Prisma schema + migration, Game engine services |
| 6 | GitHub 仓库 | ✅ | lunchwu-dev/poker-friend-vscode, 初始提交 67 files |

**开发工具**:
- Node.js v24.14.0, pnpm 10.30.3, TypeScript 5.9.3
- Docker Desktop 29.2.1 (WSL2), JDK 21, Android Studio 2025.3
- Git 2.53.0, GitHub CLI 2.87.3

---

## P0.5 — React Native 客户端脚手架（✅ 已完成）

**完成时间**: 2026-03-07

| # | 任务 | 状态 | 备注 |
|---|------|------|------|
| 1 | React Native 初始化 | ✅ | RN 0.84.1 bare workflow, app name: PokerFriends |
| 2 | Monorepo Metro 配置 | ✅ | watchFolders + resolver nodeModulesPaths for pnpm workspace |
| 3 | 导航框架 | ✅ | React Navigation 7 native-stack (Login/Home/GameTable) |
| 4 | 核心依赖 | ✅ | zustand, socket.io-client, reanimated, gesture-handler |
| 5 | src/ 目录结构 | ✅ | screens, navigation, components, stores, services, hooks, utils, assets |
| 6 | 基础页面 | ✅ | LoginScreen, HomeScreen, GameTableScreen (dark theme + gold accents) |
| 7 | workspace 联动 | ✅ | @poker-friends/shared 链接, TypeScript 检查通过 |

**提交**: `fc4716f` — 58 files, 9380 insertions

---

## P1 — 游戏引擎核心（✅ 已完成）

**完成时间**: 2026-03-07

| # | 任务 | 状态 | 备注 |
|---|------|------|------|
| 1 | DeckService | ✅ | 52卡创建、Fisher-Yates 加密洗牌、发牌, 10 tests |
| 2 | EvaluatorService | ✅ | 10种牌型评估、7→5最优选择(C(7,5)=21)、wheel处理, 22 tests |
| 3 | PotService | ✅ | 主池/边池计算、all-in 分层、分配+奇数筹码, 13 tests |
| 4 | GameEngineService | ✅ | 完整状态机(IDLE→SETTLE)、盲注、行动验证、超时、showdown, 20 tests |
| 5 | Jest 配置修复 | ✅ | moduleNameMapper 路径修正, *.tsbuildinfo 加入 .gitignore |

**测试**: 5 suites, 76 tests, ALL PASSED  
**提交**: `944bce6` — 7 files, 841 insertions

### P2 — 服务端（✅ 已完成）

**完成时间**: 2026-03-07

| # | 任务 | 状态 | 备注 |
|---|------|------|------|
| 1 | PrismaService | ✅ | 全局数据库连接服务, OnModuleInit/Destroy 生命周期 |
| 2 | JWT 认证模块 | ✅ | @nestjs/jwt, 游客登录 (deviceId), 7天token, HTTP Guard + WS中间件 |
| 3 | REST 端点 | ✅ | POST /auth/guest-login (ValidationPipe + class-validator) |
| 4 | 房间管理服务 | ✅ | 创建(6位随机码)/加入/离开/入座/站起, 内存存储, socket映射 |
| 5 | Socket.IO Gateway | ✅ | 全部18种事件处理, JWT握手认证, 操作超时自动check/fold |
| 6 | 手牌历史服务 | ✅ | Prisma事务写入HandHistory+HandPlayer, 用户统计增量更新 |
| 7 | AppModule 集成 | ✅ | PrismaModule(全局) + AuthModule + RoomModule + GameModule + GatewayModule |

**测试**: 8 suites, 99 tests, ALL PASSED (含 P1 的 76 + P2 新增 23)
- auth.service.spec.ts: 5 tests (游客登录、JWT签发/验证)
- room.service.spec.ts: 16 tests (建房/加入/离开/入座/站起/状态查询/socket追踪)
- history.service.spec.ts: 2 tests (手牌记录+用户统计更新)

**E2E 验证**: REST Login → WebSocket 连接 → 建房 → 加入 → 入座 → 发牌 → 行动 → 结算 ✅

### P3 — 客户端
### P3 — 客户端基础（✅ 已完成）

**完成时间**: 2026-03-07

| # | 任务 | 状态 | 备注 |
|---|------|------|------|
| 1 | SocketService 通信封装 | ✅ | 类型安全的 Socket.IO 包装，支持自动重连，事件发布订阅 |
| 2 | Zustand 状态管理 | ✅ | authStore (登录/JWT) + roomStore (房间) + gameStore (牌局) |
| 3 | useSocketEvents Hook | ✅ | 将服务端 Socket 事件自动同步到 Zustand stores |
| 4 | LoginScreen | ✅ | 游客登录对接真实 API + Socket 连接 + 昵称输入 |
| 5 | HomeScreen | ✅ | 创建房间 + 输入房间号加入 + 用户信息显示 + 退出登录 |
| 6 | RoomLobbyScreen | ✅ | 座位选择 + 入座/站起 + 分享房间号 + 开始游戏 |
| 7 | CardView 组件 | ✅ | 扑克牌渲染 (正面/背面, sm/md/lg 三种尺寸) |
| 8 | PlayerSeat 组件 | ✅ | 头像/昵称/筹码/状态/庄家标记/底牌/下注显示 |
| 9 | GameTableScreen | ✅ | 绿色毛毡椭圆牌桌 + 6座位布局 + 公共牌 + 底池 |
| 10 | ActionPanel | ✅ | 弃牌/过牌/跟注/加注(滑动条)/全押 操作面板 |
| 11 | SettlementOverlay | ✅ | 结算弹窗: 赢家/筹码/摊牌手牌/牌型/公共牌 |
| 12 | 导航更新 | ✅ | RoomLobby 加入导航栈, Deep Link 配置保留 |

**新增文件**: 10 files, 1894 insertions  
**依赖**: @react-native-community/slider  
**提交**: `9cb5cf5`  
**验证**: TypeScript 零错误, 服务端 99 tests 全部通过

### P4 — 联调集成（✅ 已完成）

**完成时间**: 2026-03-08

| # | 任务 | 状态 | 备注 |
|---|------|------|------|
| 1 | pnpm hoisted 模式配置 | ✅ | 创建 .npmrc (node-linker=hoisted)，解决 RN Android 构建路径问题 |
| 2 | Android SDK 环境修复 | ✅ | 安装 cmdline-tools (sdkmanager), NDK 27.1.12297006 |
| 3 | Gradle 配置适配 | ✅ | Gradle 8.14.1, buildToolsVersion 36.1.0, monorepo 路径修正 |
| 4 | settings.gradle 路径修复 | ✅ | includeBuild 指向 root node_modules (../../../node_modules) |
| 5 | app/build.gradle 路径修复 | ✅ | reactNativeDir/codegenDir/cliFile 指向 root node_modules |
| 6 | react-native-worklets 依赖 | ✅ | react-native-reanimated 新版本必需依赖 |
| 7 | Android Debug APK 构建 | ✅ | gradlew assembleDebug 成功，app-debug.apk 165MB |
| 8 | 模拟器安装运行 | ✅ | Medium_Phone_API_36.1 模拟器，APK 安装成功 |
| 9 | Metro Bundler 打包 | ✅ | Metro v0.83.5 + RN v0.84, JS Bundle 加载零错误 |
| 10 | 服务端验证 | ✅ | Docker (postgres+redis) + NestJS server 运行正常, 99 tests 全部通过 |

**关键修复**:
- pnpm 默认 symlink 模式不兼容 RN Android 的 Gradle includeBuild → 切换 hoisted
- Gradle 9.0 不兼容 foojay-resolver-convention 0.5.0 → 降至 8.14.1
- Android Gradle Plugin 要求最低 Gradle 8.13

**提交**: `7acafdd`

### P4.5 — 客户端关键Bug修复 + 功能补全（✅ 已完成）

**完成时间**: 2026-03-08

#### Bug 修复（commit `1c71cd2`）

| # | 问题 | 严重度 | 修复方案 | 状态 |
|---|------|--------|---------|------|
| 1 | App.tsx 渲染 RN 模板页而非 RootNavigator | CRITICAL | 替换 NewAppScreen → RootNavigator | ✅ |
| 2 | GameTableScreen/RoomLobbyScreen 缺少 useSocketEvents | CRITICAL | 将 useSocketEvents 提升到 RootNavigator 级别（全局生效） | ✅ |
| 3 | SettlementOverlay 无关闭按钮 | CRITICAL | 添加"继续"按钮，调用 resetHand() | ✅ |
| 4 | HomeScreen 中 useSocketEvents 导致 Hook 顺序错误 | HIGH | 从 HomeScreen 移除，在 RootNavigator 统一订阅 | ✅ |
| 5 | LoginScreen socket.connect() 无错误处理 | HIGH | 添加 try-catch + Alert 提示 | ✅ |
| 6 | HomeScreen 加入房间后 joinCode 未清空 | MEDIUM | 导航到 RoomLobby 前 setJoinCode('') | ✅ |

#### 功能补全（commit `7f0d384`）

| # | 功能 | 描述 | 状态 |
|---|------|------|------|
| 1 | 断线重连（服务端） | 30s断线窗口 + 自动弃牌 + 重连恢复完整游戏快照 | ✅ |
| 2 | 断线重连（客户端） | ConnectionBanner 组件 + connectionStore 状态管理 | ✅ |
| 3 | 战绩页面（服务端） | /stats/me REST 端点 (JWT保护)，返回统计+最近20局 | ✅ |
| 4 | 战绩页面（客户端） | StatsScreen: 6项统计卡片 + 最近对局列表 | ✅ |
| 5 | RoomService 增强 | findRoomByUserId() 支持跨房间查找 | ✅ |

**变更**: 14 files, +573/-42 lines  
**验证**: 99 tests 全通过, APK 构建成功, 模拟器运行无 JS 错误  
**提交**: `1c71cd2` + `7f0d384`（已推送到 GitHub）

### P4.6 — 前端体验优化（✅ 已完成）

**完成时间**: 2026-03-08

> 仅解决影响可玩性和可用性的体验问题，不添加新功能。
> 详细设计: `v1_enhancement.md`

| # | 任务 | 差距项 | 状态 |
|---|------|--------|------|
| 1 | All-in 二次确认 | G3 | ✅ |
| 2 | 按钮触摸反馈 | G2 | ✅ |
| 3 | Loading 状态 | G7 | ✅ |
| 4 | 结算自动消失 | G26 | ✅ |
| 5 | 阶段进度条 | G6 | ✅ |
| 6 | 大尺寸底牌展示 | G14 | ✅ |
| 7 | 加注面板重设计 | G4 | ✅ |
| 8 | 牌面角标布局 | G8 | ✅ |
| 9 | 座位组件重设计 | G9 | ✅ |
| 10 | 操作倒计时环 | G1 | ✅ |

### P4.7 — 游戏逻辑缺陷修复（✅ 已完成）

**完成时间**: 2026-03-08

> 实机测试中发现的关键游戏逻辑缺陷，均已修复并验证。

#### Bug #1：CountdownRing SVG 崩溃（白屏）

| 项目 | 内容 |
|------|------|
| **现象** | 游戏开始后 App 白屏崩溃 |
| **根因** | `CountdownRing` 组件使用了 `react-native-svg`（`RNSVGCircle`），该原生模块未在 Android 构建中链接 |
| **修复** | 用纯 React Native `Animated` API 重写 `CountdownRing`：使用脉冲透明度 + 动态 borderColor（绿→金→红）替代 SVG strokeDashoffset |
| **文件** | `apps/mobile/src/components/CountdownRing.tsx` (新建) |

#### Bug #2：Android 返回键无拦截（误退出）

| 项目 | 内容 |
|------|------|
| **现象** | 牌局进行中按 Android 返回键，直接退回首页，无确认提示；且服务端不知道玩家已离开，游戏卡在等待该玩家操作 |
| **根因** | `GameTableScreen` 未注册 `BackHandler` 拦截；`RoomLobbyScreen` 同理 |
| **修复** | - `GameTableScreen`：添加 `BackHandler` + `Alert` 确认对话框，确认后调用 `socketService.leaveRoom()` 并清理 stores<br>- `RoomLobbyScreen`：添加 `BackHandler` 触发 `handleLeave`<br>- `HomeScreen`：当 store 中存在 `roomCode` 时显示「🎮 游戏中 · 房间 #XXX → 返回房间」横幅 |
| **文件** | `GameTableScreen.tsx`, `RoomLobbyScreen.tsx`, `HomeScreen.tsx` |

#### Bug #3：牌局中玩家离场 → 游戏卡住

| 项目 | 内容 |
|------|------|
| **现象** | 房主离开房间后，剩余玩家一直在等待已退出的玩家出牌，游戏无法继续 |
| **根因** | `removePlayer()` 直接从引擎 `state.players` 数组中删除玩家，导致 `currentPlayerIndex` 偏移——后续玩家编号全部错位。且若离场玩家非当前操作者，其根本不会被弃牌，游戏永远等不到该玩家行动 |
| **修复** | <ol><li>新增 `forcePlayerFold(roomCode, playerId)` 引擎方法：分"是/否当前操作者"两种情况妥善处理弃牌、检测是否需要结算或推进下注轮</li><li>Gateway `handleRoomLeave` 完全重写：先 forcePlayerFold → 广播弃牌 → 清座位 → leaveRoom → 广播状态</li><li>Gateway `handleDisconnect` 同步更新为 forcePlayerFold 模式</li><li>`autoStartNextHand` 在新手牌发之前清理已离场玩家（此时才从数组中移除，不破坏进行中的索引）</li></ol> |
| **文件** | `game-engine.service.ts`, `game.gateway.ts` |

#### Bug #4：房主离场后身份未转移

| 项目 | 内容 |
|------|------|
| **现象** | 房主离开后，房间内剩余玩家无法执行房主操作（如开始下一场游戏） |
| **根因** | `room.service.ts` 的 `leaveRoom()` 方法未处理房主离场的情况 |
| **修复** | 在 `leaveRoom()` 中增加：若离开者是 `room.hostId`，将 `hostId` 设为房间 players Map 中下一位玩家的 ID |
| **文件** | `room.service.ts` |

#### 设计文档更新

上述修复涉及的游戏逻辑规则已同步写入设计文档：
- `v1-game-design.md` 新增 **4.7 牌局中途离场规则**（含强制弃牌流程、关键设计约束）
- `v1-game-design.md` 更新 **4.3 房间生命周期**（增加房主离场分支）
- `v1-game-design.md` 更新 **4.4 座位管理**（增加"牌局中离场"行为）
- `v1-game-design.md` 更新 **4.5 房主权限**（增加"房主转移"规则）
- `v1-game-design.md` 更新 **7.3 断线重连**（明确与 forcePlayerFold 的关联）
- `v1-game-design.md` 更新 **9.2 操作超时与中途离场处理**
- `game-design-document.md` 更新 **10.2 断线重连** 和 **8.4 操作体验**

**验证**: 99 tests 全通过, TypeScript 编译无错误, 服务端重启健康检查正常

### P5 — 测试与上线
- [ ] 单元测试 + 集成测试
- [ ] 压力测试
- [ ] 部署上线

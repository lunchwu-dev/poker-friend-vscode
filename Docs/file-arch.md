# Poker Friends — 文档结构与说明

> 记录项目所有文档的结构、用途及相互关系，便于团队成员快速了解文档体系。

---

## 目录结构

```
1st-dexas-poker-game/
├── Docs/                              # 项目文档根目录
│   ├── game-design-document.md        # 📋 总游戏设计方案
│   ├── version-roadmap.md             # 🗺️ 版本路线图 (V1-V4)
│   ├── v1-game-design.md              # 🎮 V1 详细游戏设计
│   ├── tech-stack.md                  # 🏗️ 总技术架构设计
│   ├── v1-tech-design.md              # ⚙️ V1 技术实现方案
│   ├── implementation-plan-v1.md      # 📅 V1 实施计划
│   ├── ux-v1.md                       # 🎨 V1 UX 交互视觉方案
│   ├── progress.md                    # ✅ 项目进度记录
│   ├── file-arch.md                   # 📂 文档结构说明（本文件）
│   └── prototype/                     # 🖥️ 可交互原型
│       └── game-table.html            #     牌桌 HTML 原型
│
└── Referance-design/                  # 参考设计素材
    └── *.jpeg                         #     WePoker 截图等参考图片
```

---

## 文档详细说明

### 设计类文档

| 文档 | 用途 | 主要内容 | 引用关系 |
|------|------|---------|----------|
| **game-design-document.md** | 全版本的总游戏设计方案，顶层设计蓝图 | 游戏概述、核心玩法、用户系统、社交系统、商业化等全局设计 | 被 version-roadmap.md 引用；第15节链接到 version-roadmap 和 v1-game-design |
| **version-roadmap.md** | 定义 V1→V4 四个版本的功能范围与里程碑 | V1 核心对战版、V2 社交增强版、V3 竞技成长版、V4 运营商业版 | 引用 game-design-document.md；V1 章节链接到三个 V1 文档 |
| **v1-game-design.md** | V1 版本的详细游戏设计（12章节） | 完整德州扑克规则（含2人特殊规则/边池）、用户系统（游客/手机号/微信/Apple登录）、房间系统（6位房间码/Deep Link/生命周期）、战绩系统、UI/UX 概要、网络事件定义、游戏引擎状态机、验收标准 | 引用 ux-v1.md 和 prototype/game-table.html |

### 技术类文档

| 文档 | 用途 | 主要内容 | 引用关系 |
|------|------|---------|----------|
| **tech-stack.md** | 全版本的技术架构设计，技术选型依据 | 技术栈选型（React Native/NestJS/PostgreSQL/Redis/Socket.IO）、数据库概要设计、Socket.IO 事件定义、部署架构、安全策略、性能预估 | 被 v1-tech-design.md 引用 |
| **v1-tech-design.md** | V1 版本的具体技术实现方案 | Monorepo 结构、TypeScript 类型定义（Card/GameStage/ActionType/SocketEvent 等）、服务伪代码（GameService/DeckService/EvaluatorService/PotService）、Prisma Schema（User/HandHistory/HandPlayer）、Zustand Store、SocketService、Docker/Nginx 配置、测试策略 | 引用 tech-stack.md |
| **implementation-plan-v1.md** | V1 的工程实施执行计划 | 6个阶段（P0初始化→P1引擎→P2服务端→P3客户端→P4联调→P5上线）、50+具体任务及依赖关系、2-3人团队并行方案、Git分支策略、风险管理 | 引用所有 V1 文档 |

### UX 与原型

| 文档 | 用途 | 主要内容 | 引用关系 |
|------|------|---------|----------|
| **ux-v1.md** | V1 的交互设计与视觉规范，工程实现参考 | 设计原则、色彩规范（主色板/按钮色/扑克牌色/状态色）、字体规范、图标资源、布局系统（屏幕分区/9人座位分布/座位组件）、6个核心页面交互设计（含线框图）、操作面板交互细节、13种动画规范（含优先级）、5个组件规范（扑克牌/座位/按钮/底池/进度条）、3个交互流程图、响应式适配、无障碍设计 | 引用 prototype/game-table.html；被 v1-game-design.md 引用 |
| **prototype/game-table.html** | 可在浏览器中直接打开的交互原型 | 6个屏幕状态（登录→主界面→等待页→游戏中→加注面板→结算）的完整视觉还原，支持状态切换和设计标注开关，供工程师对照实现 | 被 ux-v1.md 和 v1-game-design.md 引用 |

### 管理类文档

| 文档 | 用途 | 主要内容 |
|------|------|---------|
| **progress.md** | 项目进度跟踪 | 各阶段完成情况、任务清单、后续待办 |
| **file-arch.md** | 文档体系说明（本文件） | 目录结构、每个文档的用途/内容/引用关系、阅读顺序推荐 |

---

## 文档引用关系

```
game-design-document.md (全局设计)
  ├──→ version-roadmap.md (版本路线图)
  │       └──→ v1-game-design.md (V1 游戏设计)
  │               └──→ ux-v1.md (V1 UX 方案)
  │                       └──→ prototype/game-table.html (HTML 原型)
  │
  └──→ tech-stack.md (技术架构)
          └──→ v1-tech-design.md (V1 技术方案)
                  └──→ implementation-plan-v1.md (V1 实施计划)

管理类:
  progress.md ← 跟踪所有阶段进度
  file-arch.md ← 描述以上全部文档 (本文件)
```

---

## 推荐阅读顺序

1. **了解全貌**: game-design-document.md → version-roadmap.md
2. **理解 V1 需求**: v1-game-design.md
3. **看交互视觉**: ux-v1.md → 打开 prototype/game-table.html
4. **理解技术方案**: tech-stack.md → v1-tech-design.md
5. **开始开发**: implementation-plan-v1.md → progress.md（跟踪进度）

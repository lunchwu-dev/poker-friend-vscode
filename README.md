# Poker Friends

> Texas Hold'em 德州扑克手游 — React Native + NestJS 全栈项目

## 技术栈

- **客户端**: React Native + TypeScript + Zustand + Socket.IO Client
- **服务端**: NestJS + TypeScript + Prisma + Socket.IO
- **数据库**: PostgreSQL 16 + Redis 7
- **工程化**: pnpm Monorepo

## 项目结构

```
├── packages/shared/    # 前后端共享类型与常量
├── apps/server/        # NestJS 服务端
├── apps/mobile/        # React Native 客户端
└── Docs/               # 设计文档
```

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动数据库
docker-compose up -d

# 启动服务端
pnpm dev:server

# 启动客户端
pnpm dev:mobile
```

## 文档

详见 [Docs/](Docs/) 目录。

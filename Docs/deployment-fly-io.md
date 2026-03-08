# Poker Friends — Fly.io 公网部署方案

> 将 NestJS 服务端部署到 Fly.io 云平台，配合 Cloudflare DNS，实现公网可访问的 HTTPS + WebSocket 服务。

---

## 1. 架构总览

```
┌──────────────────┐         ┌──────────────────────────────────┐
│  Android App     │         │  Fly.io (东京/新加坡节点)          │
│  (Release APK)   │────────►│                                  │
│                  │  WSS    │  ┌────────────┐                  │
│  手机浏览器       │  HTTPS  │  │  NestJS    │                  │
│  (Web Client)    │────────►│  │  Server    │                  │
└──────────────────┘         │  │  :3000     │                  │
                             │  └─────┬──────┘                  │
                             │        │                         │
                             │  ┌─────┴──────┐  ┌────────────┐ │
                             │  │ PostgreSQL  │  │   Redis    │ │
                             │  │  (Fly PG)   │  │ (Upstash)  │ │
                             │  └─────────────┘  └────────────┘ │
                             └──────────────────────────────────┘
```

### 组件分配

| 组件 | 方案 | 说明 |
|------|------|------|
| **NestJS 服务** | Fly.io Machine | Docker 容器部署，自动 HTTPS |
| **PostgreSQL** | Fly Postgres | Fly.io 托管，与服务同区域，内网连接 |
| **Redis** | Upstash Redis | 免费版 10,000 命令/天，Fly.io 原生集成 |
| **域名 + DNS** | Cloudflare | 你已有账号，管理 DNS 解析 |
| **SSL** | Fly.io 自动签发 | 自动 Let's Encrypt 证书 |
| **Android 客户端** | Release APK 直装 | 不上架商店，直接分发 APK 文件 |

### 费用估算

| 项目 | 免费额度 | 超出费用 |
|------|---------|---------|
| Fly Machine (shared-cpu-1x, 256MB) | 3 个免费实例 | $1.94/月 |
| Fly Postgres (1GB) | 3GB 免费 | — |
| Upstash Redis | 10,000 命令/天 | $0.2/100K 命令 |
| Cloudflare DNS | 免费 | — |
| **总计** | **~$0/月**（免费额度内） | ~$5/月 |

---

## 2. 前置准备（需要你操作）

### 2.1 注册 Fly.io 账号

1. 打开 https://fly.io/app/sign-up
2. 用 GitHub 账号注册（最快）
3. **绑定信用卡**（Fly.io 要求绑卡才能使用免费额度，不会被扣费）
4. 注册完成后记住你的账户

### 2.2 安装 flyctl CLI

在 PowerShell（管理员模式）中运行：

```powershell
# Windows - 使用 PowerShell 安装
powershell -Command "irm https://fly.io/install.ps1 | iex"
```

或者通过 winget：

```powershell
winget install flyctl
```

安装完成后验证：

```powershell
flyctl version
```

### 2.3 登录 flyctl

```powershell
flyctl auth login
```

会打开浏览器让你授权，授权成功后终端会显示登录成功。

### 2.4 Cloudflare 域名准备（可选）

如果你有域名想绑定到 Cloudflare：
- 在 Cloudflare Dashboard → 添加站点 → 配置 DNS
- 暂时不需要，Fly.io 会自动分配 `xxx.fly.dev` 域名
- **先用 fly.dev 域名测试，后续再绑自定义域名**

---

## 3. 部署配置文件（我来创建）

### 3.1 Dockerfile

```dockerfile
# ---- 阶段 1: 安装依赖 + 构建 ----
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# 拷贝 workspace 配置
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/shared/package.json packages/shared/
COPY apps/server/package.json apps/server/

# 安装依赖
RUN pnpm install --frozen-lockfile

# 拷贝源代码
COPY packages/shared/ packages/shared/
COPY apps/server/ apps/server/
COPY tsconfig.base.json ./

# 构建 shared 包
RUN pnpm --filter @poker-friends/shared build

# 生成 Prisma Client
RUN cd apps/server && npx prisma generate

# 构建 server
RUN pnpm --filter @poker-friends/server build

# ---- 阶段 2: 精简运行镜像 ----
FROM node:20-alpine AS runner

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# 拷贝 workspace 配置和锁文件
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/shared/package.json packages/shared/
COPY apps/server/package.json apps/server/

# 仅安装生产依赖
RUN pnpm install --frozen-lockfile --prod

# 拷贝构建产物
COPY --from=builder /app/packages/shared/dist packages/shared/dist
COPY --from=builder /app/apps/server/dist apps/server/dist
COPY --from=builder /app/apps/server/node_modules/.prisma apps/server/node_modules/.prisma
COPY apps/server/prisma apps/server/prisma
COPY apps/server/public apps/server/public

# 设置环境
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# 启动: 先执行 Prisma 迁移，再启动服务
CMD ["sh", "-c", "cd apps/server && npx prisma migrate deploy && node dist/main.js"]
```

### 3.2 .dockerignore

```
node_modules
.git
*.md
Docs/
Design-Compare/
Referance-design/
apps/mobile
scripts/
screenshot.png
.env*
dist
```

### 3.3 fly.toml（Fly.io 配置）

```toml
app = "poker-friends-server"
primary_region = "nrt"  # 东京节点（离中国最近）

[build]
  dockerfile = "Dockerfile"

[env]
  NODE_ENV = "production"
  PORT = "3000"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = "stop"      # 无流量时自动停机（省费用）
  auto_start_machines = true       # 有请求时自动启动
  min_machines_running = 0

  [http_service.concurrency]
    type = "connections"
    hard_limit = 250
    soft_limit = 200

[[vm]]
  memory = "512mb"
  cpu_kind = "shared"
  cpus = 1
```

---

## 4. 部署步骤

> 以下步骤中，**标 ⭐ 的需要你手动操作**，其余我来执行。

### 步骤 1: ⭐ 安装 flyctl 并登录

```powershell
# 安装 (选一种)
powershell -Command "irm https://fly.io/install.ps1 | iex"

# 登录
flyctl auth login

# 验证
flyctl auth whoami
```

### 步骤 2: 我创建部署配置文件

我会在项目中创建以下文件：
- `Dockerfile` — 多阶段构建配置
- `.dockerignore` — 排除不需要的文件
- `fly.toml` — Fly.io 部署配置

### 步骤 3: ⭐ 创建 Fly.io App

```powershell
cd F:\Code-Base\1st-dexas-poker-game
flyctl apps create poker-friends-server --region nrt
```

> 如果 `poker-friends-server` 名称被占用，换一个，比如 `poker-friends-xxx`（xxx 改成你想要的后缀），然后告诉我新名称。

### 步骤 4: ⭐ 创建 Fly Postgres 数据库

```powershell
flyctl postgres create --name poker-friends-db --region nrt --vm-size shared-cpu-1x --volume-size 1
```

创建完成后，附加到 App：

```powershell
flyctl postgres attach poker-friends-db --app poker-friends-server
```

> 这一步会自动将 `DATABASE_URL` 注入到 App 的环境变量中。

### 步骤 5: ⭐ 创建 Redis（Upstash）

```powershell
flyctl redis create --name poker-friends-redis --region nrt --no-eviction
```

创建完成后会输出 Redis URL，类似：
```
redis://default:xxxxx@fly-poker-friends-redis.upstash.io:6379
```

设置到环境变量：

```powershell
flyctl secrets set REDIS_URL="<上面输出的 Redis URL>" --app poker-friends-server
```

### 步骤 6: ⭐ 设置密钥环境变量

```powershell
flyctl secrets set JWT_SECRET="你自己想一个强密码-至少32位的随机字符串" --app poker-friends-server
```

例如：
```powershell
flyctl secrets set JWT_SECRET="pf-prod-$(([guid]::NewGuid()).ToString('N'))" --app poker-friends-server
```

### 步骤 7: 我修改客户端服务端地址

将 App 中的 `SERVER_URL` 生产环境地址改为：
```
https://poker-friends-server.fly.dev
```

### 步骤 8: ⭐ 首次部署

```powershell
cd F:\Code-Base\1st-dexas-poker-game
flyctl deploy
```

> 首次部署需要构建 Docker 镜像，可能需要 3-5 分钟。
> 部署成功后访问 https://poker-friends-server.fly.dev/health 验证。

### 步骤 9: 验证部署

```powershell
# 检查状态
flyctl status --app poker-friends-server

# 查看日志
flyctl logs --app poker-friends-server

# 打开浏览器验证
flyctl open --app poker-friends-server
```

### 步骤 10: 我构建 Release APK

构建连接公网服务的 Android Release APK，直接发给朋友安装。

---

## 5. 客户端适配

### 5.1 服务端地址配置

当前代码中 `SERVER_URL` 的生产值硬编码为 `https://api.pokerfriends.app`，需改为 Fly.io 分配的域名。

涉及文件（3 处）：
- `apps/mobile/src/services/socket.ts`
- `apps/mobile/src/screens/LoginScreen.tsx`
- `apps/mobile/src/screens/StatsScreen.tsx`

统一改为：

```typescript
const SERVER_URL = __DEV__
  ? 'http://10.0.2.2:3000'
  : 'https://poker-friends-server.fly.dev';
```

### 5.2 构建 Release APK

```powershell
cd apps/mobile/android
./gradlew assembleRelease
```

Release APK 输出路径：`apps/mobile/android/app/build/outputs/apk/release/app-release.apk`

> 注意：首次构建 Release 需要签名配置，我会配置 debug signing 用于测试分发。

---

## 6. 自定义域名（可选，后续操作）

如果想把 `poker-friends-server.fly.dev` 换成自定义域名（如 `api.poker.yourdomain.com`）：

### 6.1 Fly.io 端

```powershell
flyctl certs create api.poker.yourdomain.com --app poker-friends-server
```

### 6.2 Cloudflare 端

在 Cloudflare DNS 添加 CNAME 记录：

| Type | Name | Target | Proxy |
|------|------|--------|-------|
| CNAME | api.poker | poker-friends-server.fly.dev | **DNS Only**（灰色云朵） |

> 重要：Fly.io 需要直连，Cloudflare 代理会干扰 WebSocket，必须设为 "DNS Only"。

---

## 7. 后续运维

### 7.1 更新部署

代码改动后重新部署：

```powershell
cd F:\Code-Base\1st-dexas-poker-game
flyctl deploy
```

### 7.2 查看日志

```powershell
flyctl logs --app poker-friends-server
```

### 7.3 SSH 进入容器

```powershell
flyctl ssh console --app poker-friends-server
```

### 7.4 数据库操作

```powershell
# 连接到 Postgres
flyctl postgres connect --app poker-friends-db

# 运行 Prisma 迁移（已在 CMD 中自动执行）
flyctl ssh console --app poker-friends-server -C "cd apps/server && npx prisma migrate deploy"
```

### 7.5 扩缩容

```powershell
# 调整内存
flyctl scale memory 512 --app poker-friends-server

# 调整实例数
flyctl scale count 2 --app poker-friends-server
```

### 7.6 监控

- Fly.io Dashboard: https://fly.io/apps/poker-friends-server/monitoring
- Grafana 指标：CPU、内存、请求量、延迟

---

## 8. 自动部署（CI/CD，后续优化）

在 `.github/workflows/deploy.yml` 中配置：

```yaml
name: Deploy to Fly.io
on:
  push:
    branches: [master]
    paths:
      - 'apps/server/**'
      - 'packages/shared/**'
      - 'Dockerfile'
      - 'fly.toml'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --remote-only
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

> 先手动部署验证，确认无误后再配 CI/CD。

---

## 9. 安全清单

| 项目 | 措施 | 状态 |
|------|------|------|
| HTTPS 强制 | fly.toml `force_https = true` | ✅ 已配置 |
| JWT Secret | 通过 `flyctl secrets` 注入，不存代码 | ✅ |
| 数据库密码 | Fly Postgres 自动生成，内网连接 | ✅ |
| Redis 密码 | Upstash 自动生成 | ✅ |
| CORS | 生产环境应限制 origin | ⏳ 部署后配置 |
| 数据库 URL | 环境变量注入，不硬编码 | ✅ |

---

## 10. 操作检查表

按顺序完成以下步骤：

- [ ] **你**：注册 Fly.io 账号 + 绑信用卡
- [ ] **你**：安装 flyctl CLI (`irm https://fly.io/install.ps1 | iex`)
- [ ] **你**：运行 `flyctl auth login` 登录
- [ ] **你**：运行 `flyctl auth whoami` 确认登录成功 → 告诉我结果
- [ ] **我**：创建 Dockerfile + .dockerignore + fly.toml
- [ ] **你**：运行 `flyctl apps create` 创建 App → 告诉我 App 名称
- [ ] **你**：运行 `flyctl postgres create` 创建数据库
- [ ] **你**：运行 `flyctl postgres attach` 附加数据库到 App
- [ ] **你**：运行 `flyctl redis create` 创建 Redis → 告诉我 Redis URL
- [ ] **你**：运行 `flyctl secrets set` 设置 JWT_SECRET 和 REDIS_URL
- [ ] **我**：修改客户端 SERVER_URL 为 fly.dev 域名
- [ ] **你**：运行 `flyctl deploy` 首次部署
- [ ] **一起**：验证 health endpoint + WebSocket 连接
- [ ] **我**：构建 Release APK
- [ ] **你**：安装 APK 到真机测试

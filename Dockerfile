# ===== Stage 1: Builder =====
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.30.3 --activate

WORKDIR /app

# Copy workspace config
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json packages/shared/
COPY apps/server/package.json apps/server/

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/shared/ packages/shared/
COPY apps/server/ apps/server/

# Build shared package first, then server
RUN pnpm --filter @poker-friends/shared build
RUN pnpm --filter @poker-friends/server build

# Generate Prisma client
RUN cd apps/server && npx prisma generate

# ===== Stage 2: Runner =====
FROM node:20-alpine AS runner

RUN corepack enable && corepack prepare pnpm@10.30.3 --activate

WORKDIR /app

# Copy workspace config
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json packages/shared/
COPY apps/server/package.json apps/server/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built artifacts from builder
COPY --from=builder /app/packages/shared/dist packages/shared/dist
COPY --from=builder /app/apps/server/dist apps/server/dist
COPY --from=builder /app/apps/server/node_modules/.prisma apps/server/node_modules/.prisma

# Copy Prisma schema (needed for migrate deploy)
COPY apps/server/prisma apps/server/prisma

# Copy public assets
COPY apps/server/public apps/server/public

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Run migrations then start server
CMD cd apps/server && npx prisma migrate deploy && node dist/main

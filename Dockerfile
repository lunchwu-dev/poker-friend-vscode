# ===== Single-stage: pre-built artifacts =====
FROM node:22-alpine

RUN corepack enable && corepack prepare pnpm@10.30.3 --activate

WORKDIR /app

# Copy workspace config
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json packages/shared/
COPY apps/server/package.json apps/server/

# Use hoisted node-linker to avoid pnpm symlink issues in Docker
RUN echo "node-linker=hoisted" > .npmrc

# Install production dependencies only
RUN pnpm install --no-frozen-lockfile --prod

# Copy pre-built artifacts (built locally before deploy)
COPY packages/shared/dist/ packages/shared/dist/
COPY apps/server/dist/ apps/server/dist/

# Copy Prisma schema and generate client
COPY apps/server/prisma/ apps/server/prisma/
RUN cd apps/server && npx prisma generate

# Copy public assets
COPY apps/server/public/ apps/server/public/

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Run migrations then start server
CMD cd apps/server && npx prisma migrate deploy && node dist/main

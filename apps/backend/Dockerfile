FROM europe-north1-docker.pkg.dev/holi-shared/docker-hub-remote/oven/bun:1 AS builder

WORKDIR /app

ENV NODE_ENV=production

# Install only the workspace packages needed to build the backend.
COPY package.json bun.lock turbo.json ./
COPY apps/backend ./apps/backend
COPY apps/frontend/package.json ./apps/frontend/package.json
COPY packages/data ./packages/data
COPY packages/ui ./packages/ui
COPY packages/typescript-config ./packages/typescript-config

RUN bun install --frozen-lockfile

# Build the NestJS backend
WORKDIR /app/apps/backend
RUN bun run build


FROM europe-north1-docker.pkg.dev/holi-shared/docker-hub-remote/oven/bun:1 AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package.json bun.lock turbo.json ./
COPY apps/backend ./apps/backend
COPY apps/frontend/package.json ./apps/frontend/package.json
COPY packages/data ./packages/data
COPY packages/ui ./packages/ui
COPY packages/typescript-config ./packages/typescript-config

RUN bun install --frozen-lockfile --production --ignore-scripts

WORKDIR /app/apps/backend

# Copy build artifacts from builder stage
COPY --from=builder /app/apps/backend/dist ./dist

EXPOSE 8080

CMD ["sh", "-c", "bun run db:migrate && bun run db:seed && bun run start:prod"]


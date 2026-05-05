FROM europe-north1-docker.pkg.dev/holi-shared/docker-hub-remote/oven/bun:1 AS builder

WORKDIR /app

ENV NODE_ENV=production

# Install dependencies for the whole monorepo so workspace packages are available
COPY package.json bun.lock turbo.json ./
COPY apps ./apps
COPY packages ./packages

RUN bun install --frozen-lockfile

# Build the NestJS backend
WORKDIR /app/apps/backend
RUN bun run build


FROM europe-north1-docker.pkg.dev/holi-shared/docker-hub-remote/oven/bun:1 AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package.json bun.lock turbo.json ./
COPY apps ./apps
COPY packages ./packages

RUN bun install --frozen-lockfile --production --ignore-scripts

WORKDIR /app/apps/backend

# Copy build artifacts from builder stage
COPY --from=builder /app/apps/backend/dist ./dist

EXPOSE 8080

CMD ["sh", "-c", "bun run db:migrate && bun run db:seed && bun run start:prod"]


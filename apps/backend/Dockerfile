FROM oven/bun:1 AS builder

WORKDIR /app

# Install dependencies for the whole monorepo so workspace packages are available
COPY package.json turbo.json ./
COPY apps ./apps
COPY packages ./packages

RUN bun install

# Build the NestJS backend
WORKDIR /app/apps/backend
RUN bun run build


FROM oven/bun:1 AS runner

WORKDIR /app

COPY package.json turbo.json ./
COPY apps ./apps
COPY packages ./packages

RUN bun install --production --ignore-scripts

WORKDIR /app/apps/backend

# Copy build artifacts from builder stage
COPY --from=builder /app/apps/backend/dist ./dist

EXPOSE 3000

CMD ["sh", "-c", "bun run db:migrate && bun run start:prod"]


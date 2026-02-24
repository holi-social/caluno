FROM oven/bun:1

WORKDIR /app

# Install dependencies for the whole monorepo so workspace packages are available
COPY package.json turbo.json ./
COPY apps ./apps
COPY packages ./packages

RUN bun install

# Build the NestJS backend
WORKDIR /app/apps/backend
RUN bun run build

EXPOSE 3000

CMD ["sh", "-c", "bun run db:migrate && bun run start:prod"]


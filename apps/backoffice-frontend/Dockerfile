FROM oven/bun:1

WORKDIR /app

# Install dependencies for the whole monorepo so workspace packages are available
COPY package.json turbo.json ./
COPY apps ./apps
COPY packages ./packages

RUN bun install

# Build the Next.js app
WORKDIR /app/apps/backoffice-frontend
RUN bun run build

ENV NODE_ENV=production
EXPOSE 3000

CMD ["bun", "run", "start"]


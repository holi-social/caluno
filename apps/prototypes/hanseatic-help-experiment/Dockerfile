FROM oven/bun:1 AS builder

WORKDIR /app

ENV NODE_ENV=production

COPY package.json bun.lock* turbo.json ./
COPY apps ./apps
COPY packages ./packages

RUN bun install --frozen-lockfile

WORKDIR /app/apps/prototypes/hanseatic-help-experiment
RUN bun run build

FROM oven/bun:1 AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY package.json bun.lock* turbo.json ./
COPY apps ./apps
COPY packages ./packages

RUN bun install --production --ignore-scripts

COPY --from=builder /app/apps/prototypes/hanseatic-help-experiment/.next ./apps/prototypes/hanseatic-help-experiment/.next
COPY --from=builder /app/apps/prototypes/hanseatic-help-experiment/public ./apps/prototypes/hanseatic-help-experiment/public

WORKDIR /app/apps/prototypes/hanseatic-help-experiment

EXPOSE 3000

CMD ["sh", "-c", "bun run db:migrate && node .next/standalone/apps/prototypes/hanseatic-help-experiment/server.js"]

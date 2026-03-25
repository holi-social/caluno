FROM oven/bun:1 AS dependencies

WORKDIR /app

COPY package.json bun.lock* turbo.json ./
COPY apps ./apps
COPY packages ./packages

RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --no-save --frozen-lockfile

FROM oven/bun:1 AS builder

WORKDIR /app

COPY --from=dependencies /app ./

ENV NODE_ENV=production

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WEB_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_WEB_URL=${NEXT_PUBLIC_WEB_URL}

WORKDIR /app/apps/frontend
RUN bun run build

FROM oven/bun:1 AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

COPY --from=builder --chown=bun:bun /app/apps/frontend/public ./apps/frontend/public

COPY --from=builder --chown=bun:bun /app/apps/frontend/.next/standalone ./
COPY --from=builder --chown=bun:bun /app/apps/frontend/.next/static ./apps/frontend/.next/static

USER bun

EXPOSE 3000

CMD ["bun", "apps/frontend/server.js"]


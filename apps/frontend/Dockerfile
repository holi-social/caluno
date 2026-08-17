FROM ghcr.io/holi-social/mirror/oven-bun:1 AS dependencies

WORKDIR /app

COPY package.json bun.lock* turbo.json ./
COPY apps ./apps
COPY packages ./packages

RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --no-save --frozen-lockfile

FROM ghcr.io/holi-social/mirror/oven-bun:1 AS builder

WORKDIR /app

COPY --from=dependencies /app ./

ENV NODE_ENV=production

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WEB_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_WEB_URL=${NEXT_PUBLIC_WEB_URL}

ARG NEXT_PUBLIC_SENTRY_DSN
ARG NEXT_PUBLIC_SENTRY_ENVIRONMENT
ARG SENTRY_RELEASE
ARG SENTRY_ORG
ARG SENTRY_PROJECT_FRONTEND
ENV NEXT_PUBLIC_SENTRY_DSN=${NEXT_PUBLIC_SENTRY_DSN}
ENV NEXT_PUBLIC_SENTRY_ENVIRONMENT=${NEXT_PUBLIC_SENTRY_ENVIRONMENT}
ENV SENTRY_RELEASE=${SENTRY_RELEASE}
ENV SENTRY_ORG=${SENTRY_ORG}
ENV SENTRY_PROJECT=${SENTRY_PROJECT_FRONTEND}

WORKDIR /app/apps/frontend
# SENTRY_AUTH_TOKEN is mounted as a BuildKit secret — never persisted in a layer.
RUN --mount=type=secret,id=sentry_auth_token,env=SENTRY_AUTH_TOKEN \
    bun run build

FROM ghcr.io/holi-social/mirror/oven-bun:1 AS runner

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


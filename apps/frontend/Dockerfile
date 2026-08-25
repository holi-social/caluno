# syntax=docker/dockerfile:1
FROM ghcr.io/holi-social/mirror/oven-bun:1 AS builder

# sentry-cli needs this during `next build`; kept at the top so it stays cached.
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Manifests only, so the install below is keyed on the lockfile and survives
# source-only commits. The cache mount helps local builds; CI runners are
# ephemeral, so the layer cache is what pays off there.
COPY package.json bun.lock turbo.json ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/data/package.json ./packages/data/
COPY packages/ui/package.json ./packages/ui/
COPY packages/observability/package.json ./packages/observability/
COPY packages/typescript-config/package.json ./packages/typescript-config/

# --ignore-scripts: @repo/data's postinstall runs codegen, which needs source.
# NODE_ENV stays unset so devDependencies (next, tailwind, typescript) install.
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile --ignore-scripts

# Only the codegen inputs turbo.json declares are taken from apps/backend.
COPY apps/backend/src/schema.gql ./apps/backend/src/schema.gql
COPY apps/frontend ./apps/frontend
COPY packages/data ./packages/data
COPY packages/ui ./packages/ui
COPY packages/observability ./packages/observability
COPY packages/typescript-config ./packages/typescript-config

# The @repo/data postinstall, deferred from the install above.
RUN bun run --cwd packages/data codegen

# Build @repo/observability (dist/ is dockerignored; next build imports its exports)
RUN bun run --cwd packages/observability build

ENV NODE_ENV=production

# Late, so everything above is shared between the per-environment build caches.
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
# The .next/cache mount helps local builds only: cache mounts are builder-local
# and are not exported by `cache-to`.
RUN --mount=type=secret,id=sentry_auth_token,env=SENTRY_AUTH_TOKEN \
    --mount=type=cache,target=/app/apps/frontend/.next/cache \
    bun run build


FROM ghcr.io/holi-social/mirror/oven-bun:1 AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ARG SENTRY_RELEASE
ENV SENTRY_RELEASE=${SENTRY_RELEASE}

COPY --from=builder --chown=bun:bun /app/apps/frontend/public ./apps/frontend/public

COPY --from=builder --chown=bun:bun /app/apps/frontend/.next/standalone ./
COPY --from=builder --chown=bun:bun /app/apps/frontend/.next/static ./apps/frontend/.next/static

USER bun

EXPOSE 3000

CMD ["bun", "apps/frontend/server.js"]

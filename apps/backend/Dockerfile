# syntax=docker/dockerfile:1
FROM ghcr.io/holi-social/mirror/oven-bun:1 AS builder

WORKDIR /app

ENV NODE_ENV=production

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
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile --ignore-scripts

COPY apps/backend ./apps/backend
COPY packages/data ./packages/data
COPY packages/ui ./packages/ui
COPY packages/observability ./packages/observability
COPY packages/typescript-config ./packages/typescript-config

# The @repo/data postinstall, deferred from the install above.
RUN bun run --cwd packages/data codegen

# Build @repo/observability (dist/ is dockerignored, so it must be built in-image)
RUN bun run --cwd packages/observability build

# Build the NestJS backend
WORKDIR /app/apps/backend

ARG SENTRY_RELEASE
ARG SENTRY_ORG
ARG SENTRY_PROJECT_BACKEND
ENV SENTRY_RELEASE=${SENTRY_RELEASE}
ENV SENTRY_ORG=${SENTRY_ORG}
ENV SENTRY_PROJECT=${SENTRY_PROJECT_BACKEND}

RUN --mount=type=secret,id=sentry_auth_token,env=SENTRY_AUTH_TOKEN \
    bun run build && \
    if [ -n "$SENTRY_RELEASE" ]; then \
      apt-get update && apt-get install -y --no-install-recommends ca-certificates && \
      bunx sentry-cli sourcemaps inject ./dist && \
      bunx sentry-cli sourcemaps upload --release "$SENTRY_RELEASE" ./dist && \
      find ./dist -name '*.map' -delete; \
    fi


FROM ghcr.io/holi-social/mirror/oven-bun:1 AS runner

WORKDIR /app

ENV NODE_ENV=production

# Manifests, install, then source — same ordering as the builder stage.
COPY package.json bun.lock turbo.json ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/data/package.json ./packages/data/
COPY packages/ui/package.json ./packages/ui/
COPY packages/observability/package.json ./packages/observability/
COPY packages/typescript-config/package.json ./packages/typescript-config/

RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile --production --ignore-scripts

COPY apps/backend ./apps/backend
COPY packages/data ./packages/data
COPY packages/ui ./packages/ui
COPY packages/observability ./packages/observability
COPY packages/typescript-config ./packages/typescript-config
# Compiled @repo/observability output (dist/ is dockerignored — built in the builder stage)
COPY --from=builder /app/packages/observability/dist ./packages/observability/dist

ARG SENTRY_RELEASE
ENV SENTRY_RELEASE=${SENTRY_RELEASE}

WORKDIR /app/apps/backend

# Copy build artifacts from builder stage
COPY --from=builder /app/apps/backend/dist ./dist

EXPOSE 8080

COPY apps/backend/docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

CMD ["./docker-entrypoint.sh"]

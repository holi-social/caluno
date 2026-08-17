FROM ghcr.io/holi-social/mirror/oven-bun:1 AS builder

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

ARG SENTRY_RELEASE
ARG SENTRY_ORG
ARG SENTRY_PROJECT_BACKEND
ENV SENTRY_RELEASE=${SENTRY_RELEASE}
ENV SENTRY_ORG=${SENTRY_ORG}
ENV SENTRY_PROJECT=${SENTRY_PROJECT_BACKEND}

RUN --mount=type=secret,id=sentry_auth_token,env=SENTRY_AUTH_TOKEN \
    bun run build && \
    if [ -n "$SENTRY_RELEASE" ]; then \
      bunx sentry-cli sourcemaps inject ./dist && \
      bunx sentry-cli sourcemaps upload --release "$SENTRY_RELEASE" ./dist && \
      find ./dist -name '*.map' -delete; \
    fi


FROM ghcr.io/holi-social/mirror/oven-bun:1 AS runner

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

COPY apps/backend/docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

CMD ["./docker-entrypoint.sh"]


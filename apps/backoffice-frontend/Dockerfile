FROM oven/bun:1 AS builder

WORKDIR /app

# Install dependencies for the whole monorepo so workspace packages are available
COPY package.json turbo.json ./
COPY apps ./apps
COPY packages ./packages

# Build-time public env for Next.js
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WEB_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_WEB_URL=${NEXT_PUBLIC_WEB_URL}

RUN bun install

# Build the Next.js app
WORKDIR /app/apps/backoffice-frontend
RUN bun run build


FROM oven/bun:1 AS runner

WORKDIR /app

COPY package.json turbo.json ./
COPY apps ./apps
COPY packages ./packages

RUN bun install --production --ignore-scripts

WORKDIR /app/apps/backoffice-frontend

# Copy build artifacts from builder stage
COPY --from=builder /app/apps/backoffice-frontend/.next ./.next

EXPOSE 3000

CMD ["bun", "run", "start"]


FROM oven/bun:1

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

EXPOSE 3000

CMD ["bun", "run", "start"]


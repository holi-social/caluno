# Clippy Monorepo

A Turborepo-based monorepo for the Clippy platform.

## What's inside?

This monorepo includes the following packages/apps:

### Apps and Packages

- `backoffice-frontend`: a [Next.js](https://nextjs.org/) app for the backoffice interface
- `backend`: a [NestJS](https://nestjs.com/) GraphQL API server with PostgreSQL
- `@repo/ui`: a React component library using shadcn/ui
- `@repo/typescript-config`: shared `tsconfig.json` configurations

## Prerequisites

- [Bun](https://bun.sh/) (v1.3.5 or higher)
- [Docker](https://www.docker.com/) and Docker Compose
- [Node.js](https://nodejs.org/) (v18 or higher)

## Getting Started

1. **Clone the repository**
2. **Set up environment variables**

   ```bash
   # Copy root environment file (for Docker)
   cp .env.example .env

   # Copy backend environment file
   cp apps/backend/.env.example apps/backend/.env
   ```

   Update the `.env` files with your configuration. The defaults should work for local development.

3. **Install dependencies**

   ```bash
   bun install
   ```

4. **Start the development environment**

   ```bash
   bun dev
   ```

   This single command will:
   - Start the PostgreSQL database in Docker
   - Wait for the database to be ready
   - Start all applications in parallel (backend and frontend)

   The services will be available at:
   - Backend API: http://localhost:8080
   - Frontend: http://localhost:3000

## Available Scripts

### Development

- `bun dev` - Start all services (database + apps)
- `bun run db:up` - Start the PostgreSQL database
- `bun run db:down` - Stop the PostgreSQL database

### Database Management

The backend uses Drizzle ORM for database management. Run these commands from `apps/backend`:

- `bun run db:generate` - Generate migrations from schema changes
- `bun run db:migrate` - Run pending migrations
- `bun run db:studio` - Open Drizzle Studio (database GUI)

### Building

- `bun run build` - Build all apps and packages
- `bun run check-types` - Type-check all TypeScript code

### Linting & Formatting

- `bun run lint` - Lint all code with Biome
- `bun run format` - Format and fix all code with Biome

### Scaleway deployment

The root `scaleway.sh` script helps you build and push Docker images for:

- `apps/backoffice-frontend` (frontend)
- `apps/backend` (backend)

It uses the Scaleway Container Registry configuration from the root `.env` (or your shell environment):

- `REGISTRY_URL` - Scaleway registry URL (e.g. `rg.nl-ams.scw.cloud`)
- `SCW_CR_NAMESPACE` - Scaleway Container Registry namespace (e.g. `clippy`)
- `IMAGE_TAG` - Image tag to use (e.g. `staging` or a commit SHA)

You must be logged in to the Scaleway registry first:

```bash
docker login "$REGISTRY_URL"
```

Common usage:

```bash
# Build and push both images
./scaleway.sh

# Build images only
./scaleway.sh --build

# Push existing images only
./scaleway.sh --push
```

This script requires Docker with Buildx enabled (see the **Prerequisites** section).

## Project Structure

```
clippy/
├── apps/
│   ├── backoffice-frontend/  # Next.js frontend
│   └── backend/              # NestJS GraphQL API
├── packages/
│   ├── ui/                   # Shared React components
│   └── typescript-config/    # Shared TypeScript configs
├── docker-compose.yml        # PostgreSQL database setup
└── turbo.json               # Turborepo configuration
```

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui
- **Backend**: NestJS, GraphQL, Apollo Server, Drizzle ORM
- **Database**: PostgreSQL 17
- **Tooling**: Turborepo, Bun, Biome, Docker

## Environment Variables

Environment variables are scoped per project:

### Root `.env` (Docker configuration)
- `POSTGRES_USER` - PostgreSQL username (default: postgres)
- `POSTGRES_PASSWORD` - PostgreSQL password (default: postgres)
- `POSTGRES_DB` - PostgreSQL database name (default: clippy)
- `POSTGRES_PORT` - PostgreSQL port (default: 5432)

### `apps/backend/.env` (Backend configuration)
- `PORT` - Backend server port (default: 8080)
- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Secret key for authentication
- `BETTER_AUTH_URL` - Backend URL for auth
- `WEB_URL` - Frontend URL
- `COOKIE_DOMAIN` - (Optional) Root domain for cross-subdomain cookies when frontend and API use different subdomains (e.g. `clippy.holi.social` for `staging.clippy.holi.social` + `api.clippy.holi.social`)

## Troubleshooting

### Database connection issues

If you encounter database connection errors:

1. Ensure Docker is running
2. Check if PostgreSQL is healthy: `docker compose ps`
3. Restart the database: `bun run db:down && bun run db:up`

### Port conflicts

If ports 3000, 8080, or 5432 are already in use:

1. Update the ports in `.env`
2. Update `docker-compose.yml` for PostgreSQL port
3. Restart the services

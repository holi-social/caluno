# Clippy Frontend Web App

The frontend web app for securely managing volunteers and shifts in multi-tiered organisations. Includes the backoffice (`/admin/[orgUId]` routes) — there is no separate backoffice app.

## Commands
- `bun run dev` - Start NextJS development server
- `bun run build` - Build a production bundle
- `bun run lint` - Lint with Biome
- `bun run format` - Format with Biome
- `bun run check-types` - Check for type errors

## Tech Stack
- **Next.js 16** with App Router (React 19)
- **TypeScript** with strict mode
- **Tailwind CSS 4** for styling
- **Biome** for linting and formatting (not ESLint/Prettier)

## Project Structure
```
src/
├── app           # NextJS App Router
├── domain        # React Components, hooks, schemas, server actions organised by domain/feature
├── components    # Shared React components, specific to this app and used across domains
├── hooks         # Shared React hooks, specific to this app and used across domains
└── lib           # Shared generic code
```
Route groups: `(auth)` unauthenticated, `(dashboard)/[orgUId]` protected + org-scoped, `(public)` invites/shifts/forms, `api/` auth routes, `unauthorized/` 403 fallback.

## Server-side auth & org context — use these, never roll your own
- `lib/auth-server.ts`: `getSession()`, `requireAuth(redirectTo?)`, `getCurrentUser()`, `isAuthenticated()` — server components, layouts, and server actions only
- `lib/org-context-server.ts`: `requireOrgAccess(orgUId)`, `getMyAccessibleOrganizationUnits()` (cached), `resolveOrgFromId(orgUId)`
- Data access: `const data = await getDataClient(orgUId)` (`lib/data-client.ts`) — auto-adds the `x-organization-unit-id` header and auth cookies; a 403 throws `ForbiddenDataError` → middleware redirects to `/unauthorized`. This is the org-safety mechanism: never construct GraphQL calls that bypass it.

## Patterns
- Prefer React Server Components and Server Actions when possible.
- For Forms and validation use react-hook-form with zod.
- For Server Actions input use next-safe-action with zod (`actionClient` from `lib/safe-action.ts`).
- Code (components, hooks, actions etc) for a specific domain/feature goes in `src/domain/<domain>/`, not the shared folders.
- Use `@/*` to import from `src/*` (e.g., `@/domain/shift/actions.ts`).
- Server Actions for a domain in `actions.ts`; zod schemas in `schemas.ts` (e.g. `src/domain/shift/schemas.ts`).
- Do not write GraphQL in this project — use `@repo/data` for data access.

## Dates — always
Use `lib/formatting.ts` helpers, never `toLocaleDateString()` directly: `formatDate`, `formatDateTime`, `formatTime` (default `de-DE`). For rendered dates in components use `<FormattedDate date={...} />` (`components/formatted-date.tsx`): renders `de-DE` on the server (SSR-safe) and swaps to `navigator.language` after mount.

## New features
Always study UI/UX patterns in existing similar features before starting a new one — consistent experience across features.
- List pages: follow `src/app/(dashboard)/[orgUId]/shifts/page.tsx`
- Detail pages: follow `src/app/(dashboard)/[orgUId]/shifts/[shiftId]/page.tsx`
- Create/edit pages: use `clippy-sheet`, follow `src/components/sheets/shift-sheet.tsx`

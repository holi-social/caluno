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
- Data access: `const data = await getDataClient(orgUId)` (`lib/data-client.ts`) — auto-adds the `x-organization-unit-id` header and auth cookies; a 403 throws `ForbiddenDataError` → server-side `redirect('/unauthorized')` in `data-client.ts` / server components. This is the org-safety mechanism: never construct GraphQL calls that bypass it.

## Patterns
- Prefer React Server Components and Server Actions when possible.
- For Forms and validation use react-hook-form with zod.
- For Server Actions input use next-safe-action with zod (`actionClient` from `lib/safe-action.ts`).
- Code (components, hooks, actions etc) for a specific domain/feature goes in `src/domain/<domain>/`, not the shared folders.
- Use `@/*` to import from `src/*` (e.g., `@/domain/shift/actions.ts`).
- Server Actions for a domain in `actions.ts`; zod schemas in `schemas.ts` (e.g. `src/domain/shift/schemas.ts`).
- Do not write GraphQL in this project — use `@repo/data` for data access.

## Dates — always use active-locale formatters
- **Client components**: `const { formatDate, formatDateTime, formatTime, formatRange } = useFormatting()` from `@/hooks/use-formatting`.
- **Server components**: `const { formatDate, formatDateTime, formatTime, formatRange } = await getFormatting()` from `@/lib/formatting-server`.
- **Shared options**: `lib/date-time-options.ts` owns the `Intl.DateTimeFormatOptions` objects so client/server/legacy formatters stay consistent.
- **Legacy / explicit-locale cases**: `lib/formatting.ts` still exports sync helpers that accept a `locale` string; default is the source locale `en`. Existing call sites that rely on the default render English dates until they are migrated to the active-locale helpers above.
- **Rendered dates in shared components**: prefer `<FormattedDate date={...} />` from `@/components/formatted-date`.
- Never call `toLocaleDateString()` directly.

## Localisation (i18n) — next-intl
Localised with **next-intl** (App Router/RSC). Supported locales `['en','de']`, default/fallback `en`; routing is **URL-prefixed** (`/[locale]/…`). Config in `src/i18n/`: `routing.ts` (locales), `request.ts` (per-request messages), `navigation.ts` (locale-aware nav). Message catalogs are ICU-syntax JSON at `apps/frontend/messages/{en,de}.json`, nested by domain namespace; read copy via `useTranslations('Namespace')` (client) / `getTranslations('Namespace')` (server).
- **Client-side routing — always use `@/i18n/navigation`, never `next/link` or `next/navigation` directly.** It re-exports locale-aware `Link`, `usePathname`, `useRouter`, `getPathname` from `createNavigation(routing)`; these preserve the active locale prefix automatically. Using the raw Next equivalents drops the locale and breaks prefixed routing.
- **Server-side `redirect`** — import from `@/i18n/navigation` and call it with the locale: `redirect({ href: '/path', locale })`. The locale-aware helper prefixes the path automatically; raw `next/navigation` `redirect` does not.
- **`notFound`, `useSearchParams`, `useParams`** — keep importing from `next/navigation`; they are not locale-dependent.

### Server i18n access
- **RSC pages/layouts**: import `{ setRequestLocale, getTranslations, getFormatter }` from `next-intl/server`. Call `setRequestLocale(locale)` before any other next-intl function to keep static rendering.
- **Server actions**: `getTranslations` can be called directly to localize user-facing messages returned to the client.
- **Metadata**: export `async function generateMetadata({ params })`, await `params`, then call `getTranslations({ locale, namespace })`.

### Strings and translations
All user-facing strings must come from `messages/{en,de}.json` via `useTranslations`
(client) or `getTranslations` (server). Do not hardcode labels, buttons, headings,
error messages, or empty-state text in components. Add new keys to both locales and
keep namespaces/key shapes in sync.

### Locale switching
Use `useLocale`, `usePathname`, and `useRouter` from `@/i18n/navigation`. Call
`router.replace(pathname, { locale })` to switch locale while preserving the current
path. next-intl updates the locale cookie automatically.

## New features
Always study UI/UX patterns in existing similar features before starting a new one — consistent experience across features.
- List pages: follow `src/app/(dashboard)/[orgUId]/shifts/page.tsx`
- Detail pages: follow `src/app/(dashboard)/[orgUId]/shifts/[shiftId]/page.tsx`
- Create/edit pages: use `clippy-sheet`, follow `src/components/sheets/shift-sheet.tsx`

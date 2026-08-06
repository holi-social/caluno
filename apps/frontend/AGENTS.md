# Clippy Frontend Web App

The frontend web app for securely managing volunteers and shifts in multi-tiered organizations. Includes the backoffice (`/admin/[orgUId]` routes) — there is no separate backoffice app.

## Commands
- `bun run dev` - Start NextJS development server
- `bun run build` - Build a production bundle
- `bun run lint` - Lint with Biome
- `bun run format` - Format with Biome
- `bun run check-types` - Check for type errors
- `bun test` - Run tests

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

tests are placed in __tests__ subdirectories
```
Route groups: `(auth)` unauthenticated, `(dashboard)/[orgUId]` protected + org-scoped, `(public)` invites/shifts/forms, `api/` auth routes, `unauthorized/` 403 fallback.

## Server-side auth & org context — use these, never roll your own
- `lib/auth-server.ts`: `getSession()`, `requireAuth(redirectTo?)`, `getCurrentUser()`, `isAuthenticated()` — server components, layouts, and server actions only
- `lib/org-context-server.ts`: `requireOrgAccess(orgUId)`, `getMyAdministrableOrgUnits()` (cached), `getMyAccessibleOrganizationUnits()`, `resolveOrgFromId(orgUId)`
- Data access: `const data = await getDataClient(orgUId)` (`lib/data-client.ts`) — auto-adds the `x-organization-unit-id` header and auth cookies; a 403 throws `ForbiddenDataError` → server-side `redirect('/unauthorized')` in `data-client.ts` / server components. This is the org-safety mechanism: never construct GraphQL calls that bypass it.

## Patterns
- Prefer React Server Components and Server Actions when possible.
- For Forms and validation use react-hook-form with zod.
- For Server Actions input use next-safe-action with zod (`actionClient` from `lib/safe-action.ts`).
- Code (components, hooks, actions etc) for a specific domain/feature goes in `src/domain/<domain>/`, not the shared folders.
- Use `@/*` to import from `src/*` (e.g., `@/domain/shift/actions.ts`).
- Server Actions for a domain in `actions.ts`; zod schemas in `schemas.ts` (e.g. `src/domain/shift/schemas.ts`).
- Do not write GraphQL in this project — use `@repo/data` for data access.
- Sheets use the `@sheet` parallel-route slot (`app/[locale]/admin/[orgUId]/@sheet/**`) with `FormSheet`/`useFormSheet`.
- The requirement-form builder (`domain/requirement-form/components/form-builder.tsx`) is a container composing `form-builder-{empty-state,block-list,add-block-dialog,preview}.tsx`; pure state logic lives in `form-builder-state.ts`. Blocks created through the block sheet (`forForm=true`) come back via the `?addBlock=<id>` search-param handshake and persist only on Save Form.

## Testing — `bun:test` only
- The test runner is **`bun:test`** (`import { describe, it, expect, mock } from 'bun:test'`). **Do NOT add Jest, Vitest, `@testing-library`, jsdom, or happy-dom** — they are intentionally absent. Run with `bun test <path>`.
- **No DOM / no rendered-component tests.** There is no DOM environment. Test logic, not React output: keep components thin and push side-effects into small, injectable helpers you can unit-test directly (see `lib/save-locale-preference.ts`, `lib/locale-seed.ts`, `proxy.ts`'s `localePreferenceRedirect`). Do not render a component and simulate clicks.
- Isolate dependencies with `mock.module('path', () => ({ ... }))`; stub globals (e.g. `document`, `window`) via `Object.defineProperty(globalThis, ...)`.
- Location & naming: co-located `*.spec.ts` next to the unit, or `__tests__/*.test.ts(x)`.
- `bun:test` types come from the local ambient shim `src/bun-test.d.ts` (packages that prefer it use `@types/bun` + `"types": ["...","bun"]` instead — do not mix Jest types in).

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
The `clippy.locale` cookie is the single frontend locale-preference source, and
**for authenticated users the preference always wins over the URL** (a `/de/…`
link is redirected to the user's locale — this is a private dashboard, shareable
per-locale URLs are not a goal). **Logged-out users are exempt**: the proxy only
applies the override when a Better Auth session cookie is present
(`hasSessionCookie` → `getSessionCookie` from `better-auth/cookies`, cookie-only,
no fetch — never use the RSC `getSession` in middleware). So logged-out visitors
switch locale via the URL / browser `Accept-Language`. The cookie is also cleared
on sign-out (`clearLocaleCookie` in the auth client's `signOut`), so an expired
or ended session cannot leave a stale preference. The switcher persists the
choice through `saveLocalePreference()`
(`@/lib/save-locale-preference`): backend via `useUpdateUserLocale()` → cookie
via `setLocaleCookie()` → `router.replace(pathname, { locale })`. Writing the
cookie before navigating means the proxy sees a matching cookie and does not
redirect.

`src/proxy.ts` is the single place that performs locale redirects. It composes a
pure `localePreferenceRedirect()` in front of next-intl via
`withLocalePreference(intlMiddleware)`: when the supported `clippy.locale` cookie
differs from the URL locale it returns a 307 to `/<cookie-locale>/<path>`
(stacked prefixes normalised, so no `/en/en/…` loop); otherwise it falls through
to next-intl, which is load-bearing (prefixes bare paths, Accept-Language
detection for cookieless visitors). next-intl's own cookie sync is disabled
(`localeCookie: false` in `src/i18n/routing.ts`) so it never rewrites the
preference to the last-visited URL. `USER_LOCALE_COOKIE` is a local literal in
`@/lib/locale-constants` (not imported from `@repo/data`) to keep the edge
middleware bundle free of the data barrel.

The preference cookie is seeded from `me.locale` for authenticated users when it
is missing: the authenticated layouts call `resolveLocaleSeed()` server-side
(cookie read + `getMe`) and render the client `<LocaleCookieSeeder>`, which
performs the actual cookie write. Server Component renders may read cookies but
not set them, so seeding must not happen in a layout/page render directly. No
page-level locale redirects.

## New Admin features
Always study UI/UX patterns in existing similar features before starting a new one — consistent experience across features.
- List pages: follow `src/app/[locale]/admin/[orgUId]/timesheets/page.tsx`
- Detail pages: follow `src/app/[locale]/admin/[orgUId]/timesheets/[timeEntryId]/page.tsx`
- Create pages: use `<FormSheet />`, follow `src/app/[locale]/admin/[orgUId]/@sheet/timesheets/new/page.tsx`
- Edit pages: use `<FormSheet />`, follow `src/app/[locale]/admin/[orgUId]/@sheet/timesheets/[timeEntryId]/edit/page.tsx`

# Account Settings sub-page — Design (VOLI-954)

**Jira:** [VOLI-954](https://holi.atlassian.net/browse/VOLI-954) — "[S1] Account settings — language" (Sub-task, sibling under VOLI-593, part of the VOLI-942 Profile overview breakdown)
**Date:** 2026-08-05
**Status:** Approved → ready for implementation plan

## Summary

Move the Account Settings (the language edit form, currently rendered inline at the bottom of `/profile` under the "Edit Profile" heading) into its own sub-page at `/profile/account-settings`. Replace it on the profile overview with a **read-only** Account section that shows the current language value and an **Edit** button that opens the sub-page.

## Sources of truth

- **Design:** `volunteer-profile-memberships.pen`, screen **S1 — Profile overview**, the "Account Section" frame at the bottom (section divider + header row with "Account settings" title and a bordered "✎ Edit" button + a read-only Language field: Title "Language" / subtitle "App display language" / value e.g. "English").
- **Edit-page pattern (not in pen):** follows the existing `/profile/avatar/edit` sub-page (sticky header + inline Save) — the lightest of the viable patterns and consistent with the only existing profile edit sub-page.

## Scope (from the ticket)

- **In scope:** Language is editable in its own Account section and is no longer mixed with the memberships area.
- **Out of scope:** Any account settings beyond language. The full design-system `EditableField` component family (View/Locked/Edit/Error/WithSubtitle) belongs to the sibling Identity ticket.

## Approach

**Minimal / YAGNI (chosen).** Move the existing `ProfileForm` (language `Select` + inline `Save`) verbatim into the new sub-page, and build a small self-contained read-only `AccountSection` for the overview. No new shared abstraction is introduced; the read-only field is structured so it can be promoted into a shared component when the Identity ticket lands.

Rejected alternatives:
- **Shared read-only `ProfileField` now** — mild scope creep; the Identity ticket may want a different shape (with an Edit variant).
- **Full design-system `EditableField` family** — significant scope creep; the Edit variant's form wiring belongs to another ticket.

## Routes

| Route | Component | Status |
| --- | --- | --- |
| `/profile` | overview (server) | modified — Account section becomes read-only |
| `/profile/account-settings` | edit sub-page (server) | **new** |
| `/profile/avatar/edit` | avatar edit (server) | unchanged (reference pattern) |

Both sub-pages live under the `(volunteering)` route group, so they inherit the shared `VolunteerNav` bottom tab and `DataProvider`.

## Component changes

### 1. `AccountSection` (new) — read-only section on the overview
File: `apps/frontend/src/domain/user/components/account-section.tsx`

- Async **server** component (no `'use client'`). Prop: `{ locale: string }`.
- Resolves its own strings via `getTranslations('Profile')` and `getTranslations('Common')`.
- Renders, matching S1:
  - **Section divider** — top border (or `Separator`).
  - **Header row** (`flex items-center justify-between`):
    - Title: `Profile.accountSettings` ("Account settings"), styled to match the other overview section headings.
    - Edit button: `<Button variant="outline" size="sm" asChild>` wrapping a locale-aware `<Link href="/profile/account-settings">` from `@/i18n/navigation`, containing a `Pencil` (lucide) icon + label `Common.edit` ("Edit").
  - **Read-only Language field:**
    - Title `Profile.language` ("Language") — muted, ~14px / weight 600.
    - Subtitle `Profile.languageDescription` ("App display language") — muted, ~12px.
    - Value: the current language label (e.g. "English"), ~16px.
- Omits the disabled pencil icon shown in the pen file — the section-header Edit button is the single affordance (cleaner; consistent with the "reuse form pattern" choice).

### 2. `/profile/account-settings` (new) — edit sub-page
File: `apps/frontend/src/app/[locale]/(volunteering)/profile/account-settings/page.tsx`

- **Server** component, mirroring `profile/avatar/edit/page.tsx`.
- `resolveLocale(rawLocale)` + `setRequestLocale(locale)`.
- `const tProfile = await getTranslations('Profile')`.
- Renders:
  - `<div className="sticky top-0 z-30"><ProfilePageHeader title={tProfile('accountSettings')} /></div>`
  - `<div className="mx-auto w-full max-w-4xl space-y-8 px-4 py-6"><ProfileForm /></div>`

### 3. `ProfilePageHeader` — optional `title` prop
File: `apps/frontend/src/domain/user/components/profile-page-header.tsx`

- Add optional `title?: string`; when omitted, fall back to the existing `Profile.pageTitle` ("Profile").
- The avatar-edit page calls it with no arg → no behavioural change.
- The new sub-page passes `title="Account settings"`.

### 4. `ProfileForm` — unchanged
File: `apps/frontend/src/domain/user/components/profile-form.tsx`

- No code change. It is simply imported by the new sub-page instead of the overview.
- Behaviour preserved: `useLocale()` for current locale, `useUpdateUserLocale()` mutation, `saveLocalePreference` updates user record + cookie + URL; Save reloads the current sub-page route in the new locale; the header Back button (`router.back()`) returns to `/profile`.

### 5. Overview page `/profile`
File: `apps/frontend/src/app/[locale]/(volunteering)/profile/page.tsx`

- **Remove** the empty `<section>` rendering `tProfile('accountSettings')` as a heading.
- **Remove** the "Edit Profile" block (`<h2>{tProfile('title')}</h2>` + `<ProfileForm />`).
- **Add** `<AccountSection locale={me.locale} />` in their place (`me` is already fetched via `data.user.getMe()`).
- Leave the empty "Personal information" section untouched (sibling Identity ticket).

## Internationalization

Add to the `Profile` namespace in `apps/frontend/messages/en.json` and `de.json`:

| Key | en | de |
| --- | --- | --- |
| `language` | Language | Sprache |
| `languageDescription` | App display language | Anzeigesprache der App |

Reused (already present): `Profile.accountSettings` ("Account settings" — section title and sub-page header), `Common.edit` ("Edit" — button label).

`Profile.title` ("Edit Profile") becomes unused after the overview change; it is left in the message files to avoid churn (optional cleanup later).

## Locale → label mapping

The read-only value and the existing form both need locale → display label (en→English, de→Deutsch). Today this map is a local `const` inside `profile-form.tsx`. To prevent divergence, **centralize** it (e.g. a small shared `localeLabel(locale)` helper or a `LOCALES` constant imported by both `AccountSection` and `ProfileForm`). The exact location is pinned down in the implementation plan.

## Data flow & edge cases

- Overview: `data.user.getMe()` → `me.locale` → passed to `<AccountSection locale={me.locale} />`, which renders the label.
- **Null/undefined `me.locale`:** fall back to the resolved URL locale (`locale` already computed in the page via `resolveLocale`).
- Sub-page: no server data fetch needed — `ProfileForm` reads the current locale client-side via `useLocale()`.
- Save flow unchanged; after save the user remains on `/profile/account-settings` (in the new locale) and uses Back to return to the overview.

## Accessibility & conventions

- All navigation uses `<Link>` from `@/i18n/navigation` (never raw `<a>`), per project convention.
- Presentational/read-only components stay server components; only `ProfileForm` (state/effects/handlers) remains a client component.
- Prefer `type` aliases, ESM function syntax, and correct types over `as` casts, per project conventions.

## Files touched

1. `apps/frontend/src/app/[locale]/(volunteering)/profile/page.tsx` — swap empty section + form for `<AccountSection>`.
2. `apps/frontend/src/app/[locale]/(volunteering)/profile/account-settings/page.tsx` — **new** sub-page.
3. `apps/frontend/src/domain/user/components/account-section.tsx` — **new** read-only section.
4. `apps/frontend/src/domain/user/components/profile-page-header.tsx` — optional `title` prop.
5. `apps/frontend/messages/en.json`, `apps/frontend/messages/de.json` — 2 new `Profile` keys each.
6. (Shared) locale-label helper extraction — touched as part of centralization.

## Verification

- `./node_modules/.bin/tsc --noEmit -p apps/frontend/tsconfig.json` passes.
- `./node_modules/.bin/biome check .` passes (`--write` to fix).
- Manual: overview shows read-only Language value + Edit button; Edit navigates to `/profile/account-settings`; changing language and saving updates the value and keeps the user on the sub-page; Back returns to the overview showing the updated value.

## Acceptance criteria mapping

- **"Language is editable in its own Account section and is no longer mixed with memberships."** — Language editing lives only at `/profile/account-settings`; the overview's Account section is read-only and visually separated from the Memberships section by the section divider. ✅

# Profile Overview — S1 Shell (VOLI-951)

- **Ticket:** [VOLI-951](https://holi.atlassian.net/browse/VOLI-951) — "[S1] Profile shell - Avatar + name"
- **Status:** In Progress (Sub-task)
- **Design reference:** `.ai/design/design_files/volunteer-profile-memberships.pen`, frame **"S1 — Profile overview"** (`3kytgo`). The design's top header and bottom nav are intentionally **not** followed (see "Design deviations" below).
- **Date:** 2026-07-29

## Summary

Build the shared **three-layer shell** for the volunteer `/profile` page that the rest of the Profile Overview mounts into. This task delivers the page chrome (a `my-shifts`-style detail header), the **profile header block** (avatar + name + a non-functional edit affordance), and three **empty section slots** (organizations, personal information, account settings). The slot contents land in later tickets; this shell must land first.

The existing `ProfileForm` and `MyMembershipRequests` remain on the page (transitional) so editing and membership requests keep working until the later tickets rebuild them inside their sections.

## Context & locked decisions

The volunteering app's chrome is split across two layouts:

- `(volunteering)/layout.tsx` — wraps **every** volunteering route. Provides `DataProvider`, `requireAuth`, locale seeding, `<main className="grow pb-24">`, and the bottom `<VolunteerNav />`.
- `(volunteering)/(root)/layout.tsx` — wraps only the "root/home" family. Renders the **greeting header** (`HomeHeader` — "Hi, {name}" + avatar) and the `max-w-4xl px-6 pt-36 pb-4` content wrapper.

Sibling detail pages — `my-shifts`, `discover`, `invitations` — sit **directly under `(volunteering)`**, outside `(root)`. They therefore keep the bottom nav but do **not** get the greeting header; instead each renders its own `DetailPageHeader` (back arrow + title). `my-shifts` is the reference pattern.

Locked decisions:

| Area | Decision |
|---|---|
| Top header | `DetailPageHeader` with back arrow + title **"Profile"**, matching `my-shifts`. **Not** the design's `HomeHeader/OnProfile`, **not** the existing greeting header. |
| Bottom nav | **Kept.** Profile behaves like `my-shifts` (nav present). |
| Greeting header | **Removed for profile** by moving the route out of the `(root)` group. |
| Profile header block | Avatar (photo or initials) + name + an "Edit profile" affordance that renders but takes no action (wiring deferred to VOLI-943). |
| Section slots | Three empty placeholders rendered in order: "Your organizations", "Personal information", "Account settings". |
| Existing content | `ProfileForm` + `MyMembershipRequests` kept temporarily, below the slots. |

## Design deviations (intentional)

Per the product owner's direction, the S1 design file is **not** followed for:

1. **Top header.** The design shows `HomeHeader/OnProfile` (back button + org cobranding logo, hidden greeting). We instead use the simpler `my-shifts` detail header (back arrow + "Profile" title, no cobranding).
2. **Greeting header.** The existing `(root)` greeting header ("Hi, {name}") is **not** shown on profile.
3. **Bottom nav.** The design implies a specific tab bar; we keep the existing `VolunteerNav` (it already wraps all volunteering routes).

The avatar+name block, the edit affordance, and the three section titles follow the design's intent (validated against the ticket's acceptance criteria).

## Scope

### In scope

1. Move the `/profile` route from `(volunteering)/(root)/profile` to `(volunteering)/profile` so it loses the greeting header while keeping the bottom nav (URL `/profile` unchanged).
2. Page chrome: a sticky detail header (back arrow + "Profile" title) using the existing `DetailPageHeader`, in the same composition as `my-shifts`.
3. Profile header block: avatar (image with initials fallback) + name + a non-functional "Edit profile" pencil affordance.
4. Three empty section slots, rendered in order with titles.
5. Retain the existing `ProfileForm` and `MyMembershipRequests` (transitional), below the slots.
6. Translations for the new section titles, header title, and edit label.

### Out of scope (later tickets)

- Section contents: organizations list, personal-information fields, account settings.
- Edit wiring (avatar upload / edit flows) → VOLI-943.
- Removing the transitional `ProfileForm` / `MyMembershipRequests` (done when sections land).
- Any change to the bottom nav, the greeting header on other pages, or other volunteering routes.

## Architecture

### Route change

```
Before:  apps/frontend/src/app/[locale]/(volunteering)/(root)/profile/page.tsx
After:   apps/frontend/src/app/[locale]/(volunteering)/profile/page.tsx
```

Moving the directory up one level places profile as a sibling of `my-shifts`. Route groups `(root)` / `(volunteering)` do not affect the URL, so `/profile` is unchanged. The page now inherits only `(volunteering)/layout.tsx` (provider, auth, locale, nav, `pb-24`) — no greeting header.

### Page composition

`page.tsx` stays a **server component** (per the repo's RSC-first preference). It performs the same data fetching the current page does, then renders:

```
<div>
  <div className="sticky top-0 z-30 bg-muted">        // sticky header chrome (same as my-shifts)
    <div className="mx-auto w-full max-w-4xl">
      <ProfileDetailHeader />                          // client — owns router.back + back label
    </div>
  </div>

  <div className="mx-auto w-full max-w-4xl px-6 py-6 space-y-8">
    <ProfileHeaderBlock name={me.name} imageUrl={me.image} />   // avatar + name + edit affordance

    {/* Section slots — empty; headings inlined (later tickets add bodies) */}
    <section><h2 className="text-xl font-bold">{tProfile('organizations')}</h2></section>
    <section><h2 className="text-xl font-bold">{tProfile('personalInformation')}</h2></section>
    <section><h2 className="text-xl font-bold">{tProfile('accountSettings')}</h2></section>

    {/* transitional — kept working until sections land */}
    <MyMembershipRequests membershipRequests={membershipRequests} />
    <ProfileForm imageUrl={me.image} />
  </div>
</div>
```

The page preserves the current behavior exactly for the transitional blocks: `setRequestLocale(locale)`, `resolveLocale(rawLocale)`, `getDataClient()`, `me = data.user.getMe()`, `membershipRequest.findMine()`, and the existing translations (`MembershipRequest`, `Profile`).

## Components

### New

1. **`ProfileDetailHeader`** (`apps/frontend/src/components/...` or co-located) — a small **client** component.
   - Renders `DetailPageHeader` with `title={tProfile('pageTitle')}` (new `Profile.pageTitle` key), `onBack={router.back}`, and `backLabel={tCommon('back')}` (existing `Common.back`, same as `my-shifts`). Uses `useTranslations('Profile')` and `useTranslations('Common')`.
   - `className="bg-transparent px-6"` to match `my-shifts`.
   - Uses `useRouter` from `@/i18n/navigation` and `useTranslations('Common')`.
   - No `logoUrl` passed → `DetailPageHeader` hides the cobranding lockup (intended).

2. **`ProfileHeaderBlock`** — a presentational **server** component (no interactivity needed yet).
   - Props: `name: string`, `imageUrl: string | null`.
   - Renders the existing `Avatar` (`packages/ui`) with `<AvatarImage src={imageUrl} />` and `<AvatarFallback>` showing initials derived from `name` (two-word, first-letter — same helper logic used in `UserCard`).
   - Renders the name as a heading.
   - Renders an "Edit profile" pencil affordance: an icon button (e.g. `Button` `variant="outline"` `size="icon-sm"` with a `pencil` lucide icon) placed at the avatar's bottom-right corner to match the design. **No `onClick` / no wired action** — it is present-but-inert (wiring → VOLI-943). Mark with `aria-disabled`, a `title` attribute, and an `aria-label` so its disabled state is unambiguous. Using a native `title` (not an interactive tooltip) keeps the block server-renderable.

> The three empty section slots are **not** a component — their headings are inlined in `page.tsx` (small repeated `<h2>` blocks). Later tickets add the bodies in place.

### Reused (no changes)

- `DetailPageHeader` (`packages/ui/src/components/detail-page-header.tsx`).
- `Avatar` / `AvatarImage` / `AvatarFallback` (`packages/ui/src/components/base/avatar.tsx`).
- `Button` (`packages/ui`), `lucide` icons (`pencil`).
- `ProfileForm` (`@/domain/user/components/profile-form`), `MyMembershipRequests` (`@/domain/membership-requests/components/my-membership-requests`).
- `getDataClient`, `requireAuth`, `@/i18n/navigation` (`useRouter`), `@/i18n/routing` (`resolveLocale`).

## Data

No new queries. Server-side data via the existing `DataClient`:

- `data.user.getMe()` → `{ name, image, ... }` (already used; query `GetMe`).
- `data.membershipRequest.findMine()` → membership requests (for the transitional block).

The avatar uses `me.image` (falls back to initials when null/empty) and `me.name`.

## Internationalization

`next-intl`. Extend the existing **`Profile`** namespace in `apps/frontend/messages/en.json` (and other locale files following repo conventions) with:

- `Profile.pageTitle` — the detail header title ("Profile"). New key to avoid colliding with the existing `Profile.title` ("Edit Profile"), which the transitional `ProfileForm` heading still uses.
- `Profile.organizations` — "Your organizations".
- `Profile.personalInformation` — "Personal information".
- `Profile.accountSettings` — "Account settings".
- `Profile.edit` — accessible label for the edit affordance ("Edit profile").

The back-button label reuses the existing `Common.back` (used by `my-shifts`). The transitional blocks keep their current `MembershipRequest` and `Profile` translation keys.

## Styling / responsiveness

- Content column: `max-w-4xl mx-auto px-6`, consistent with `my-shifts` and the rest of the volunteering app (responsive, not locked to the design's 390px mobile frame).
- Sticky header: `sticky top-0 z-30 bg-muted` wrapping a `max-w-4xl` inner container, identical to `my-shifts`.
- Section spacing: `space-y-8` between the header block and slots; slot internals follow the established section pattern.
- Bottom nav space reserved by the inherited `pb-24` on `(volunteering)/layout.tsx`'s `<main>`.

## Acceptance criteria

Mirroring VOLI-951:

1. Given a volunteer opens `/profile`, the S1 shell renders in order: detail header → profile header block → (empty) slots for organizations, identity, account → transitional existing content.
2. The page shows the `my-shifts`-style detail header: back arrow + "Profile" title. No greeting "Hi, {name}" header.
3. The bottom nav is present (consistent with other volunteering pages).
4. The profile header block shows the avatar (photo, or initials when no photo) and the volunteer's name.
5. The "Edit profile" affordance is present but non-functional.
6. The three section slots are present and empty.
7. `ProfileForm` and `MyMembershipRequests` still render and function (transitional).
8. The URL remains `/profile` (locale-prefixed as usual).

## Edge cases

- **No photo:** avatar shows initials derived from `name`.
- **Empty/whitespace name:** initials fallback degrades gracefully (e.g. `?`), matching `UserCard`'s existing fallback.
- **Locale:** the moved page still calls `setRequestLocale(locale)` so localized strings render server-side.
- **Edit affordance:** inert — must not throw, must not navigate, must communicate its disabled state accessibly.

## Testing

- **Type checks:** `bun run check-types` passes (new components typed; no `as` casts).
- **Lint/format:** `bun run lint` and `bun run format` pass.
- **Manual:** open `/profile` as a logged-in volunteer — verify header, avatar+name, three empty slots, transitional form/requests, bottom nav, back button returns to the previous screen.
- **Manual (no photo):** confirm initials fallback renders.
- **i18n:** confirm section titles and header title render from the `Profile`/`Common` namespaces.

(No unit-test framework changes are required for the shell; the new components are thin presentational/client wrappers over existing tested primitives. Add tests if the repo's convention requires coverage for new presentational components.)

## Transitional state & follow-ups

- The old `ProfileForm` + `MyMembershipRequests` render below the slots. When the section tickets land, their functionality moves into the matching slots and these transitional blocks are deleted.
- Edit affordance wiring → VOLI-943.
- The `(root)` directory under `(volunteering)` retains the home page and its greeting header; this ticket does not touch it.

## Decisions & assumptions

1. **Edit affordance shape** — pencil-on-avatar, per the design (approved). Switchable to a text button in `ProfileHeaderBlock` later with no other changes.
2. **Transitional placement** — old content renders *below* the slots (approved), not nested under matching slot titles.
3. **Header title key** — new `Profile.pageTitle` key for "Profile" (avoids collision with existing `Profile.title` = "Edit Profile").

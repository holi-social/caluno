# Profile Overview — S1 Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the volunteer `/profile` page shell — a `my-shifts`-style detail header, an avatar+name block with an inert edit affordance, three empty section slots, and transitional retention of the existing `ProfileForm` + `MyMembershipRequests`.

**Architecture:** Move the `/profile` route out of the `(root)` group up to `(volunteering)/profile` so it keeps the bottom nav (from `(volunteering)/layout.tsx`) but drops the greeting header (only in `(root)/layout.tsx`) — exactly like `my-shifts`. The page is a server component; a small client `ProfileDetailHeader` owns `router.back`; a server `ProfileHeaderBlock` renders the avatar/name/edit affordance. A shared, tested `getInitials` helper backs the initials fallback.

**Tech Stack:** Next.js App Router, React Server Components, `next-intl`, Tailwind, `@repo/ui` (shadcn-based), Biome (format/lint), `tsc --noEmit` (types), `bun:test` (pure-logic specs only).

**Spec:** `docs/superpowers/specs/2026-07-29-profile-overview-shell-design.md` (VOLI-951).

## Global Constraints

(These apply to every task. Copied from the spec + repo conventions.)

- Package manager is **`bun`** — never npm/yarn.
- **Prefer RSC.** Only add `'use client'` when a component needs client-only features (router, state, effects, handlers). Presentational/read-only components stay server components.
- **Function style:** prefer `const X = () => {}` (arrow) for components/helpers, **except** `page.tsx`/`layout.tsx` which use `export default function`.
- Prefer **`type`** over `interface`.
- Use `<Link />` from Next.js / `@/i18n/navigation` for in-app links — never raw `<a />`.
- **Avoid `as` casts** — prefer correct types, inference, or annotation.
- Translations: `next-intl`. Add new keys to **both** `apps/frontend/messages/en.json` and `apps/frontend/messages/de.json`.
- **Verification gates** for every code task: `bun run check-types` (from repo root) and `bun run lint` (from repo root) must pass. Pure-logic helpers additionally get a `.spec.ts` run with `bun test`. There is **no React component test framework** in this repo, so components are verified by type-check + lint + manual run.
- Biome owns formatting; if a lint step complains only about style, run `bun run format` (root) to auto-fix, then re-run `bun run lint`.
- Every commit message ends with the trailer:
  ```
  Co-Authored-By: Claude <noreply@anthropic.com>
  ```
- Work happens on the existing branch `feat/voli-951-profile-shell` (already created and checked out).

---

## File Structure

**Create:**
- `apps/frontend/src/lib/get-initials.ts` — pure helper: `name → initials` (string). Reusable; tested.
- `apps/frontend/src/lib/get-initials.spec.ts` — `bun:test` unit tests for the helper.
- `apps/frontend/src/components/profile/profile-detail-header.tsx` — client component; renders `DetailPageHeader` with `title="Profile"`, `onBack=router.back`.
- `apps/frontend/src/components/profile/profile-header-block.tsx` — async server component; avatar (image | initials) + name + inert edit affordance.
- `apps/frontend/src/app/[locale]/(volunteering)/profile/page.tsx` — the page (new location after the route move).

**Modify:**
- `apps/frontend/messages/en.json` — extend `Profile` namespace.
- `apps/frontend/messages/de.json` — extend `Profile` namespace.

**Delete:**
- `apps/frontend/src/app/[locale]/(volunteering)/(root)/profile/page.tsx` (and its now-empty `profile/` directory) — superseded by the moved route.

**Untouched (do not commit):** `.ai`, `AGENTS.md`, `.claude/settings.json`, `.claude/___settings.json`, `mise.toml` — these are pre-existing uncommitted changes unrelated to this ticket. Only stage files you create/modify for the task.

---

## Task 1: `getInitials` helper (TDD)

**Files:**
- Create: `apps/frontend/src/lib/get-initials.ts`
- Test: `apps/frontend/src/lib/get-initials.spec.ts`

**Interfaces:**
- Produces: `getInitials(name?: string): string` — `?` for missing name, otherwise up to 2 uppercase first-letters from the first two words.

- [ ] **Step 1: Write the failing test**

Create `apps/frontend/src/lib/get-initials.spec.ts`:

```ts
import { describe, expect, it } from 'bun:test';
import { getInitials } from './get-initials';

describe('getInitials', () => {
  it('returns ? for a missing name', () => {
    expect(getInitials(undefined)).toBe('?');
    expect(getInitials('')).toBe('?');
  });

  it('takes the first letter of the first two words', () => {
    expect(getInitials('Alexandra Bauer')).toBe('AB');
    expect(getInitials('John Ronald Tolkien')).toBe('JR');
  });

  it('returns a single initial for a single word', () => {
    expect(getInitials('Alexandra')).toBe('A');
  });

  it('uppercases lowercase input', () => {
    expect(getInitials('a b')).toBe('AB');
  });

  it('ignores leading, trailing, and duplicate spaces', () => {
    expect(getInitials('  Alexandra   Bauer ')).toBe('AB');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun test apps/frontend/src/lib/get-initials.spec.ts`
Expected: FAIL — `Cannot find module './get-initials'` (or `getInitials is not defined`).

- [ ] **Step 3: Write the implementation**

Create `apps/frontend/src/lib/get-initials.ts` (identical logic to the inline helper in `apps/frontend/src/components/user-card.tsx`):

```ts
export const getInitials = (name?: string): string => {
  if (!name) return '?';

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('');
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bun test apps/frontend/src/lib/get-initials.spec.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Type-check + lint**

Run: `bun run check-types && bun run lint`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add apps/frontend/src/lib/get-initials.ts apps/frontend/src/lib/get-initials.spec.ts
git commit -m "feat(profile): add getInitials helper with tests"
```

(Append the `Co-Authored-By` trailer from Global Constraints.)

---

## Task 2: Translation keys

**Files:**
- Modify: `apps/frontend/messages/en.json` (`Profile` namespace)
- Modify: `apps/frontend/messages/de.json` (`Profile` namespace)

**Interfaces:**
- Produces keys consumed by later tasks: `Profile.pageTitle`, `Profile.organizations`, `Profile.personalInformation`, `Profile.accountSettings`, `Profile.edit`. Reuses existing `Common.back`, `Common.avatarAlt`, `Profile.title`.

**Context:** `Profile.title` already exists (`"Edit Profile"` / `"Profil bearbeiten"`) and stays — the transitional `ProfileForm` heading uses it. We add the new keys alongside it. Do **not** rename or remove `Profile.title`.

- [ ] **Step 1: Add keys to `en.json`**

In `apps/frontend/messages/en.json`, replace the `Profile` object:

```json
"Profile": {
  "title": "Edit Profile",
  "pageTitle": "Profile",
  "organizations": "Your organizations",
  "personalInformation": "Personal information",
  "accountSettings": "Account settings",
  "edit": "Edit profile",
  "pictureLabel": "Profile picture",
  "saved": "Profile updated",
  "saveFailed": "Failed to update profile"
},
```

- [ ] **Step 2: Add keys to `de.json`**

In `apps/frontend/messages/de.json`, replace the `Profile` object:

```json
"Profile": {
  "title": "Profil bearbeiten",
  "pageTitle": "Profil",
  "organizations": "Deine Organisationen",
  "personalInformation": "Persönliche Informationen",
  "accountSettings": "Kontoeinstellungen",
  "edit": "Profil bearbeiten",
  "pictureLabel": "Profilbild",
  "saved": "Profil aktualisiert",
  "saveFailed": "Profil konnte nicht aktualisiert werden"
},
```

- [ ] **Step 3: Validate JSON**

Run: `jq -e '.Profile.pageTitle' apps/frontend/messages/en.json && jq -e '.Profile.pageTitle' apps/frontend/messages/de.json`
Expected: prints `"Profile"` then `"Profil"`, exit 0 (valid JSON, keys present).

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/messages/en.json apps/frontend/messages/de.json
git commit -m "feat(profile): add S1 shell translation keys"
```

(Append the `Co-Authored-By` trailer.)

---

## Task 3: `ProfileDetailHeader` (client)

**Files:**
- Create: `apps/frontend/src/components/profile/profile-detail-header.tsx`

**Interfaces:**
- Consumes: `DetailPageHeader` from `@repo/ui` (props: `title`, `onBack`, `backLabel`, `className`); `useRouter` from `@/i18n/navigation`; `useTranslations` from `next-intl`; keys `Profile.pageTitle`, `Common.back`.
- Produces: `ProfileDetailHeader` (no props) — rendered by the page in Task 5.

**Why client:** `router.back` requires the client router. The page stays a server component; only this thin wrapper is client.

- [ ] **Step 1: Create the component**

Create `apps/frontend/src/components/profile/profile-detail-header.tsx`:

```tsx
'use client';

import { DetailPageHeader } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';

export const ProfileDetailHeader = () => {
  const tProfile = useTranslations('Profile');
  const tCommon = useTranslations('Common');
  const router = useRouter();

  return (
    <DetailPageHeader
      className="bg-transparent px-6"
      title={tProfile('pageTitle')}
      onBack={router.back}
      backLabel={tCommon('back')}
    />
  );
};
```

- [ ] **Step 2: Type-check + lint**

Run: `bun run check-types && bun run lint`
Expected: no errors. (If lint flags import order or formatting only, run `bun run format` then re-run `bun run lint`.)

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/components/profile/profile-detail-header.tsx
git commit -m "feat(profile): add ProfileDetailHeader client component"
```

(Append the `Co-Authored-By` trailer.)

---

## Task 4: `ProfileHeaderBlock` (server)

**Files:**
- Create: `apps/frontend/src/components/profile/profile-header-block.tsx`

**Interfaces:**
- Consumes: `Avatar`, `AvatarImage`, `AvatarFallback`, `Button` from `@repo/ui`; `Pencil` from `lucide-react`; `getTranslations` from `next-intl/server`; `getInitials` from `@/lib/get-initials` (Task 1); keys `Common.avatarAlt`, `Profile.edit`.
- Produces: `ProfileHeaderBlock` — props `{ name: string; imageUrl?: string | null }`. Rendered by the page in Task 5.

**Notes:**
- Async server component (`getTranslations` is async). Rendering client children (`Avatar`, `Button`) from a server component is fine in the App Router.
- Avatar is sized to 80px via Tailwind `size-20` (the `size="lg"` prop caps at 40px; the class overrides it). Fallback text enlarged to `text-2xl`.
- The edit affordance is **present but inert** (no `onClick`); `aria-disabled` + `title` + `aria-label` communicate that. Wiring is deferred to VOLI-943.

- [ ] **Step 1: Create the component**

Create `apps/frontend/src/components/profile/profile-header-block.tsx`:

```tsx
import { Avatar, AvatarFallback, AvatarImage, Button } from '@repo/ui';
import { Pencil } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { getInitials } from '@/lib/get-initials';

type ProfileHeaderBlockProps = {
  name: string;
  imageUrl?: string | null;
};

export const ProfileHeaderBlock = async ({
  name,
  imageUrl,
}: ProfileHeaderBlockProps) => {
  const tCommon = await getTranslations('Common');
  const tProfile = await getTranslations('Profile');

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative size-20">
        <Avatar size="lg" className="size-20">
          <AvatarImage src={imageUrl ?? ''} alt={tCommon('avatarAlt', { name })} />
          <AvatarFallback className="text-2xl">{getInitials(name)}</AvatarFallback>
        </Avatar>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-disabled
          aria-label={tProfile('edit')}
          title={tProfile('edit')}
          className="absolute -bottom-1 -right-1 rounded-full bg-background"
        >
          <Pencil className="size-4" />
        </Button>
      </div>
      <h1 className="text-center text-xl font-bold">{name}</h1>
    </div>
  );
};
```

- [ ] **Step 2: Type-check + lint**

Run: `bun run check-types && bun run lint`
Expected: no errors. (Format-fix with `bun run format` if needed.)

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/components/profile/profile-header-block.tsx
git commit -m "feat(profile): add ProfileHeaderBlock with avatar, name, inert edit affordance"
```

(Append the `Co-Authored-By` trailer.)

---

## Task 5: Move the route + rewrite the page

**Files:**
- Delete: `apps/frontend/src/app/[locale]/(volunteering)/(root)/profile/page.tsx`
- Create: `apps/frontend/src/app/[locale]/(volunteering)/profile/page.tsx`

**Interfaces:**
- Consumes: `ProfileDetailHeader` (Task 3), `ProfileHeaderBlock` (Task 4), `ProfileForm` (`@/domain/user/components/profile-form`), `MyMembershipRequests` (`@/domain/membership-requests/components/my-membership-requests`), `getDataClient` (`@/lib/data-client`), `resolveLocale` (`@/i18n/routing`); keys `Profile.*`, `MembershipRequest.page.*`.
- Produces: the `/profile` route (URL unchanged; now under `(volunteering)` directly, not `(root)`).

**Why the move:** Sibling pages `my-shifts`, `discover`, `invitations` sit directly under `(volunteering)`. They keep the bottom nav (from `(volunteering)/layout.tsx`) but do **not** get the greeting header (only `(root)/layout.tsx` renders it). Moving `profile` up one level makes it behave identically. Route groups `(root)`/`(volunteering)` don't affect the URL, so `/profile` is unchanged.

**Data:** identical to the current page — `getDataClient().user.getMe()` (`{ name, image, ... }`) and `membershipRequest.findMine()`. Auth is enforced by `(volunteering)/layout.tsx`'s `requireAuth()`, so no explicit `requireAuth` call is needed in the page (parity with the original profile page).

- [ ] **Step 1: Delete the old page**

```bash
git rm "apps/frontend/src/app/[locale]/(volunteering)/(root)/profile/page.tsx"
```

If the `(root)/profile/` directory is now empty, remove it:

```bash
rmdir "apps/frontend/src/app/[locale]/(volunteering)/(root)/profile" 2>/dev/null || true
```

- [ ] **Step 2: Create the new page**

Create `apps/frontend/src/app/[locale]/(volunteering)/profile/page.tsx`:

```tsx
import { getTranslations, setRequestLocale } from 'next-intl/server';
import MyMembershipRequests from '@/domain/membership-requests/components/my-membership-requests';
import { ProfileForm } from '@/domain/user/components/profile-form';
import { resolveLocale } from '@/i18n/routing';
import { getDataClient } from '@/lib/data-client';
import { ProfileDetailHeader } from '@/components/profile/profile-detail-header';
import { ProfileHeaderBlock } from '@/components/profile/profile-header-block';

interface ProfilePageProps {
  params: Promise<{ locale: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);

  const tProfile = await getTranslations('Profile');
  const tMemberships = await getTranslations('MembershipRequest');

  const data = await getDataClient();
  const me = await data.user.getMe();
  const { items: membershipRequests } = await data.membershipRequest.findMine();

  return (
    <div>
      <div className="bg-muted sticky top-0 z-30">
        <div className="mx-auto w-full max-w-4xl">
          <ProfileDetailHeader />
        </div>
      </div>

      <div className="mx-auto w-full max-w-4xl space-y-8 px-6 py-6">
        <ProfileHeaderBlock name={me.name} imageUrl={me.image} />

        {/* Section slots — empty; headings inlined (later tickets add bodies) */}
        <section>
          <h2 className="text-xl font-bold">{tProfile('organizations')}</h2>
        </section>
        <section>
          <h2 className="text-xl font-bold">{tProfile('personalInformation')}</h2>
        </section>
        <section>
          <h2 className="text-xl font-bold">{tProfile('accountSettings')}</h2>
        </section>

        {/* Transitional — kept working until the section tickets land */}
        <div>
          <h2 id="memberships" className="text-xl font-bold">
            {tMemberships('page.title')}
          </h2>
          <p className="text-muted-foreground mt-1">
            {tMemberships('page.subtitle')}
          </p>
          <MyMembershipRequests membershipRequests={membershipRequests} />
        </div>

        <div>
          <h2 className="text-xl font-bold">{tProfile('title')}</h2>
          <div className="mt-4">
            <ProfileForm imageUrl={me.image} />
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Type-check + lint**

Run: `bun run check-types && bun run lint`
Expected: no errors. (Format-fix with `bun run format` if needed.)

- [ ] **Step 4: Confirm no stale route remains**

Run: `find "apps/frontend/src/app/[locale]/(volunteering)/(root)/profile" -type f 2>/dev/null`
Expected: no output (the old route is gone — no duplicate `/profile`).

- [ ] **Step 5: Commit**

```bash
git add "apps/frontend/src/app/[locale]/(volunteering)/profile/page.tsx"
git commit -m "feat(profile): mount S1 shell at /profile (route moved out of (root))"
```

(Stage the deletion from Step 1 too if not already staged. Append the `Co-Authored-By` trailer.)

---

## Task 6: Final verification

**Files:** none (verification only).

- [ ] **Step 1: Full type-check + lint**

Run: `bun run check-types && bun run lint`
Expected: clean.

- [ ] **Step 2: Run the unit tests**

Run: `bun test apps/frontend/src/lib/get-initials.spec.ts`
Expected: PASS.

- [ ] **Step 3: Run the dev server**

Run: `bun run dev` (starts backend + frontend). Open the app at `/<locale>/profile` as a logged-in volunteer.

Verify against the acceptance criteria:
1. Shell renders in order: detail header → profile header block → three empty section slots → transitional memberships + form.
2. Detail header shows back arrow + "Profile" title. **No** greeting "Hi, {name}" header.
3. Bottom nav is present (consistent with `my-shifts`).
4. Avatar shows the photo, or initials when no photo.
5. "Edit profile" affordance is present but does nothing on click.
6. The three section slots are present and empty.
7. `ProfileForm` and `MyMembershipRequests` render and still function.
8. URL is `/profile`.

- [ ] **Step 4: Edge cases**

- Log in as a volunteer with **no photo** → confirm initials render.
- Click the back arrow → confirm it returns to the previous screen.
- Toggle the app locale (if a switcher is available) → confirm section titles and header title localize.

- [ ] **Step 5: No-commit check**

If Steps 1–4 required no code changes, there is nothing to commit. If `bun run format` changed files, commit them:

```bash
git add -A
git commit -m "style(profile): apply biome formatting"
```

(Append the `Co-Authored-By` trailer. Use `git status` first to ensure only this ticket's files are staged — never stage `.ai`, `AGENTS.md`, `.claude/*`, `mise.toml`.)

---

## Out of scope (explicitly do NOT do)

- Implement section contents (organizations, personal information, account settings).
- Wire the edit affordance (avatar upload / edit flows) → VOLI-943.
- Remove the transitional `ProfileForm` / `MyMembershipRequests` (later tickets).
- Refactor the three existing inline `getInitials` copies (`user-card.tsx`, `volunteering-volunteer-row.tsx`, the orgs page) — noted as future cleanup, not part of this ticket.
- Change the bottom nav, the greeting header on other pages, or any other volunteering route.

---

## Self-Review

**1. Spec coverage** — checked each spec section:
- Route move out of `(root)` → Task 5. ✓
- `DetailPageHeader` back arrow + "Profile" → Tasks 2 (`pageTitle`), 3, 5. ✓
- Bottom nav kept (no greeting header) → Task 5 (move) + explained. ✓
- Avatar (image | initials) + name → Tasks 1, 4. ✓
- Inert edit affordance → Task 4 + keys Task 2. ✓
- Three empty section slots → Task 5 (inlined `<section><h2>`). ✓
- Transitional `ProfileForm` + `MyMembershipRequests` → Task 5. ✓
- i18n (en + de) → Task 2. ✓
- Acceptance criteria (1–8) → Task 6 maps to them. ✓

**2. Placeholder scan** — no TBD/TODO/"add error handling". All steps contain real code or real commands.

**3. Type consistency** — `getInitials(name?: string): string` (Task 1) matches its use in Task 4 (`getInitials(name)` where `name: string`). `ProfileHeaderBlock({ name: string; imageUrl?: string | null })` matches the page call `name={me.name} imageUrl={me.image}` (Task 5). `ProfileDetailHeader()` takes no props and is used as `<ProfileDetailHeader />`. Translation keys (`pageTitle`, `organizations`, `personalInformation`, `accountSettings`, `edit`, `back`, `avatarAlt`) are consistent across Tasks 2–5.

No issues found.

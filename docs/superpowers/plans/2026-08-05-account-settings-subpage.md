# Account Settings sub-page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the language edit form out of the `/profile` overview into its own `/profile/account-settings` sub-page, and replace it on the overview with a read-only Account section (current language value + an Edit button that opens the sub-page).

**Architecture:** Minimal change. A shared pure helper (`localeLabel`) supplies the display label to both the existing `ProfileForm` and a new read-only `AccountSection` server component. A new sub-page route reuses the existing `ProfileForm` verbatim, wrapped in the same sticky-header chrome as the neighbouring `/profile/avatar/edit` page. The overview swaps its empty Account-settings heading + inline form for the read-only section.

**Tech Stack:** Next.js App Router (React Server Components), next-intl, Tailwind, `@repo/ui` (shadcn), Bun test runner, Biome, TypeScript.

**Spec:** `docs/superpowers/specs/2026-08-05-account-settings-subpage-design.md`
**Jira:** VOLI-954

## Global Constraints

Copied from the spec + project conventions. Every task's requirements implicitly include these.

- **Navigation:** always use `<Link>` from `@/i18n/navigation` (next-intl, locale-aware). Never raw `<a>`.
- **Function style:** prefer ESM arrow functions (`const X = () => {}`). Exception: `page.tsx`/`layout.tsx` may use `export default async function` (matches neighbouring pages).
- **Types:** prefer `type` over `interface`. Avoid `as` casts.
- **Components:** prefer React Server Components. Only add `'use client'` when a component needs state/effects/handlers. `AccountSection` and both `page.tsx` files are server components; `ProfilePageHeader` and `ProfileForm` stay client.
- **i18n:** UI strings live in `apps/frontend/messages/{en,de}.json`. Read server-side with `getTranslations` (next-intl/server), client-side with `useTranslations`.
- **Verification commands (bun scripts are broken in this env — run binaries directly from the worktree root):**
  - Type-check: `./node_modules/.bin/tsc --noEmit -p apps/frontend/tsconfig.json`
  - Lint/format: `./node_modules/.bin/biome check .` (append `--write` to autofix)
  - Unit test (Task 1 only): `cd apps/frontend && bun test src/i18n/locales.spec.ts` — **must run from `apps/frontend`** so Bun does not pick up the repo-root `bunfig.toml` preload (which tries to migrate the backend test DB).
- **node_modules is gitignored** and absent from this worktree; it is symlinked to the main repo's (`node_modules` and `apps/frontend/node_modules`). Never commit `node_modules` or the symlinks — they are gitignored.
- **Pre-commit hook:** the `.ai/scripts/` secrets-scan scripts have been copied into the worktree (`.ai` is a submodule not checked out in worktrees), so the gitleaks pre-commit hook runs on commit.
- **Commit messages:** end every commit message with a blank line then `Co-Authored-By: Claude <noreply@anthropic.com>`. Commit only the files each task lists.
- The feature must keep working at every commit (see task ordering: sub-page is added before the overview stops rendering the inline form).

---

## File Structure

| File | Status | Responsibility |
| --- | --- | --- |
| `apps/frontend/src/i18n/locales.ts` | **new** | `LOCALES` const + pure `localeLabel(locale)` helper. Single source of truth for locale → display label. |
| `apps/frontend/src/i18n/locales.spec.ts` | **new** | Unit test for `localeLabel` / `LOCALES`. |
| `apps/frontend/src/domain/user/components/profile-form.tsx` | modify | Drop its local `locales` const; import shared `LOCALES`/`localeLabel`. Behavior unchanged. |
| `apps/frontend/src/domain/user/components/profile-page-header.tsx` | modify | Accept optional `title?: string` (defaults to existing `Profile.pageTitle`). |
| `apps/frontend/src/app/[locale]/(volunteering)/profile/account-settings/page.tsx` | **new** | Edit sub-page: sticky header ("Account settings") + `ProfileForm`. |
| `apps/frontend/src/domain/user/components/account-section.tsx` | **new** | Read-only server component: divider + header (title + Edit button) + read-only Language field. |
| `apps/frontend/src/app/[locale]/(volunteering)/profile/page.tsx` | modify | Render `<AccountSection>`; remove empty Account-settings `<section>` and the inline "Edit Profile"/`<ProfileForm>` block. |
| `apps/frontend/messages/en.json`, `de.json` | modify | Add `Profile.language` + `Profile.languageDescription`. |

---

## Task 1: Shared locale-label helper (+ test, + reuse in ProfileForm)

**Files:**
- Create: `apps/frontend/src/i18n/locales.ts`
- Create: `apps/frontend/src/i18n/locales.spec.ts`
- Modify: `apps/frontend/src/domain/user/components/profile-form.tsx`

**Interfaces:**
- Consumes: `Locale` from `@repo/data` (already exported; defined in `packages/data/src/constants.ts`).
- Produces:
  - `LOCALES`: `readonly [{ key: 'en'; label: 'English' }, { key: 'de'; label: 'Deutsch' }]`
  - `localeLabel(locale: Locale | string): string` — returns the label for a supported locale, else the input string unchanged.

- [ ] **Step 1: Write the failing test**

Create `apps/frontend/src/i18n/locales.spec.ts`:

```ts
import { describe, expect, it } from 'bun:test';
import { LOCALES, localeLabel } from './locales';

describe('LOCALES', () => {
  it('covers the supported app locales in order', () => {
    expect(LOCALES.map((entry) => entry.key)).toEqual(['en', 'de']);
  });
});

describe('localeLabel', () => {
  it('returns the display label for a supported locale', () => {
    expect(localeLabel('en')).toBe('English');
    expect(localeLabel('de')).toBe('Deutsch');
  });

  it('passes unknown locale codes through unchanged', () => {
    expect(localeLabel('fr')).toBe('fr');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run (from worktree root): `cd apps/frontend && bun test src/i18n/locales.spec.ts`
Expected: FAIL — `Cannot find module './locales'` (file does not exist yet).

- [ ] **Step 3: Implement the helper**

Create `apps/frontend/src/i18n/locales.ts`:

```ts
import type { Locale } from '@repo/data';

export const LOCALES = [
  { key: 'en', label: 'English' },
  { key: 'de', label: 'Deutsch' },
] as const satisfies ReadonlyArray<{ key: Locale; label: string }>;

export const localeLabel = (locale: Locale | string): string =>
  LOCALES.find((entry) => entry.key === locale)?.label ?? locale;
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd apps/frontend && bun test src/i18n/locales.spec.ts`
Expected: PASS — 3 tests pass.

- [ ] **Step 5: Reuse the helper in `ProfileForm`**

In `apps/frontend/src/domain/user/components/profile-form.tsx`, make these edits (exact strings from the current file):

Edit A — add the import (place before the `@/i18n/navigation` import; Biome will finalise order):
```
old: import { usePathname, useRouter } from '@/i18n/navigation';
new: import { LOCALES, localeLabel } from '@/i18n/locales';
     import { usePathname, useRouter } from '@/i18n/navigation';
```

Edit B — delete the local `locales` const and point `isLocale` at `LOCALES`:
```
old:
const locales = [
  { key: 'en', label: 'English' },
  { key: 'de', label: 'Deutsch' },
] as const;

function isLocale(value: string): value is Locale {
  return locales.some(({ key }) => key === value);
}
new:
function isLocale(value: string): value is Locale {
  return LOCALES.some(({ key }) => key === value);
}
```

Edit C — simplify `selectedLabel`:
```
old:
  const selectedLabel =
    locales.find(({ key }) => key === selectedLocale)?.label ?? selectedLocale;
new:
  const selectedLabel = localeLabel(selectedLocale);
```

Edit D — update the options map:
```
old:             {locales.map(({ key, label }) => (
new:             {LOCALES.map(({ key, label }) => (
```

Leave the existing `import type { Locale } from '@repo/data';` (still used by `isLocale` and `useState<Locale>`).

- [ ] **Step 6: Type-check and lint**

Run from worktree root:
```
./node_modules/.bin/biome check . --write
./node_modules/.bin/tsc --noEmit -p apps/frontend/tsconfig.json
```
Expected: Biome reports no errors after autofix; tsc exits 0 (no type errors).

- [ ] **Step 7: Commit**

```
git add apps/frontend/src/i18n/locales.ts apps/frontend/src/i18n/locales.spec.ts apps/frontend/src/domain/user/components/profile-form.tsx
git commit -m "feat(profile): shared locale-label helper (VOLI-954)

Extract locale -> display label into a tested helper and reuse it in
ProfileForm so the read-only view and the form cannot diverge.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: Account settings edit sub-page

**Files:**
- Modify: `apps/frontend/src/domain/user/components/profile-page-header.tsx`
- Create: `apps/frontend/src/app/[locale]/(volunteering)/profile/account-settings/page.tsx`

**Interfaces:**
- Consumes: `ProfileForm` (existing, unchanged), `resolveLocale` from `@/i18n/routing`.
- Produces: route `/profile/account-settings`; `ProfilePageHeader` now accepts optional `title?: string` (defaults to `Profile.pageTitle` = "Profile"). Existing callers (avatar edit page) pass nothing → unchanged.

- [ ] **Step 1: Add an optional `title` prop to `ProfilePageHeader`**

Replace the entire contents of `apps/frontend/src/domain/user/components/profile-page-header.tsx` with:

```tsx
'use client';

import { DetailPageHeader } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';

type ProfilePageHeaderProps = {
  title?: string;
};

export const ProfilePageHeader = ({ title }: ProfilePageHeaderProps) => {
  const tProfile = useTranslations('Profile');
  const tCommon = useTranslations('Common');
  const router = useRouter();

  return (
    <DetailPageHeader
      title={title ?? tProfile('pageTitle')}
      onBack={router.back}
      backLabel={tCommon('back')}
    />
  );
};
```

- [ ] **Step 2: Create the sub-page**

Create `apps/frontend/src/app/[locale]/(volunteering)/profile/account-settings/page.tsx` (mirrors `profile/avatar/edit/page.tsx`):

```tsx
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ProfileForm } from '@/domain/user/components/profile-form';
import { ProfilePageHeader } from '@/domain/user/components/profile-page-header';
import { resolveLocale } from '@/i18n/routing';

type AccountSettingsPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AccountSettingsPage({ params }: AccountSettingsPageProps) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);

  const tProfile = await getTranslations('Profile');

  return (
    <div>
      <div className="sticky top-0 z-30">
        <ProfilePageHeader title={tProfile('accountSettings')} />
      </div>

      <div className="mx-auto w-full max-w-4xl space-y-8 px-4 py-6">
        <ProfileForm />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Type-check and lint**

Run from worktree root:
```
./node_modules/.bin/biome check . --write
./node_modules/.bin/tsc --noEmit -p apps/frontend/tsconfig.json
```
Expected: Biome clean after autofix; tsc exits 0.

- [ ] **Step 4: Manual smoke check (if a dev server is available)**

With the app running, open `/<locale>/profile/account-settings` directly. Confirm: the sticky header reads "Account settings" with a working back button; the language `Select` + Save render and behave as before. (The sub-page is reachable by direct URL now; the Edit-button link is wired in Task 3.) If no dev server is available in this environment, rely on the type-check + lint gates and verify end-to-end in Task 3.

- [ ] **Step 5: Commit**

```
git add apps/frontend/src/domain/user/components/profile-page-header.tsx apps/frontend/src/app/[locale]/(volunteering)/profile/account-settings/page.tsx
git commit -m "feat(profile): account settings edit sub-page (VOLI-954)

Add /profile/account-settings rendering the existing ProfileForm under
a sticky header titled 'Account settings'. ProfilePageHeader gains an
optional title prop.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: Read-only Account section on the overview

**Files:**
- Modify: `apps/frontend/messages/en.json`
- Modify: `apps/frontend/messages/de.json`
- Create: `apps/frontend/src/domain/user/components/account-section.tsx`
- Modify: `apps/frontend/src/app/[locale]/(volunteering)/profile/page.tsx`

**Interfaces:**
- Consumes: `localeLabel` from `@/i18n/locales` (Task 1); `Profile.language` / `Profile.languageDescription` / `Profile.accountSettings` / `Common.edit` from the message files.
- Produces: the read-only overview Account section with an Edit button linking to `/profile/account-settings`. Feature complete.

- [ ] **Step 1: Add the i18n keys**

In `apps/frontend/messages/en.json`, insert two keys after `accountSettings`:
```
old:   "accountSettings": "Account settings",
new:   "accountSettings": "Account settings",
       "language": "Language",
       "languageDescription": "App display language",
```

In `apps/frontend/messages/de.json`, insert the German equivalents after `accountSettings`:
```
old:   "accountSettings": "Kontoeinstellungen",
new:   "accountSettings": "Kontoeinstellungen",
       "language": "Sprache",
       "languageDescription": "Anzeigesprache der App",
```

- [ ] **Step 2: Create the read-only `AccountSection`**

Create `apps/frontend/src/domain/user/components/account-section.tsx`:

```tsx
import { Pencil } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Button } from '@repo/ui';
import { Link } from '@/i18n/navigation';
import { localeLabel } from '@/i18n/locales';

type AccountSectionProps = {
  locale: string;
};

export const AccountSection = async ({ locale }: AccountSectionProps) => {
  const tProfile = await getTranslations('Profile');
  const tCommon = await getTranslations('Common');

  return (
    <section className="space-y-4 border-t border-border pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{tProfile('accountSettings')}</h2>
        <Button asChild variant="outline" size="sm">
          <Link href="/profile/account-settings">
            <Pencil className="size-4" />
            {tCommon('edit')}
          </Link>
        </Button>
      </div>

      <div className="space-y-0.5">
        <p className="text-sm font-semibold text-muted-foreground">
          {tProfile('language')}
        </p>
        <p className="text-xs text-muted-foreground">
          {tProfile('languageDescription')}
        </p>
        <p className="mt-1 text-base text-foreground">{localeLabel(locale)}</p>
      </div>
    </section>
  );
};
```

Notes for the implementer: `getTranslations` works in this nested async server component because the page calls `setRequestLocale(locale)` before rendering it. `Button asChild` + locale-aware `Link` mirrors the existing `avatar-edit-form.tsx` pattern. `size="sm"` and `variant="outline"` are both valid on the `@repo/ui` Button.

- [ ] **Step 3: Wire it into the overview page**

In `apps/frontend/src/app/[locale]/(volunteering)/profile/page.tsx`:

Edit P1 — swap the import (drop `ProfileForm`, add `AccountSection`):
```
old: import { ProfileForm } from '@/domain/user/components/profile-form';
     import { ProfilePageHeader } from '@/domain/user/components/profile-page-header';
new: import { AccountSection } from '@/domain/user/components/account-section';
     import { ProfilePageHeader } from '@/domain/user/components/profile-page-header';
```

Edit P2 — replace the empty Account-settings section AND remove the inline "Edit Profile" form block, substituting the read-only section:
```
old:
        <section>
          <h2 className="text-xl font-bold">{tProfile('accountSettings')}</h2>
        </section>

        <div>
          <h2 className="text-xl font-bold">{tProfile('title')}</h2>
          <div className="mt-4">
            <ProfileForm />
          </div>
        </div>
new:
        <AccountSection locale={me.locale ?? locale} />
```

Leave the "Personal information" `<section>` above untouched (sibling Identity ticket). `me` (from `data.user.getMe()`) and `locale` (from `resolveLocale`) are already in scope in this file. `me.locale ?? locale` yields a `string` (falls back to the resolved URL locale when the saved preference is null).

- [ ] **Step 4: Type-check and lint**

Run from worktree root:
```
./node_modules/.bin/biome check . --write
./node_modules/.bin/tsc --noEmit -p apps/frontend/tsconfig.json
```
Expected: Biome clean after autofix; tsc exits 0. If tsc reports an unused `Profile.title` translation reference, ignore it — the key stays in the file by design; only code references were removed.

- [ ] **Step 5: End-to-end manual check (if a dev server is available)**

With the app running:
1. Open `/<locale>/profile`. Confirm: the Account section shows a "Language" read-only value (e.g. "English"/"Deutsch"), an "App display language" subtitle, and an Edit button. The memberships and personal-information sections are unchanged.
2. Click Edit → lands on `/<locale>/profile/account-settings`.
3. Change language and Save → the page reloads in the new locale; toast "Profile updated".
4. Back → returns to the overview, which now shows the updated language value.

- [ ] **Step 6: Commit**

```
git add apps/frontend/messages/en.json apps/frontend/messages/de.json apps/frontend/src/domain/user/components/account-section.tsx apps/frontend/src/app/[locale]/(volunteering)/profile/page.tsx
git commit -m "feat(profile): read-only account section on overview (VOLI-954)

Replace the inline Edit Profile form on /profile with a read-only
Account section (current language + Edit button) that links to the
/account-settings sub-page.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Verification (whole feature)

After Task 3:
- `./node_modules/.bin/tsc --noEmit -p apps/frontend/tsconfig.json` → exit 0.
- `./node_modules/.bin/biome check .` → clean.
- `cd apps/frontend && bun test src/i18n/locales.spec.ts` → pass.
- Manual flow above works end-to-end.

## Acceptance criteria mapping (from VOLI-954)

- **"Language is editable in its own Account section and is no longer mixed with memberships."** Language editing lives only at `/profile/account-settings` (Tasks 2 + 3). The overview's Account section is read-only and visually separated from Memberships by the section divider (Task 3). ✅
- **"Out of scope: other account settings beyond language."** No other settings are added. ✅

## Notes / out of scope

- The full design-system `EditableField` component family (pen `EditableField/View|Edit|…`) is deliberately not built — it belongs to the sibling Identity ticket. The read-only field here is a small inline block that can be promoted later.
- `Profile.title` ("Edit Profile") becomes unreferenced after Task 3; it is intentionally left in the message files (no churn).

# VOLI-953 — Personal Information: Core identity & contact (read-only)

- **Date:** 2026-08-04
- **Status:** Approved (design)
- **Ticket:** [VOLI-953](https://holi.atlassian.net/browse/VOLI-953) — "[S1] Personal information — Core identity & contact (read-only)"
- **Epic / parent:** VOLI-942 (Profile overview); sibling under VOLI-593
- **Design file:** `.ai/design/design_files/volunteer-profile-memberships.pen` → frame `S1 — Profile overview` → `Identity Section`
- **Related:** VOLI-943 (edit mode — out of scope here), VOLI-592 (requirement-profile infrastructure, reused)

## 1. Overview

Render the signed-in volunteer's core identity & contact information as a read-only list of field rows in the **Personal Information** section of the self-service profile page. This is the volunteer's own view of their profile (`/[locale]/profile`).

The section matches the `Identity Section` in the design file: a vertical stack of labeled field rows (label + optional subtitle + value), grouped under the existing "Personal information" heading.

## 2. Scope

**In scope**

- Render 11 core identity & contact fields from the user's profile and account.
- Read-only display — no edit affordance (edit is VOLI-943).
- Add `iban` as a system profile key so IBAN is stored/returned through the existing requirement-profile infrastructure like the other fields.
- Field-level formatting (date for DOB, `mailto`/`tel` links for email/phone) and i18n labels/subtitles.
- Empty-value handling.

**Out of scope**

- Edit mode (VOLI-943) — including the section-header "Edit" button shown in the design.
- The existing `ProfileForm` component lower on the page (untouched).
- The admin/backoffice volunteer view (`/admin/[orgUId]/volunteers`).
- Removing `'email'` from `SYSTEM_PROFILE_KEYS` (see §9 follow-ups).

## 3. Context

### Data model

- **User account** (`user.getMe()` → `User`): includes `id`, `name`, `email`, `image`, `checkInId`, `locale`, `permissions`. `email` is the canonical account email.
- **User profile** (`data.requirementForm.getMyUserProfile()` → `UserProfile | null`): `{ id, userId, data, createdAt, updatedAt }`. `data` is a JSON blob keyed by profile field keys.
- **System profile keys** are defined in `apps/backend/src/requirement-profile/constants.ts` (`SYSTEM_PROFILE_KEYS`). Today: `name`, `lastname`, `preferred-name`, `gender`, `email`, `phone`, `address`, `zip`, `city`, `birth-date`. The VOLI-592 infrastructure persists requirement-form field values into `profile.data[<systemKey>]`.
- `FieldType.IBAN` already exists (`apps/backend/src/requirement-profile/enums/index.ts`), but `iban` is **not** a system key today.

### Page

`apps/frontend/src/app/[locale]/(volunteering)/profile/page.tsx` is a React Server Component. It already prefetches via `getDataClient()` in a `Promise.all` (`data.user.getMe()`, `data.membershipRequest.findMine()`, `data.membership.findMine()`). It contains an empty `<section>` with the `personalInformation` heading where this work lands. Labels are produced with `getTranslations('Profile')`.

### Design reference

The `Identity Section` in the design lists, top to bottom: Preferred name, First name, Last name, Gender, Email, Phone number, Date of birth, Address, Postcode, City, IBAN. Each row uses the `EditableField/View` component (label group with optional subtitle, plus a value). The design's section header includes an "Edit" button — **omitted here** (read-only).

## 4. Decisions (from brainstorming)

1. **IBAN** — add `iban` as a system profile key (backend change). Frontend reads it uniformly from `profile.data['iban']`, identical to the other system-keyed fields.
2. **Subtitles** — render only the meaningful subtitles from the design; omit the copy-paste placeholders that don't make sense:
   - Keep: Preferred name → "If different from your legal name"; First name → "As on your ID"; Last name → "As on your ID"; IBAN → "For expense reimbursements".
   - Omit subtitle for: Gender, Email, Phone number, Date of birth, Address, Postcode, City.
3. **Empty values** — render a faint dash placeholder `—` as the value when a field has no data.
4. **Email source** — email comes **exclusively from the account** (`me.email`). It is **not** read from `profile.data`. (The presence of `'email'` in `SYSTEM_PROFILE_KEYS` is treated as a pre-existing mistake — see §9.)
5. **Edit button** — omitted entirely (read-only per ticket; edit mode is VOLI-943).
6. **Email/phone** — render as `mailto:` / `tel:` links respectively (standard read-only contact UX, not an edit affordance).
7. **Approach** — Server Component prefetching in the page (option A). No new client hook for this ticket.

## 5. Design

### 5.1 Backend

**File:** `apps/backend/src/requirement-profile/constants.ts`

Add `'iban'` to `SYSTEM_PROFILE_KEYS`:

```ts
export const SYSTEM_PROFILE_KEYS = new Set<string>([
  'name',
  'lastname',
  'preferred-name',
  'gender',
  'email',
  'phone',
  'address',
  'zip',
  'city',
  'birth-date',
  'iban', // <-- new
]);
```

Because `FieldType.IBAN` already exists and profile data is stored as JSONB in `user_profiles.data`, no database migration is required. A requirement-form block of type IBAN can now map its `systemKey` to `iban`, and the value is persisted/read through the existing VOLI-592 flow like every other system key.

No other backend changes (resolvers, services, mappers) are needed: `myUserProfile` already returns the whole `data` blob.

### 5.2 Data layer (`packages/data`)

None. `data.requirementForm.getMyUserProfile()` already exists and returns `{ data }`. No codegen change.

### 5.3 Page

**File:** `apps/frontend/src/app/[locale]/(volunteering)/profile/page.tsx`

- Add `data.requirementForm.getMyUserProfile()` to the existing `Promise.all`.
- Inside the existing `<section>` for `personalInformation` (after the `<h2>`), render `<PersonalInformationSection me={me} profile={profile} />`.

```tsx
const [me, requestPage, memberships, profile] = await Promise.all([
  data.user.getMe(),
  data.membershipRequest.findMine(),
  data.membership.findMine(),
  data.requirementForm.getMyUserProfile(),
]);
```

### 5.4 Components

New files in `apps/frontend/src/domain/user/components/` (alongside `profile-form.tsx`, `header-avatar.tsx`):

**`profile-field.tsx`** — presentational row, server-component friendly (no client features). Designed to extend into VOLI-943 edit mode later.

```ts
type ProfileFieldProps = {
  label: string;
  subtitle?: string;
  value: string | null;
  // render the value as a link (mailto/tel) or formatted text
  kind?: 'text' | 'email' | 'tel' | 'date';
  rawDate?: string; // ISO date for kind === 'date'
};
```

Renders: a label group (title + optional subtitle) and a value. When `value` is null/empty and there's no date, render a muted `—`.

**`personal-information-section.tsx`** — server component. Owns the field configuration (order, label i18n key, optional subtitle i18n key, system key / source, `kind`) and maps it to `<ProfileField>` rows using `profile.data` and `me.email`.

```ts
type PersonalInformationSectionProps = {
  me: { email: string };
  profile: { data: Record<string, unknown> } | null;
};
```

Field reading helper:

```ts
const read = (data: Record<string, unknown>, key: string): string | null => {
  const v = data[key];
  return typeof v === 'string' && v.trim() !== '' ? v : null;
};
```

### 5.5 Field set & sources

| # | Field | Source | Key | `kind` | Subtitle |
|---|---|---|---|---|---|
| 1 | Preferred name | profile.data | `preferred-name` | text | If different from your legal name |
| 2 | First name | profile.data | `name` | text | As on your ID |
| 3 | Last name | profile.data | `lastname` | text | As on your ID |
| 4 | Gender | profile.data | `gender` | text | — |
| 5 | Email | **account** | — (`me.email`) | email | — |
| 6 | Phone number | profile.data | `phone` | tel | — |
| 7 | Date of birth | profile.data | `birth-date` | date | — |
| 8 | Address | profile.data | `address` | text | — |
| 9 | Postcode | profile.data | `zip` | text | — |
| 10 | City | profile.data | `city` | text | — |
| 11 | IBAN | profile.data | `iban` | text | For expense reimbursements |

Notes:
- **Gender** is displayed as the stored string value. If the requirement-profile stores a coded value needing label resolution, that resolution is deferred (display raw value for this ticket).
- **Date of birth** is formatted as a localized date via next-intl (server formatter), falling back to `—` when absent/invalid.
- **Email** is always present from the account; it still renders through the same row component with `kind: 'email'`.

### 5.6 i18n

Add keys under the `Profile` namespace in the locale message files (locate during planning — expected under the frontend i18n messages, e.g. `Profile.personalInfo.fields.*` and `Profile.personalInfo.subtitles.*`). Keys needed:

- Labels: preferredName, firstName, lastName, gender, email, phoneNumber, dateOfBirth, address, postcode, city, iban.
- Subtitles: preferredName ("If different from your legal name"), firstName / lastName ("As on your ID"), iban ("For expense reimbursements").

The dash placeholder `—` is a literal, not translated.

### 5.7 Styling

Match the design's `EditableField/View` look: each row is a vertical stack — a label group (title, with optional subtitle beneath it) on top, then the value below. Use existing design tokens (`text-muted-foreground` for subtitles and the empty `—` placeholder, `break-all` for long values like address/IBAN). Reuse the visual language of the existing `InfoRow` in `volunteer-sheet.tsx` but richer (supports a subtitle and the empty placeholder). Do not wrap each row in its own card.

## 6. Acceptance criteria

- The Personal Information section renders all 11 fields in the order above.
- Field values come from the correct sources: 10 from `profile.data` by system key, email from `me.email`.
- Read-only: no edit affordance (no Edit button) is present.
- Subtitles appear only on Preferred name, First name, Last name, and IBAN (with the agreed copy); other fields show label + value only.
- Fields with no value render a faint `—`.
- DOB renders as a localized date; email renders as a `mailto:` link; phone as a `tel:` link.
- `iban` is a valid system profile key (a requirement-form block of type IBAN can map `systemKey: 'iban'`).
- Labels/subtitles are translated.
- No type errors (`tsc --noEmit`) and lint passes (`biome check`).

## 7. Testing notes

- Manual: visit `/[locale]/profile` as a volunteer with a populated profile → all fields show values; as a volunteer with an empty profile → empty fields show `—`, email still shows the account email.
- Verify DOB locale formatting and that email/phone are clickable links.
- Backend: confirm `'iban'` is accepted as a `systemKey` on a requirement-form block (no `BadRequestException`).

## 8. Risks / assumptions

- **Email in SYSTEM_PROFILE_KEYS:** email is still a system key in the backend. This ticket does not change that; it only sources the *displayed* email from the account. Cleanup is a follow-up (§9).
- **Gender value shape:** assumed to be a displayable string; coded-value resolution is deferred.
- **Component placement:** the new section renders inside the existing `personalInformation` `<section>`; the page's `<h2>` heading is reused (component renders rows only).

## 9. Follow-ups (out of scope)

- VOLI-943: edit mode for identity & contact (adds the section-header Edit button and inline editing; likely converts `ProfileField` to support an edit state and adds a `useMyUserProfile` client hook + mutation/refetch).
- Remove `'email'` from `SYSTEM_PROFILE_KEYS` and migrate/clean any `profile.data.email` so the account email is the single source of truth (separate backend ticket).

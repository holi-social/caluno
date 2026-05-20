# Form Builder — Integration Plan

> **Audience:** mixed engineering + PM. Each chunk has a *What this delivers* line (PM-readable) and *Implementation details* (eng-readable). Read top-to-bottom in order — chunks are intentionally sequenced so each can ship and be value-tested on its own.

## 0. Context: how the real product differs from the prototype

The form-builder prototype was built as a self-contained sandbox to validate UX. The real product ([`apps/backend`](apps/backend) and [`apps/frontend`](apps/frontend)) has a different shape on every axis except the UI primitives — the integration is essentially **keep the UI, replace the spine**.

| Layer | Prototype | Real product |
|---|---|---|
| Persistence | JSON files in `data/` | Postgres via Drizzle ORM (`apps/backend/src/database/schema.ts`) |
| Server API | Next.js REST routes (`app/api/**`) | NestJS GraphQL (`@nestjs/graphql`, code-first) |
| Frontend mutations | `fetch()` from components | Server actions via `next-safe-action` (`apps/frontend/src/lib/safe-action.ts`) |
| Data fetching | Inline `fetch('/api/...')` | `getDataClient(orgUId)` → typed GraphQL repos in `packages/data/src/repositories/**` |
| Forms in admin UI | Raw `useState` + `fetch` | `react-hook-form` + `zodResolver` + `<EntityForm>` / `<FormContent>` split |
| Confirm dialogs | `Dialog` (prototype shortcut) | `AlertDialog` with destructive action |
| Auth | Cookie + hardcoded `USERS` | Better Auth session, real users table, permission keys |
| Authorization | `canEditX(user)` inline checks | `@Permissions(...)` on resolvers + `<RequirePermission>` on UI |
| Org model | Single string `organizationName` | `organizations` → `organization_units` (tree, `parentId`), units are the real "sub-org" |
| File uploads | Local `data/uploads/` dir | TBD — storage strategy is open (see §10) |

What carries over verbatim: the **data shapes**, the **builder UX**, the **volunteer-side 3-state UX**, the **System Requirement registry**, the **validation rules**. Everything else is rebuilt against the platform's conventions.

## 1. Phasing overview

Each phase is independently shippable and value-testable. Numbering is a *dependency order*, not a sprint count.

| # | Chunk | Shippable outcome |
|---|---|---|
| 1 | Data model & permissions foundation | DB tables + migration; no UI yet |
| 2 | Block library | Admin can create/edit/list/delete blocks |
| 3 | Form management | Admin can create forms and attach blocks to them |
| 4 | System Requirements + Volunteer Profile | Profile entries persist; registry callable from backend |
| 5 | File uploads (documents) | Document-acknowledgement field works end-to-end |
| 6 | Volunteer-facing form rendering | A standalone form URL renders the 3-state UX, incl. document fields |
| 7 | Submissions admin | Admin can view submissions per form |
| 8 | Dashboard listing + filtering | Form/block lists with search/sort/filter |
| 9 | Polish: undo/redo, preview, drag-reorder | Builder reaches prototype-parity |
| 10 | Trigger attachment (Membership Request, Shift Apply) | Forms gate join-org / apply-shift flows |

Chunks 1–6 are the **MVP scope**: an admin can build a form (including document-acknowledgement fields, a client requirement), publish it at a public URL, and a volunteer can fill it. 7–9 are parity polish. Chunk 10 is moved to the end because it requires touching the existing `shift` and `membership-request` modules — bigger blast radius and additional eng work outside the form-builder boundary.

---

## 2. Chunk 1 — Data model & permissions foundation

**What this delivers (PM):** the database knows about blocks, forms, fields, and submissions. Nothing visible yet — this is the rails everything else rolls on.

**Implementation details (dev):**

New Drizzle schemas under `apps/backend/src/form-builder/schemas/` (new domain module). Mirror the existing convention (`apps/backend/src/membership/schemas/`).

```
blocks                 — reusable bundle of fields, owned by an organization_unit
  id, organization_unit_id (FK), title, description, icon,
  created_by_user_id (FK), updated_by_user_id (FK), timestamps

block_fields           — fields belong to a block (1:N)
  id, block_id (FK, cascade), order (int),
  type (enum: text | textarea | numbers | date | singlechoice |
              multichoice | document-acknowledgement | static-text |
              + the system-bound subset: vorname | nachname | email |
              phone | plz | date | text used by system requirements),
  label, description, placeholder, required (bool),
  system_key (text, nullable — references the registry key when set),
  options (jsonb, nullable — for choice fields),
  document_url, document_label, min_age (per the prototype's FormField)

forms                  — a form belongs to an organization_unit
  id, organization_unit_id (FK), slug (unique per org), name, description,
  locale, settings (jsonb: submit_button_label, success_*, allow_embed),
  created_by_user_id, updated_by_user_id, timestamps

form_blocks            — block-refs (M:N + ordering, mirrors BlockRef)
  form_id (FK), block_id (FK), order (int),
  required_override (bool, nullable),
  primary key (form_id, block_id)

form_submissions       — one row per submitted form
  id, form_id (FK), submitter_user_id (FK, nullable for anon),
  data (jsonb — { fieldId: value }), submitted_at

user_profile_entries   — system-requirement values keyed per user
  user_id (FK), system_key (text), value (jsonb),
  sub_org_id (FK organization_units), updated_at,
  primary key (user_id, system_key)
```

**Permission keys** added to `apps/backend/src/auth/enums/index.ts`:

```
FORM_CREATE / READ / UPDATE / DELETE
BLOCK_CREATE / READ / UPDATE / DELETE
SUBMISSION_READ
```

Submission *creation* is gated by form access (public if `settings.allowEmbed` or trigger context permits), not a permission key — same shape as today's public shift apply page.

**Seed strategy.** The System Requirement registry is **code, not data** (lives in `apps/backend/src/form-builder/system-requirements.ts`, ported from the prototype's `src/lib/system-requirements.ts`). Profile entries are user-generated; no seed needed.

**Reusable from prototype:** the shape of `FormField`, `Block`, `FormConfig`, `BlockRef`, `FormSubmission` in [`src/lib/types.ts`](src/lib/types.ts) maps 1:1 to the table columns above. The `SYSTEM_REQUIREMENTS` registry in [`src/lib/system-requirements.ts`](src/lib/system-requirements.ts) ports as-is.

**Built differently:** no JSON files; no `runExclusive` (Postgres handles concurrency); IDs are UUIDs (Drizzle `uuid()`), not the prototype's `block-<8hex>` shorthand.

---

## 3. Chunk 2 — Block library

**What this delivers (PM):** admins navigate to a Blocks tab, create reusable blocks, edit/delete them, and see which forms use each block. This is the foundation — blocks exist independently of any form.

**Implementation details (dev):**

### Backend

New module `apps/backend/src/form-builder/`:
- `block.service.ts` — list, getById, create, update, delete (cascade-checks "is the block referenced by a form?" before delete, mirrors the prototype's protection).
- `block-mutation.resolver.ts` + `block-query.resolver.ts` with `@Permissions(BLOCK_CREATE / READ / UPDATE / DELETE)`.
- `inputs/{create-block.input.ts, update-block.input.ts, block-field.input.ts}` — class-validated DTOs.
- `models/block.model.ts`, `block-field.model.ts` — GraphQL `@ObjectType`s.
- `mappers/block.mapper.ts` — Drizzle row → GraphQL model.

### Frontend

New domain folder `apps/frontend/src/domain/block/`:
- `schemas.ts` — Zod schemas mirroring backend inputs (use a shared types package if appetite exists; otherwise re-declare and trust GraphQL codegen for the inferred types).
- `actions.ts` — `createBlock`, `updateBlock`, `deleteBlock` via `actionClient.inputSchema(...).action(...)`.
- `components/` — list cards, summary preview.
- `forms/` — `create-block-sheet.tsx`, `edit-block-sheet.tsx`, `form-content.tsx` (the field-editing surface).

GraphQL operations in `packages/data/src/repositories/block/block.graphql` (queries: `GetBlocks`, `GetBlock`; mutations: `CreateBlock`, `UpdateBlock`, `DeleteBlock`) + `block.repository.ts` mirroring [`role.repository.ts`](packages/data/src/repositories/role/role.repository.ts).

### Reusable from prototype (port these wholesale)

- [`src/components/builder/edit-block-sheet.tsx`](src/components/builder/edit-block-sheet.tsx) — the title/description/icon editor, the field list with drag-to-reorder, the "Felder" + "Verfügbare Systemfelder" sections.
- [`src/components/builder/draggable-field-row.tsx`](src/components/builder/draggable-field-row.tsx) — row UI with type badge, Systemfeld tooltip, required Switch.
- [`src/components/builder/field-form.tsx`](src/components/builder/field-form.tsx) — inline field editor (custom field + system-field disabled-type variant).
- [`src/components/builder/available-system-field-card.tsx`](src/components/builder/available-system-field-card.tsx) — picker cards for adding system fields.
- [`src/components/builder/options-editor.tsx`](src/components/builder/options-editor.tsx) — choice-field option editor.
- [`src/components/builder/field-badge.tsx`](src/components/builder/field-badge.tsx), [`src/components/field-data-hint.tsx`](src/components/field-data-hint.tsx) — preview chips.
- [`src/lib/predefined-fields.ts`](src/lib/predefined-fields.ts) — `FIELD_TYPE_OPTIONS`, `FIELD_TYPE_LABELS`, `getFieldDisplayLabel`.
- [`src/lib/block-icon.tsx`](src/lib/block-icon.tsx) — icon picker.

### Built differently

- **Batched commit, client-side draft** (decided May 2026, prototype now ships this). The earlier `useBlockFieldMutations` PUT-on-every-keystroke pattern is **gone**. `EditBlockSheet` holds the whole edit session in local state (`localFields` + `title` + `description`); a single `onCommit(updatedBlock, { requestResubmit })` fires when the user explicitly clicks Speichern. Port this contract directly:
  - Backend: one `updateBlock(id, input)` mutation that takes the full block payload (title, description, icon, fields, required) and writes it in one transaction. No `addBlockField` / `updateBlockField` / etc.
  - Frontend: server action `updateBlock` wraps the GraphQL mutation. The sheet calls it on Speichern; nothing else PUTs.
  - Why this matters for the real product: it removes the "rollback via PUT" mess (open question #2 in earlier drafts), kills concurrent-editor race conditions, and prevents the audit log from filling with mid-edit noise. The prototype kept the draft model purely in React state; the real product gets it almost for free via the existing `react-hook-form` + `next-safe-action` flow.
- **`useBlockFieldMutations` is dead code** in v2 and should not be ported. It only lives at `src/components/v1/lib/` for the frozen v1 tree.
- **`CreateBlockSheet` is a thin wrapper** now — it just holds a static seed Block, hands it to `EditBlockSheet`, and the `onCommit` POSTs to `/api/blocks` (becomes `createBlock` mutation in the real product). No more `draftRef` mirror. Port the new shape.
- **Confirm dialogs**: replace [`ConfirmDialog`](src/components/confirm-dialog.tsx) (currently `AlertDialog`-based already; the v1 copies are `Dialog`-based — port the v2 file).
- **Mutations**: convert every component-level `fetch('/api/blocks/...')` to call a server action that wraps the data-client repo.
- **No undo/redo for blocks**: the prototype's `useUndoRedo` is form-level only; keep that scope.

### Shared-block save prevention (new sub-feature)

When an admin edits a block referenced by multiple forms, blindly saving would silently change every consumer. The prototype guards this with a confirmation dialog — port the same shape:

- **Bypass rule**: `requiresConfirmation = usedInForms.length > 0 && !(currentFormId && onlyConsumer)`. Standalone blocks save silently. Form-editor entry + sole-consumer saves silently. Everything else (block-card entry, shared block) shows the dialog.
- **Dialog content**: title states the form count; a `Verwendet in` eyebrow + outline badges list the affected forms.
- **Two coupled save options** (visually paired in the dialog footer): **Speichern und neu einreichen lassen** (primary — Phase 2 wires this to the notification system, see Chunk 10) and **Stillschweigend speichern** (outline — silent commit, e.g. for typo fixes). Plus a separate **Kopie erstellen ({Title} Kopie)** affordance that POSTs a new block from the edit and leaves the original untouched. From the form editor, picking Kopie also swaps the current form's `blockRef` to the new block — wire `onSwapBlockRef` accordingly.
- **No "Discard" button** — the dialog's X / Escape / click-outside reverts to the sheet so the user can keep editing; closing without saving simply throws away the local draft (the open-effect re-seeds from the persisted block next time).
- **Toasts** via `sonner` on the parent's commit handler: differentiates resubmit vs silent (`"Block gespeichert. Freiwillige werden zur Neueinreichung aufgefordert."` vs `"Block gespeichert."`) so the user knows which path fired.
- **Resubmit hook**: in the prototype this is just a different toast. In the real product the `requestResubmit: true` flag has to call the notification system — see Chunk 10 §"Resubmit propagation" below.

### Inline-edit UX patterns to keep

These come from the prototype's last polish pass and are worth a paragraph here so the porter doesn't strip them:

- **FieldForm autosave-on-unfocus** (blur-commit). When focus leaves the inline FieldForm, it commits the field into the parent's draft. Explicit Abbrechen wins via a `cancellingRef` set on the button's `onMouseDown`. Idempotent commit via `committedRef` so blur + global Save in the same tick don't double-fire.
- **Auto-open type picker** on a fresh new field, then focus the Feldname Input as soon as a type is picked. Document upload prefills the Feldname from the filename and `select()`s it.
- **`scrollToError()` on the commit handle**. When the global Save fails validation on an in-progress field, scroll that FieldForm into view + surface the inline error.

These all live entirely client-side; nothing changes when porting them. Note them in the design review with the same UX rules captured in `PROJECT_CONTEXT.md` (eliminate dead clicks, focus follows commitment, errors come to the user).

---

## 4. Chunk 3 — Form management

**What this delivers (PM):** admins create a form (name, organization unit, settings), drop in existing blocks in any order, and the form gets a unique slug. Forms can be edited and deleted. Volunteer-side rendering is still missing — comes in Chunk 6.

**Implementation details (dev):**

### Backend

Continue the `apps/backend/src/form-builder/` module:
- `form.service.ts` — list / getById / getBySlug / create / update / delete + `addBlockRef` / `removeBlockRef` / `reorderBlockRefs`.
- `form-mutation.resolver.ts` + `form-query.resolver.ts` with `@Permissions(FORM_*)`.
- Slug generation: derive from name + collision suffix, scoped per `organization_unit_id` (matches prototype's collision-safe shape; UNIQUE constraint enforces it).
- Cross-org-unit block usage: a block belongs to one org-unit; a form should only be able to reference blocks from its own org-unit or a parent. **Open question (see §13).**

### Frontend

`apps/frontend/src/domain/form/`:
- `schemas.ts`, `actions.ts`, `components/`, `forms/`.
- New route: `app/(dashboard)/[orgUId]/forms/page.tsx` (list) and `app/(dashboard)/[orgUId]/forms/[slug]/page.tsx` (builder).
- The builder page is server-rendered (load blocks + form), with a client island for the editor.

GraphQL: `packages/data/src/repositories/form/form.{graphql,repository.ts}`.

### Reusable from prototype

- [`src/components/builder/builder-layout.tsx`](src/components/builder/builder-layout.tsx) — the entire builder shell (header, back link, undo/redo, save button, block list, add-block, save). State management adapts: `useUndoRedo<FormConfig>` stays; field-mutation hooks swap from REST `fetch` to server-action calls.
- [`src/components/builder/section-card.tsx`](src/components/builder/section-card.tsx) — `BlockCardBuilder` (block-in-form preview + remove button).
- [`src/components/builder/add-section-dialog.tsx`](src/components/builder/add-section-dialog.tsx) — block picker dialog.
- [`src/components/builder/create-block-sheet.tsx`](src/components/builder/create-block-sheet.tsx) — when "create new block" is triggered from inside the form builder.
- [`src/components/create-form-dialog.tsx`](src/components/create-form-dialog.tsx) — "Neues Formular" / "Formular kopieren" dialog.
- [`src/lib/use-undo-redo.ts`](src/lib/use-undo-redo.ts) — pure utility, no dependencies on prototype storage.
- [`src/lib/resolve-blocks.ts`](src/lib/resolve-blocks.ts) — pure transformation, ports as-is.

### Built differently

- **No "appliedTo"** in the v2 form config — the prototype's `appliedTo` was already removed from v2 UI (see `PROJECT_CONTEXT.md` "Triggers / 'applied to' / rules — v1 only"). Trigger binding lives on the *trigger* side instead (see Chunk 10).
- **Save flow**: prototype PUTs the whole `FormConfig` to a slug-based route. In the real product, `updateForm` mutation takes a `FormBlockRefInput[]` and the server diffs.
- **Permissions**: wrap the "Save / Delete / Create" buttons in `<RequirePermission permission="FORM_UPDATE">`. Drop the prototype's `canEditForm(user, form)` helper — `useHasPermission` is the new source of truth.

---

## 5. Chunk 4 — System Requirements + Volunteer Profile

**What this delivers (PM):** the platform supports a fixed catalogue of profile-bound fields (first name, last name, email, birthday, address, …). When a volunteer fills one in, the answer persists on their profile and shows up pre-filled on the next form in another sub-org. Until volunteer rendering ships in Chunk 6, this surface is invisible to volunteers — but the backend and admin builder need it first.

**Implementation details (dev):**

### Backend

- Port [`src/lib/system-requirements.ts`](src/lib/system-requirements.ts) to `apps/backend/src/form-builder/system-requirements.ts`. The registry is **code**, not a DB table — the platform owns it and ships changes with deploys. Same idiom as the existing `PermissionKey` enum.
- Service: `userProfile.service.ts` — `getProfile(userId)`, `upsertEntries(userId, entries: { systemKey, value, subOrgId }[])`.
- Resolver: `userProfile-{query,mutation}.resolver.ts`:
  - `Query.myProfile: UserProfile!` — authenticated user only.
  - `Mutation.upsertProfileEntries(input: [ProfileEntryInput!]!): UserProfile!` — authenticated, scoped to self.
- Validation: server-side mirror of [`src/lib/validation.ts`](src/lib/validation.ts) for per-systemKey rules (email regex, age check, etc.). Reject mismatches with `BadRequestException`.

### Frontend

- `apps/frontend/src/domain/user-profile/` — `actions.ts` exposes `upsertProfileEntries`. `me/` page can later render the profile editor.
- GraphQL: `packages/data/src/repositories/userProfile/`.

### Reusable from prototype

- The whole registry (10 entries today). Same TypeScript shape — `defaultRequired`, `requiredEditable`, `options`, `type`.
- The factory `createSystemRequirementField(key)` and the guard `isSystemRequirement(field)` — both pure, port directly.
- Builder-side surfaces: [`available-system-field-card.tsx`](src/components/builder/available-system-field-card.tsx), the `Systemfeld` badge + tooltip in [`draggable-field-row.tsx`](src/components/builder/draggable-field-row.tsx), the locked-type `Alert` in [`field-form.tsx`](src/components/builder/field-form.tsx).

### Built differently

- **`subOrg` is now a UUID**, not a string. The prototype stored `subOrg: "Karlstrasse 13"` (the org-unit's *name*). The real product stores `sub_org_id: uuid` (FK to `organization_units`). The hide/prefill rule still compares two ids; the only change is at the rendering boundary where we display the unit's `name` in the state-3 card subtitle.
- **No cookie hack**: the prototype's `USER_COOKIE` swap-point in `getVolunteerIdFromCookies()` becomes a `getSession()` call. The plan's single-point-of-swap discipline pays off here — only the GraphQL resolver context needs updating.
- **Profile editor UI**: the prototype doesn't have one (entries are populated only via form submission). The real product can add a "My Profile" page later — out of scope here.

---

## 6. Chunk 5 — File uploads (document-acknowledgement)

**What this delivers (PM):** admins can upload a PDF (data-protection statement, code of conduct, etc.) to a `document-acknowledgement` field; volunteers see the file inline and tick a "I have read and accepted" checkbox. **In MVP scope — client requirement.** Sits between System Requirements and Volunteer rendering because Chunk 6 (Volunteer rendering) needs to be able to render `document-acknowledgement` fields end-to-end, which means the storage side of uploads must already exist.

**Implementation details (dev):**

This is the chunk with the biggest open infrastructure question.

- Prototype stores PDFs in `data/uploads/` and serves them from `/api/uploads/[filename]`. Not viable in production (no shared filesystem in a containerized deploy).
- Real product needs an object-storage adapter — most likely S3-compatible (the existing infra package or a sibling new one). The exact choice depends on what's running today (see [`apps/backend/src/database/database-connection.ts`](apps/backend/src/database/database-connection.ts) neighbours).
- `block_fields.document_url` stores the storage URL, not a local path.

### Reusable from prototype

- [`src/components/builder/file-upload-field.tsx`](src/components/builder/file-upload-field.tsx) and [`src/lib/use-file-upload.ts`](src/lib/use-file-upload.ts) — the UI is reusable; the upload endpoint plug needs swapping.
- [`src/components/form/document-acknowledgement.tsx`](src/components/form/document-acknowledgement.tsx) — volunteer-side inline PDF preview + checkbox. Used by Chunk 6.

### Built differently

- New backend mutation `createUploadUrl(filename, mimeType)` returning a pre-signed PUT URL.
- New frontend action that calls it and uploads directly to storage. The form-builder UI gets back the storage URL.
- **Storage backend decision** must land before this chunk starts — see §13.

---

## 7. Chunk 6 — Volunteer-facing form rendering

**What this delivers (PM):** a volunteer hits a public form URL and sees the multi-step form, with the 3-state behaviour for profile-bound fields (empty / hidden / prefilled-with-edit). Submitting routes data to the right place: regular fields → submissions, profile fields → profile.

**Implementation details (dev):**

### Backend

- Public query `Query.formBySlug(orgUnitSlug, formSlug): PublicForm!` — returns the form + resolved blocks + the *authenticated* user's profile entries (or empty if anon). Skips fields hidden by state-2 server-side too (defence in depth — don't trust the client to filter).
- `submission.service.ts` + `submission-mutation.resolver.ts` — `createSubmission(input)`. The mutation accepts both regular field data *and* profile updates in one call (so the public form makes one server round-trip on submit, matching the prototype's `Promise.all`).
- Validation server-side per field type.

### Frontend

- Public route: `apps/frontend/src/app/(public)/forms/[orgUnitSlug]/[formSlug]/page.tsx`.
- Server-renders the form metadata; mounts the multi-step React island.
- Server action `submitForm` calls the GraphQL mutation.

### Reusable from prototype (this is the largest port surface)

- [`src/components/form/multi-step-form.tsx`](src/components/form/multi-step-form.tsx) — the orchestrator. `fieldStateMap`, prefill effect, editing/snapshot state, cancel/confirm handlers, submission splitter. **The contract is preserved**; only the fetches change (server-action call instead of `fetch`).
- [`src/components/form/form-step.tsx`](src/components/form/form-step.tsx) — 3-way dispatch (normal / display / edit).
- [`src/components/form/profile-field-display.tsx`](src/components/form/profile-field-display.tsx) — state-3 card.
- [`src/components/form/field-renderer.tsx`](src/components/form/field-renderer.tsx) — including the `hideLabel` prop introduced for state-3 edit mode.
- [`src/components/form/step-progress.tsx`](src/components/form/step-progress.tsx) — progress bar.
- [`src/components/form/document-acknowledgement.tsx`](src/components/form/document-acknowledgement.tsx) — wired via Chunk 5 (file uploads).
- [`src/lib/build-steps.ts`](src/lib/build-steps.ts) — pure step builder.
- [`src/lib/validation.ts`](src/lib/validation.ts) — client-side validator, mirrored server-side.

### Built differently

- **Submit path**: prototype does two parallel `fetch` calls (`/api/submissions` + `/api/user-profile`). Real product: one server action invoking one GraphQL mutation that handles both in a DB transaction. Cleaner failure semantics, no partial-write risk.
- **Anonymous submissions**: the public form page must work for unauthenticated users for "join org" flows where the volunteer hasn't yet signed up. The submission row stores `submitter_user_id: null` and the profile-update branch is no-oped (no profile to write to). When a user does authenticate mid-flow (e.g., the membership-request path), the back-end associates the submission with the new user. **Open question (§13).**
- **Locale**: prototype's `config.locale` is unused. Real product wires this to a `next-intl` namespace. Out of scope for MVP — keep all copy in German for parity.

---

## 8. Chunk 7 — Submissions admin

**What this delivers (PM):** admin opens a form's "Einreichungen" tab and sees a table of submitted responses with each field as a column. Click a row → detail view. Mirrors the prototype's submissions page.

**Implementation details (dev):**

- Backend: `Query.formSubmissions(formId)` paginated, `@Permissions(SUBMISSION_READ)`.
- Frontend: new route `app/(dashboard)/[orgUId]/forms/[slug]/submissions/page.tsx`.

### Reusable from prototype

- [`src/app/submissions/[formSlug]/page.tsx`](src/app/submissions/[formSlug]/page.tsx) and [`src/app/submissions/page.tsx`](src/app/submissions/page.tsx) — the table + per-form layouts. Adapt to the platform's data-table pattern (see how `apps/frontend/src/app/(dashboard)/[orgUId]/settings/roles/roles-table.tsx` is built; align the new submissions-table with it).
- [`src/lib/formatting.ts`](src/lib/formatting.ts) — already in the real product, just use `apps/frontend/src/lib/formatting.ts` instead. Both have `formatDate`, `formatDateTime`, etc.

### Built differently

- **System Requirement values don't appear in submissions** — they're on the profile. Submission table only renders the non-system columns. The prototype already does this correctly.
- **Pagination**: prototype loads everything; real product paginates from page one.
- **Export**: out of scope for MVP, but a CSV export action is a one-resolver follow-up.

---

## 9. Chunk 8 — Dashboard listing + filtering

**What this delivers (PM):** the Forms and Blocks tabs in the admin dashboard get search, filter (by author, by org-unit), and sort — matching what the prototype's v2 [`dashboard-content.tsx`](src/components/dashboard-content.tsx) has today.

**Implementation details (dev):**

### Reusable from prototype

- [`src/components/list-controls.tsx`](src/components/list-controls.tsx) — search + filter Selects + sort Select + optional combobox-style suggestions. Pure props-driven, **zero coupling to JSON storage**. Ports directly.
- [`src/components/dashboard-content.tsx`](src/components/dashboard-content.tsx) — the tabs + cards grid + filtering logic. Adapt the data source from JSON-fetch to the data-client.
- [`src/components/form-card.tsx`](src/components/form-card.tsx) and [`src/components/block-card.tsx`](src/components/block-card.tsx) — card UIs.

### Built differently

- **Server-side filtering**: prototype filters client-side because it has all data in memory. Real product can do either; for MVP, client-side filtering of the paginated page-1 result is fine. Move to server-side only when a customer hits the threshold.
- **The `myOrgFirst` sort** for moderators: the rule is the same (current user's org-unit pinned to top), but the lookup uses `useOrgUId()` rather than `currentUser.subOrg`.
- **Search suggestions**: the prototype's `searchSuggestions` combobox flow (see `PROJECT_CONTEXT.md` "ListControls extensions") ports as-is.

---

## 10. Chunk 9 — Builder polish (undo/redo, drag-reorder, preview)

**What this delivers (PM):** the form builder reaches parity with the prototype on the small but high-touch details — Cmd+Z works, dragging a block reorders it, hitting "Vorschau" opens the volunteer form in a new tab.

**Implementation details (dev):**

All three are already-built prototype features that port without backend changes.

### Reusable from prototype

- [`src/lib/use-undo-redo.ts`](src/lib/use-undo-redo.ts) — generic state-history hook. Wraps the form-config setter.
- [`src/components/builder/draggable-field-row.tsx`](src/components/builder/draggable-field-row.tsx) — HTML5 drag-and-drop (no external lib). Works wherever React works.
- The Vorschau button in [`builder-layout.tsx`](src/components/builder/builder-layout.tsx) — a regular `<a target="_blank">` to the public form URL. The only change is the URL shape (`/forms/[orgUnitSlug]/[formSlug]` instead of `/forms/[slug]`).

### Built differently

- **Save** is what gets undo'd: in the prototype it's a single PUT of the whole config. With server actions, every undo step replays the action client-side and re-issues the mutation. **Open question — see §13.**

---

## 11. Chunk 10 — Trigger attachment (Membership Request, Shift Apply)

**What this delivers (PM):** "this form fires when a volunteer requests membership in sub-org X" or "this form fires when a volunteer applies to shift Y". Without this, the form-builder's output is a standalone URL — useful for sharing, not yet woven into the product's join-org and apply-shift flows.

Moved to the end of the plan because it requires invasive changes in the `shift` and `membership-request` modules — not the form-builder boundary — and the surrounding shift-apply UX needs its own design conversation first. MVP forms (Chunks 1–6) can be shared by URL until this lands.

**Implementation details (dev):**

The prototype's `appliedTo: string[]` field with synthetic `<trigger>:<location>` rule IDs is **the wrong shape for production**. In the real model, *the trigger owns the form reference*, not the other way round. This inverts the v1 prototype's design:

```
membership_requests.form_id        (nullable, optional approval form)
shifts.application_form_id         (nullable, optional apply form)
```

Each side gets a one-FK addition. Resolvers expose `Form?` on the parent type. The form-builder UI gets a "where this form is used" panel (which it already has — [`edit-block-sheet.tsx`](src/components/builder/edit-block-sheet.tsx) renders "Verwendet in", same affordance applies to forms).

### Backend changes

- Add `form_id uuid` to `membership_requests` and `shifts` schemas. Migration is non-trivial because both tables already have production data — additive nullable FK is the safe shape.
- A new mutation per trigger to set/clear it: `setMembershipRequestForm(orgUnitId, formId)`, `setShiftApplicationForm(shiftId, formId)`. Gated by the existing `MEMBERSHIP_REQUEST_UPDATE` / `SHIFT_UPDATE` permissions.
- The actual `createMembershipRequest` / `applyToShift` flows need to gate on whether a form is attached and whether a submission has been recorded for this user against it — non-trivial state machine on top of two already-stateful flows.

### Frontend changes

- In the existing `shift` and `membership-requests` domain forms (`apps/frontend/src/domain/shift/forms/`, `apps/frontend/src/domain/membership-requests/`), add a "Anmeldeformular" Select that lists forms in this org-unit.
- The public shift page ([`apps/frontend/src/app/(public)/shifts/[shiftId]/page.tsx`](apps/frontend/src/app/(public)/shifts/[shiftId]/page.tsx)) and the invite page ([`apps/frontend/src/app/(public)/invite/[orgId]/page.tsx`](apps/frontend/src/app/(public)/invite/[orgId]/page.tsx)) check for an attached form and either render it inline or redirect to the public form URL on action.
- Both touch flows that volunteers already use today — needs UX review before code.

### Reusable from prototype

Almost nothing — `appliedTo` and `trigger-options.ts` are v1-only and don't translate. The mental model of "a form fires from a trigger" survives; the data shape inverts.

### Built differently

- No synthetic rule IDs (`join:current`, `shift:abc`). Direct FKs.
- No "applied to" UI on the form-builder side — the *trigger* owns the relation, the form is a passive resource. (Future: a read-only "wird genutzt von" panel on the form-builder page that lists the triggers referencing this form.)

### Resubmit propagation (new — sourced from Chunk 2's save dialog)

The Chunk 2 save dialog has two save modes — **Speichern und neu einreichen lassen** and **Stillschweigend speichern**. The prototype differentiates them with a toast only. In the real product the resubmit mode has to fan out:

- For every form that references the edited block (`usedInForms`), find every `form_submissions` row whose `form_id` matches and `submitted_at >= block.previous_updated_at`. Those are the submissions to notify.
- Notification target: the `submitter_user_id` on each row (skip when null — anonymous submissions can't be re-prompted).
- Notification channel: TBD. Most likely a record in a `notifications` table + an email send. Lives in the notifications module, not the form-builder module. The form-builder side just emits the *intent* (e.g. a `BLOCK_CHANGED_NEEDS_RESUBMIT` event) and lets the notification system decide how to deliver.
- Why it can't ship in MVP: the notification module doesn't exist yet, and the spec for "what does 'resubmit' mean for a volunteer" hasn't been written (do they edit their existing submission? create a new one and supersede the old? both?). Until that's decided, Phase 2 ships the dialog UX with **both modes routing to silent save server-side**; the notification flag is captured in the mutation input and ignored. When the notification module lands, the resolver gets one new dependency and one new side-effect call.
- **Open question for PM** — see §13 item 9.

---

## 12. Permissions matrix

A consolidated view for the auth conversation. New keys to add to `PermissionKey`:

| Key | Used by | Granted to (default) |
|---|---|---|
| `BLOCK_READ` | block list + read in builder | all members |
| `BLOCK_CREATE` / `UPDATE` / `DELETE` | block admin UI | role with form-builder access |
| `FORM_READ` | form list + read | all members |
| `FORM_CREATE` / `UPDATE` / `DELETE` | form admin UI | role with form-builder access |
| `SUBMISSION_READ` | submissions table | role with form-builder access |

The prototype's `canEditBlock / canDeleteBlock / canEditForm / canDeleteForm / canRemoveBlockFromForm / canCreateFormFromScratch` helpers map to combinations of the above + the "moderator can only edit own resource" rule, which in the real product happens at the resolver level (compare `createdById === ctx.userId`), not via a frontend helper.

---

## 13. Open questions

Pull these into the PM/eng kickoff before phase 2 starts. Each blocks design choices downstream; deferring is fine, ambiguity is not.

1. **Block scoping.** Are blocks org-unit-local, org-wide, or platform-wide? The prototype treats them as flat-global (any admin sees all blocks). The real product has a hierarchy (`organization_units` tree). MVP recommendation: org-unit-local with read-through to parent (a child sub-org can use any block created in its parent chain). Hits the prototype's reuse story without introducing platform-wide globals.
2. **Form-field mutation granularity.** ✅ Resolved May 2026 — batched. The prototype now holds the whole edit session as a client-side draft and PUTs the full block in one shot on Speichern. See §3 "Batched commit" for details. Revisit only if the integration ever needs draft state to survive page navigation (current model loses the draft on close).
3. **Anonymous submissions.** Can the public form URL be filled without an account? For membership-request forms, the answer is yes (the whole point is "I'd like to join"). For shift-application forms, the answer is probably no (you must be a member first). Encode per-form via `settings.allowAnonymous: boolean` — defaults to false.
4. **Undo/redo across server save.** Local-only (undo stack clears on save) vs server-versioned (re-issue mutations). MVP: local-only, matches the prototype's behaviour exactly. Server-versioned is a quarter-long effort and not in this scope.
5. **File storage backend** (§6). Needs eng-lead decision before Chunk 5 — this is now blocking MVP.
6. **Profile editor**. Should volunteers be able to edit their profile entries outside of a form-submission flow? Not in MVP scope, but design should leave room — likely a `me/profile` page later that reuses [`src/components/form/profile-field-display.tsx`](src/components/form/profile-field-display.tsx) in edit mode.
7. **Form versioning.** A volunteer fills a form, then admin edits the form — does the submission belong to the old or new version? MVP: no versioning, last-write-wins, submissions reference current form. Acceptable for v1 because submissions store their own `data` snapshot and the field IDs in that snapshot still resolve. Revisit when the first compliance question lands.
8. **i18n**. Forms today are German-only. Prototype's `locale: 'de' | 'en'` field is unused but stored. Decide whether MVP supports English forms or just retains the field for forward compatibility.
9. **Resubmit notification fan-out** (new — needed by Chunk 2's save dialog + Chunk 10). When admin picks **"Speichern und neu einreichen lassen"** on a shared block, who exactly gets notified, through which channel, and what action do they take on receipt? Three sub-questions:
   - **Scope**: every volunteer whose submission predates the change, or only those whose specific fields actually changed? The latter is cheaper but the diff is non-trivial (which `block_fields.id` changed?).
   - **Delivery**: email only, in-app notification, both? Tied to whatever the notifications module ends up being. Form-builder shouldn't dictate.
   - **Semantics**: does "resubmit" mean re-fill from scratch, edit in place, or supersede the old submission with a new one? Affects `form_submissions` table shape (need a `supersedes_id` column?) and the audit story for compliance-flavoured forms.
   - **MVP fallback** (proposed): ship the dialog UX with both modes routing to a silent save server-side; capture the flag in the mutation input and ignore it for now. Wire the fan-out when the notification module exists.

---

## 14. Quick lookup — what ports, what doesn't

A one-page reference for the engineer scaffolding a chunk.

### Ports directly (just change imports and the data-fetch boundary)

- `src/lib/types.ts` — domain types
- `src/lib/system-requirements.ts` — registry + factory + guards
- `src/lib/predefined-fields.ts` — `FIELD_TYPE_OPTIONS`, `FIELD_TYPE_LABELS`, `getFieldDisplayLabel`
- `src/lib/validation.ts` — client-side rules; also mirror server-side
- `src/components/builder/edit-block-sheet.tsx` — **post-refactor shape**: one `onCommit(updated, { requestResubmit })`, no per-field op props, multi-form save dialog included
- `src/components/builder/create-block-sheet.tsx` — thin wrapper over EditBlockSheet that POSTs on commit
- `src/lib/build-steps.ts`, `src/lib/resolve-blocks.ts` — pure transformations
- `src/lib/block-icon.tsx` — icon picker
- `src/lib/use-undo-redo.ts` — generic, no storage coupling
- All `src/components/builder/**` UI (except the field-mutation hook)
- All `src/components/form/**` UI (the volunteer side)
- `src/components/list-controls.tsx` — search/filter/sort + suggestions combobox
- `src/components/{block-card,form-card,field-data-hint,block-summary-preview,confirm-dialog,version-switcher,dashboard-content}.tsx`

### Rebuild against platform conventions

- All `src/app/api/**` routes → GraphQL resolvers in `apps/backend/src/form-builder/`
- All `data/*.json` store files → Drizzle tables
- All inline `fetch('/api/...')` in components → server actions (`actionClient`) calling repos
- `src/lib/users.ts` and the `canX(user)` helpers → `<RequirePermission>` + resolver `@Permissions(...)`
- `src/lib/use-file-upload.ts` upload target → presigned URL flow
- `src/lib/store-*.ts` files → service-layer code in NestJS
- `appliedTo` + `trigger-options.ts` → trigger-side FKs (`membership_requests.form_id`, `shifts.application_form_id`)
- Authentication: `USER_COOKIE` cookie + `USERS` array → Better Auth session
- v1 components (`src/components/v1/**`) — **don't port**. Frozen prototype reference.

### Don't port (prototype-only)

- `src/components/user-switcher.tsx`, `src/components/version-switcher.tsx` — both are prototype-demo affordances.
- `src/lib/use-block-field-mutations.ts` — already unused in v2 after the local-draft refactor. The integration uses `onCommit(updatedBlock)` instead. Only the v1 copy under `src/components/v1/lib/` keeps a reference.
- `data/*.json` files (used for seed inspiration only).
- The `/v1` route tree.
- `REFACTOR_PLAN.md` (already-completed prototype refactor, separate from this integration plan).

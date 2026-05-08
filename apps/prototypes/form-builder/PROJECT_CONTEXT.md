# Form Builder — Working Context

Context for Claude when working on this prototype. Read before making changes.

## What this is

A **prototype** inside `apps/prototypes/form-builder` (Next.js 16, React 19, Tailwind v4, `@repo/ui` shadcn-style components, Bun runtime, port 3002). It is a self-contained sandbox to validate UX for a volunteer-org form-builder feature. It is **not** production: data lives in JSON files under `data/` (`blocks.json`, `form-configs.json`, `submissions.json`, `uploads/`), not a database. Auth is a cookie + a hardcoded `USERS` list.

The product domain is German (volunteer org, "Ehrenamt"). All user-facing copy is German. Use German umlauts correctly (ä ö ü ß) — past commits had to fix them. Source code identifiers and comments are English.

## Versions: v1 and v2 coexist

The prototype runs **two parallel UI versions** off the same JSON store. A `<VersionSwitcher>` next to the `<UserSwitcher>` on the dashboard toggles between them by rewriting the path prefix.

- **v1** = frozen snapshot of the original UI.
  - Routes: `src/app/v1/{page,builder/[slug]/page,forms/[slug]/page,forms/[slug]/success/page,submissions/page,submissions/[formSlug]/page}.tsx`
  - Components: `src/components/v1/**` (wholesale copy of the original tree)
  - All v1 internal links/redirects are pre-prefixed with `/v1` (BuilderLayout back-arrow, BackHeader default `href`, FormCard "Ändern"/"Submissions", CreateFormDialog `router.push`).
- **v2** = current iteration. Lives at the original paths.
  - Routes: `src/app/{page,builder/[slug]/page,...}.tsx`
  - Components: `src/components/**`
- **Shared (both versions read these)**: `src/lib/**`, `src/app/api/**`, `data/**`. Type shapes are identical — the JSON store is one DB for both.
- **Switcher**: [src/components/version-switcher.tsx](src/components/version-switcher.tsx). Reads `usePathname()`, navigates by toggling the `/v1` prefix. Embedded in dashboard headers (both `src/app/page.tsx` and `src/app/v1/page.tsx`) next to `UserSwitcher`. Not present on builder/forms/submissions pages.

When making a change, decide first whether it lands in v1 (frozen — usually no), v2 (default), or both (rare; usually means it belongs in the shared `lib/` layer).

## v1 vs v2 — code map

Code-level diff table. File paths shown are *just* the part that differs; everything not listed is identical between versions or shared.

| Surface | v1 | v2 | Notes |
|---|---|---|---|
| Builder shell (`builder-layout.tsx`) | Two-pane: `flex min-h-screen` with editor on left + `<FormPreview>` panel on right (`w-[380px]`) | Single-pane: `min-h-screen` + `max-w-3xl` content. No right panel. | v2 dropped the live preview |
| Builder header buttons | Undo, Redo only | Undo, Redo, **Vorschau** (`<a target="_blank" href={`/forms/${config.slug}`}>`) | v2 launches public form in new tab |
| Save flow (`builder-layout.tsx#handleSave`) | Validates `appliedTo.length > 0`; sets `appliedToError`; toasts a warning and aborts when empty | No validation — saves unconditionally | v2 has no `appliedToError` state |
| Applied-to UI | `<AppliedToSection>` rendered after `<Separator>` below blocks; emits `<trigger>:<location>` rule IDs | **Removed.** `applied-to-section.tsx` deleted from `src/components/builder/`; still exists at `src/components/v1/builder/applied-to-section.tsx` | The `appliedTo: string[]` field in `FormConfig` is **kept** in [src/lib/types.ts](src/lib/types.ts) so v1 keeps working; v2 just never reads/writes it |
| `FormCard` body | Renders "Aktiv bei" badges via `formatRuleId` from `lib/trigger-options` | Block stripped + `formatRuleId` import removed | v2 doesn't depend on `trigger-options.ts`; v1 still does |
| `BlockCardBuilder` (`section-card.tsx`) initial state | `useState(false)` → collapsed by default; expanded body = list of muted boxes with field label/description | `useState(true)` → expanded by default; expanded body = `<BlockSummaryPreview block={block} />` | Title/description duplication avoided by hiding section-card's own h3+description while expanded (BlockSummaryPreview brings its own) |
| Inline preview components | none | New: [src/components/field-data-hint.tsx](src/components/field-data-hint.tsx), [src/components/block-summary-preview.tsx](src/components/block-summary-preview.tsx) | Reusable; non-interactive; document fields render filename as link to `field.documentUrl` (`target="_blank"`) |
| `DashboardContent` | Static grids, no filtering | `'use client'` with search + filter + sort state per tab; uses `<ListControls>` | Karl (moderator) default sort = `myOrgFirst` (his `subOrg` group pinned to top); Andrea (admin) default = `updatedDesc` |
| List controls | none | New: [src/components/list-controls.tsx](src/components/list-controls.tsx) (search input + N filter Selects + sort Select); pure props-driven | Forms get author + org filters; blocks get author filter only (blocks are global, no org field) |
| Default sort options | n/a | Forms: `updatedDesc`, `organization`, plus `myOrgFirst` for moderators. Blocks: `updatedDesc`, `updatedAsc` | `myOrgFirst` matches `f.organizationName === currentUser.subOrg` |
| Trigger code paths (`lib/trigger-options.ts`, `formatRuleId`, `RULE_*`, `TRIGGER_OPTIONS`) | Used by `<AppliedToSection>` and `<FormCard>` | **Unused** by v2. Kept in `lib/` because v1 still imports them | Don't delete the lib file |

### What stayed the same (shared)

- `src/lib/types.ts`, `src/lib/users.ts`, `src/lib/store-*.ts`, `src/lib/resolve-blocks.ts`, `src/lib/build-steps.ts`, `src/lib/validation.ts`, `src/lib/formatting.ts`, `src/lib/use-block-field-mutations.ts`, `src/lib/use-undo-redo.ts`, `src/lib/use-file-upload.ts`, `src/lib/predefined-fields.ts`, `src/lib/block-icon.ts`.
- All API routes under `src/app/api/`.
- `data/` JSON files.
- The seeded users (Andrea, Karl) and permission helpers.

## Core architecture: blocks, not sections

The model went through one major refactor: **forms used to contain sections directly; now forms reference reusable blocks**. Don't reintroduce the old shape.

- `Block` — a reusable, named bundle of fields, owned by a user. Lives in `blocks.json`.
- `FormConfig` — references blocks via `blockRefs: { blockId, order, required? }`. The `required` on a `BlockRef` overrides the block's default. Forms don't own fields directly.
- `ResolvedBlock` — `Block` + `effectiveRequired`, materialized at render time via `lib/resolve-blocks.ts`.
- Two cards on the dashboard: `FormCard` (form + which blocks it uses; **v1 also shows applied-to triggers**) and `BlockCard` (block + which forms use it). They are siblings in `dashboard-content.tsx`, switched by tabs.

Legacy `FormSection` / `predefined-fields` types are commented out, not deleted, in [src/lib/types.ts](src/lib/types.ts) and [src/lib/predefined-fields.ts](src/lib/predefined-fields.ts). Leave them commented; do not revive.

## Permissions model (deliberately tiny)

`lib/users.ts` is the whole auth layer. Two roles: `admin`, `moderator`. Two seeded users: Andrea (admin, Abteilung EA), Karl (moderator, Karlstrasse 13). The `UserSwitcher` component exists for demo/prototype switching — don't treat it as login.

Permission helpers (`canEditBlock`, `canDeleteBlock`, `canEditForm`, `canDeleteForm`, `canRemoveBlockFromForm`) all follow: admins can do anything; moderators can only act on what they `createdBy`. Use these helpers; don't inline role checks.

## Triggers / "applied to" / rules — v1 only

`appliedTo: string[]` on `FormConfig` and the whole `lib/trigger-options.ts` machinery exist for **v1 only** now. v2 does not render or write these. Keep the field + lib intact so v1 keeps working and stored data round-trips.

[src/lib/trigger-options.ts](src/lib/trigger-options.ts) holds two schemas:

1. **Legacy hardcoded trigger IDs** (`join-org`, `shift:ea-montag-vormittag`, …) — still in seed data.
2. **Synthetic rule IDs** of shape `<trigger>:<location>` (e.g. `join:current`) — produced by v1's `AppliedToSection` rule UI in [src/components/v1/builder/applied-to-section.tsx](src/components/v1/builder/applied-to-section.tsx).

`formatRuleId` resolves both shapes plus an unrecognized fallback. Keep that contract — both forms can appear in stored data simultaneously.

## Fields

`FieldType` is a closed union in [types.ts](src/lib/types.ts). Validation lives in [src/lib/validation.ts](src/lib/validation.ts) with regex/age checks per type. When adding a field type, update both `FieldType`, `FIELD_TYPE_LABELS` in `predefined-fields.ts`, the validator, and the renderer in `components/form/field-renderer.tsx`.

`document-acknowledgement` and `checkbox` validate truthy boolean; `multichoice` validates non-empty array; everything else validates non-empty trimmed string.

## Storage layer convention

Each store (`store-blocks.ts`, `store-configs.ts`, `store-submissions.ts`) follows the same pattern:
- File-based JSON read/write with seed-on-ENOENT.
- A serial `runExclusive` chain to prevent concurrent writes.
- `createdBy` / `createdAt` are immutable on update.
- IDs: blocks use `block-<8 hex>`; forms use full `randomUUID()`; slugs are derived from name with collision suffix.

If you add a store, mirror this shape exactly. Don't add a database — this is intentional.

## API routes

Thin REST wrappers under `src/app/api/`. `/api/blocks`, `/api/forms`, `/api/submissions`, plus `[id]`/`[slug]` for individual ops, `/api/uploads` for the document-acknowledgement file storage, `/api/user` for the cookie switcher.

## UI conventions worth remembering

- Cards use `flex flex-col` with `flex-1` content area so the action row sticks to the bottom regardless of card body size.
- Action rows: primary action `flex-1`, icon-only buttons `size-10 shrink-0`. Delete is always last and uses `text-muted-foreground hover:text-destructive`.
- Disabled-but-asChild Buttons: when a Button wraps a `Link` conditionally on permission, branch the `asChild` prop and the children — don't pass a disabled `Link`. See `FormCard` "Ändern" button for the pattern.
- Confirmation dialogs use `Dialog` (not AlertDialog) with a destructive Button. Spinner-text pattern: `{deleting ? 'Wird gelöscht...' : 'Löschen'}`.
- Toasts via `sonner` (`toast.success` / `toast.error`).
- `router.refresh()` after mutations in client components — server components re-read the JSON.
- Date format: always `de-DE` `dd.mm.yyyy`.

## Working style the user prefers

Calibrated from this project's iteration:

- **Small, surgical changes.** Many commits are 1–3 line UI fixes ("delete border", "fix umlaut", "spacings"). Don't refactor adjacent code unless asked.
- **No speculative abstraction.** The legacy `predefined-fields` machinery was ripped out when blocks made it redundant — that direction (delete unused things) is welcomed.
- **Prototype rules apply.** No tests, no error handling for impossible cases, no migrations. Edit the JSON shape and update seed data; existing files in `data/` are dev-only.
- **Visible result first.** UI changes should be testable in the running dev server (`bun --bun next dev --port 3002`).

## Things I (Claude) got wrong before, so flag them

- Reintroducing `FormSection` because the commented code looked usable. Don't.
- Forgetting that `BlockRef.required` is an override, not the source of truth — the resolver merges it with the block's default.
- Treating `appliedTo` as legacy-trigger-only and breaking the synthetic `<trigger>:<location>` form.
- Writing English copy by reflex. The product is German.
- Editing a v2 file and forgetting that the same surface still exists under `src/components/v1/` (e.g. removing a prop type the v1 copy still references). Search both paths when changing shared types or shared lib helpers.
- Deleting `lib/trigger-options.ts` or `FormConfig.appliedTo` because v2 doesn't use them. v1 still does.

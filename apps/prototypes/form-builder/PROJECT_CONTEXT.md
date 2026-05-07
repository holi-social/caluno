# Form Builder — Working Context

Context for Claude when working on this prototype. Read before making changes.

## What this is

A **prototype** inside `apps/prototypes/form-builder` (Next.js 16, React 19, Tailwind v4, `@repo/ui` shadcn-style components, Bun runtime, port 3002). It is a self-contained sandbox to validate UX for a volunteer-org form-builder feature. It is **not** production: data lives in JSON files under `data/` (`blocks.json`, `form-configs.json`, `submissions.json`, `uploads/`), not a database. Auth is a cookie + a hardcoded `USERS` list.

The product domain is German (volunteer org, "Ehrenamt"). All user-facing copy is German. Use German umlauts correctly (ä ö ü ß) — past commits had to fix them. Source code identifiers and comments are English.

## Core architecture: blocks, not sections

The model went through one major refactor: **forms used to contain sections directly; now forms reference reusable blocks**. Don't reintroduce the old shape.

- `Block` — a reusable, named bundle of fields, owned by a user. Lives in `blocks.json`.
- `FormConfig` — references blocks via `blockRefs: { blockId, order, required? }`. The `required` on a `BlockRef` overrides the block's default. Forms don't own fields directly.
- `ResolvedBlock` — `Block` + `effectiveRequired`, materialized at render time via `lib/resolve-blocks.ts`.
- Two cards on the dashboard: `FormCard` (form + which blocks it uses + which triggers it's applied to) and `BlockCard` (block + which forms use it). They are siblings in `dashboard-content.tsx`, switched by tabs.

Legacy `FormSection` / `predefined-fields` types are commented out, not deleted, in [src/lib/types.ts](src/lib/types.ts) and [src/lib/predefined-fields.ts](src/lib/predefined-fields.ts). Leave them commented; do not revive.

## Permissions model (deliberately tiny)

`lib/users.ts` is the whole auth layer. Two roles: `admin`, `moderator`. Two seeded users: Andrea (admin, Abteilung EA), Karl (moderator, Karlstrasse 13). The `UserSwitcher` component exists for demo/prototype switching — don't treat it as login.

Permission helpers (`canEditBlock`, `canDeleteBlock`, `canEditForm`, `canDeleteForm`, `canRemoveBlockFromForm`) all follow: admins can do anything; moderators can only act on what they `createdBy`. Use these helpers; don't inline role checks.

## Triggers / "applied to" / rules

Forms have an `appliedTo: string[]` of trigger IDs that say where the form fires (org join, specific shifts). [src/lib/trigger-options.ts](src/lib/trigger-options.ts) holds two schemas:

1. **Legacy hardcoded trigger IDs** (`join-org`, `shift:ea-montag-vormittag`, …) — still in seed data.
2. **Synthetic rule IDs** of shape `<trigger>:<location>` (e.g. `join:current`) — produced by the builder's `AppliedToSection` rule UI in `builder-layout.tsx`.

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

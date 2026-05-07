# Form Builder — Working Context

Context for Claude when working on this prototype. Read before making changes.

## Repo conventions (read first)

Canonical patterns for this monorepo live in [../../frontend/CLAUDE.md](../../frontend/CLAUDE.md) and the code under [apps/frontend/src/](../../frontend/src/). Read that before introducing new architectural shapes here. Highlights:

- **Domain layout** — `src/domain/<entity>/{actions.ts, schemas.ts, components/, forms/}`. This prototype does **not** follow that (flat `components/` + `lib/` + `app/api/*`); deliberate prototype shortcut, not a pattern to spread.
- **Forms** — `react-hook-form` + `zodResolver`. Outer `<EntityForm>` owns submit / `useTransition` / `serverError`; inner `<FormContent>` takes `formReturnValues: UseFormReturn<T>`. The prototype uses raw `useState` + `fetch` instead — also a shortcut.
- **Mutations** — server actions via `next-safe-action` (`actionClient.inputSchema(...).action(...)`), not REST. Standard flow: `useTransition` + local `serverError` + `router.refresh()` on success.
- **Confirmations** — `AlertDialog` with destructive `AlertDialogAction`, **not** `Dialog`. The prototype currently uses `Dialog` for confirms — that's a divergence to fix when extracting.
- **Sheet/dialog wrappers** — accept a `trigger?: ReactNode` slot for caller-supplied buttons.
- **Permissions** — wrap gated UI in `<RequirePermission permission=... />` (frontend) rather than inlining role checks. Prototype's `canEditX` helpers are a deliberate prototype shortcut.
- **UI primitives** — `@repo/ui` only, generated via `bunx --bun shadcn@latest add <name>`. Don't hand-roll.
- **Formatting** — `apps/frontend/src/lib/formatting.ts` already has `formatDateTime`, `formatDate`, `formatTime`, `formatRange`. Match that filename (`formatting.ts`, not `format.ts`) and locale-default behavior when adding the equivalent here.

## What this is

A **prototype** inside `apps/prototypes/form-builder` (Next.js 16, React 19, Tailwind v4, `@repo/ui`, Bun, port 3002). Self-contained sandbox to validate UX for a volunteer-org form-builder. **Not** production: data lives in JSON files under `data/` (`blocks.json`, `form-configs.json`, `submissions.json`, `uploads/`), not a database. Auth is a cookie + a hardcoded `USERS` list.

Product domain is German ("Ehrenamt"). All user-facing copy is German with proper umlauts (ä ö ü ß) — past commits had to fix them. Source code identifiers and comments are English.

## Core architecture: blocks, not sections

The model went through one major refactor: forms used to contain sections directly; now forms reference reusable blocks. Don't reintroduce the old shape.

- `Block` — a reusable, named bundle of fields, owned by a user. Lives in `blocks.json`.
- `FormConfig` — references blocks via `blockRefs: { blockId, order, required? }`. The `required` on a `BlockRef` overrides the block's default. Forms don't own fields directly.
- `ResolvedBlock` — `Block` + `effectiveRequired`, materialized at render time via `lib/resolve-blocks.ts`.
- Two cards on the dashboard: `FormCard` and `BlockCard`, switched by tabs in `dashboard-content.tsx`.

Legacy `FormSection` / `predefined-fields` types are commented out, not deleted, in [src/lib/types.ts](src/lib/types.ts) and [src/lib/predefined-fields.ts](src/lib/predefined-fields.ts). Leave them commented; do not revive.

## Permissions model (deliberately tiny)

`lib/users.ts` is the whole auth layer. Two roles: `admin`, `moderator`. Two seeded users: Andrea (admin, Abteilung EA), Karl (moderator, Karlstrasse 13). The `UserSwitcher` is a demo affordance — not login.

Helpers (`canEditBlock`, `canDeleteBlock`, `canEditForm`, `canDeleteForm`, `canRemoveBlockFromForm`): admins can do anything; moderators can only act on what they `createdBy`. Use these helpers; don't inline role checks.

## Triggers / "applied to" / rules

[src/lib/trigger-options.ts](src/lib/trigger-options.ts) holds two schemas, both must keep working:

1. **Legacy hardcoded trigger IDs** (`join-org`, `shift:ea-montag-vormittag`, …) — still in seed data.
2. **Synthetic rule IDs** of shape `<trigger>:<location>` (e.g. `join:current`) — produced by the builder's rule UI.

`formatRuleId` resolves both shapes plus an unrecognized fallback.

## Fields

`FieldType` is a closed union in [types.ts](src/lib/types.ts). Validation in [src/lib/validation.ts](src/lib/validation.ts). When adding a field type, update `FieldType`, `FIELD_TYPE_LABELS`, the validator, and `components/form/field-renderer.tsx`.

`document-acknowledgement` and `checkbox` validate truthy boolean; `multichoice` validates non-empty array; everything else validates non-empty trimmed string.

## Storage layer convention

Each store (`store-blocks.ts`, `store-configs.ts`, `store-submissions.ts`) follows the same pattern:
- File-based JSON read/write with seed-on-ENOENT.
- A serial `runExclusive` chain to prevent concurrent writes.
- `createdBy` / `createdAt` immutable on update.
- IDs: blocks `block-<8 hex>`; forms full `randomUUID()`; slugs from name + collision suffix.

Mirror this shape for new stores. **Don't add a database** — intentional.

## API routes

Thin REST wrappers under `src/app/api/`. Diverges from the frontend's server-actions convention; acceptable here because the prototype's data layer is JSON files.

## UI conventions worth remembering

- Cards: `flex flex-col` with `flex-1` content area so the action row sticks to the bottom.
- Action rows: primary `flex-1`, icon-only `size-10 shrink-0`. Delete is last and uses `text-muted-foreground hover:text-destructive`.
- Disabled-but-asChild Buttons: branch the `asChild` prop and children rather than passing a disabled `Link`. See `FormCard` "Ändern".
- Toasts via `sonner` (`toast.success` / `toast.error`).
- `router.refresh()` after mutations so server components re-read the JSON.
- Date format in user copy: `de-DE` `dd.mm.yyyy`.

## Things I (Claude) got wrong before

- Reintroducing `FormSection` because the commented code looked usable. Don't.
- Forgetting `BlockRef.required` is an override, not the source of truth — the resolver merges it with the block default.
- Treating `appliedTo` as legacy-trigger-only and breaking the synthetic `<trigger>:<location>` form.
- Writing English copy by reflex. Product is German.
- Assuming the prototype's prevailing patterns (Dialog for confirms, raw `fetch`, REST routes) are the repo's convention. They are local shortcuts; the rest of the repo uses AlertDialog / RHF+Zod / next-safe-action.

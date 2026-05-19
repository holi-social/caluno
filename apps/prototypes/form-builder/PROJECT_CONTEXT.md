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
| `BlockCardBuilder` (`section-card.tsx`) initial state | `useState(false)` → collapsed by default; expanded body = list of muted boxes with field label/description. Has a Pflicht/Optional Switch | `useState(true)` → expanded by default; title + description always at top; expanded body swaps in `<BlockSummaryPreview>`. **No Pflicht toggle.** Drops `blockRef` and `onToggleRequired` props | See "v2 evolutions" for the layout-symmetry + Pflicht-removal details |
| Inline preview components | none | New: [src/components/field-data-hint.tsx](src/components/field-data-hint.tsx), [src/components/block-summary-preview.tsx](src/components/block-summary-preview.tsx) | Reusable cards per field with label + description + outline type badge + top-right Pflicht badge; choice fields render option chips; document fields show "Nutzer-Bestätigung" badge + link |
| `DashboardContent` | Static grids, no filtering | `'use client'` with search + filter + sort state per tab; uses `<ListControls>` | Karl (moderator) default sort = `myOrgFirst` (his `subOrg` group pinned to top); Andrea (admin) default = `updatedDesc` |
| List controls | none | New: [src/components/list-controls.tsx](src/components/list-controls.tsx) (search input + N filter Selects + sort Select); pure props-driven | Forms get author + org filters; blocks get author filter only (blocks are global, no org field) |
| Default sort options | n/a | Forms: `updatedDesc`, `organization`, plus `myOrgFirst` for moderators. Blocks: `updatedDesc`, `updatedAsc` | `myOrgFirst` matches `f.organizationName === currentUser.subOrg` |
| Trigger code paths (`lib/trigger-options.ts`, `formatRuleId`, `RULE_*`, `TRIGGER_OPTIONS`) | Used by `<AppliedToSection>` and `<FormCard>` | **Unused** by v2. Kept in `lib/` because v1 still imports them | Don't delete the lib file |

### What stayed the same (shared)

- `src/lib/types.ts`, `src/lib/users.ts`, `src/lib/store-*.ts`, `src/lib/resolve-blocks.ts`, `src/lib/build-steps.ts`, `src/lib/validation.ts`, `src/lib/formatting.ts`, `src/lib/use-block-field-mutations.ts`, `src/lib/use-undo-redo.ts`, `src/lib/use-file-upload.ts`, `src/lib/predefined-fields.ts`, `src/lib/block-icon.ts`.
- All API routes under `src/app/api/`.
- `data/` JSON files.
- The seeded users (Andrea, Karl) and permission helpers.

## v2 evolutions since the split

These build on the v1 vs v2 baseline above. v1 is untouched.

- **Block-level Pflicht toggle removed** ([section-card.tsx](src/components/builder/section-card.tsx)). The `Switch` UI, the `onToggleRequired` prop, and the unused `blockRef` prop are gone; `handleToggleBlockRequired` deleted from builder-layout. `BlockRef.required` and `lib/resolve-blocks.ts` are left intact — only the UI was removed because the cascade onto fields wasn't visible to users.
- **Section-card layout symmetry**. Title + description now render at the top in **both** collapsed and expanded states. Collapsed shows `FieldBadge` chips; expanded swaps in `<BlockSummaryPreview>` and a "Block entfernen" button.
- **Inline preview redesign** ([block-summary-preview.tsx](src/components/block-summary-preview.tsx), [field-data-hint.tsx](src/components/field-data-hint.tsx)). Each field is a shadow-less `Card` (`bg-muted/40 border-none`) with label, optional description, and `<FieldDataHint>`. A `Pflicht` secondary badge sits top-right when `field.required`. `FieldDataHint`: outline type-label badge by default; option chips for `singlechoice`/`multichoice`/`select` with options; "Nutzer-Bestätigung" badge + document link for `document-acknowledgement`.
- **EditBlockSheet "Verwendet in" panel** ([edit-block-sheet.tsx](src/components/builder/edit-block-sheet.tsx)). New optional `forms?: FormConfig[]` prop. When provided, the warning header (`AlertTriangle` box) shows a list of forms that reference this block, nested inside the warning's right column. `BlockCard` passes `forms`; `BuilderLayout` doesn't (it doesn't have the full form list).
- **DraggableFieldRow click-to-edit** ([draggable-field-row.tsx](src/components/builder/draggable-field-row.tsx)). The label + type badge + description area is wrapped in a single `<button onClick={onEdit}>` with `hover:bg-muted/60`. Inner flex is `items-stretch` and the button uses `-my-2 py-2`, so the click region stretches to whichever sibling is taller and sits 4px from the row's top/bottom borders regardless of content height. `gap-2` (8px) preserved between the click area and the Pflichtig/Optional column.
- **AddBlockDialog gets `<ListControls>`** ([add-section-dialog.tsx](src/components/builder/add-section-dialog.tsx)). Search by title + author filter, no sort dropdown. Default order is `updatedAt` desc.
- **`ListControls` extensions** ([list-controls.tsx](src/components/list-controls.tsx)):
  - `sort` is now **optional**. Pass nothing to hide the sort `Select` entirely.
  - New `searchSuggestions?: string[]` prop. When set, the input becomes a styled, keyboard-accessible combobox: ↓/↑ navigate (wrap), Home/End jump, Enter picks, Esc closes; ARIA-wired (`role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`); items are `role="option"` and auto-`scrollIntoView({ block: 'nearest' })`. Mouse hover and keyboard share `activeIndex` state. AddBlockDialog passes `availableBlocks.map(b => b.title)`.
  - The `searchSuggestions` flow uses `onMouseDown` + `e.preventDefault()` on suggestion buttons so the input doesn't blur before the click commits — important detail if you add another popover-style child here.
  - Optional `trailing?: ReactNode` slot exists for callers to inject a right-aligned element into the controls row. Currently no caller in v2 uses it (the dashboard moved the create button up to the tabs row), but the prop is kept for future use.
- **Dashboard tab row** ([dashboard-content.tsx](src/components/dashboard-content.tsx)). Three-column grid `[empty | centered TabsList | right-aligned create button]`. The `TabsList` uses `h-12!` (important — the variant bakes `group-data-[orientation=horizontal]/tabs:h-9` into the class, which has higher specificity than a plain `h-12`; tailwind-merge can't dedupe across the conditional selector, so the bang is required to win). Triggers are sized like `size="lg"` Buttons: `rounded-xl px-9 text-base`. `TabsContent` sits at `mt-8` below the row.
- **Context-aware create button** (same file). One button on the right of the tab row, label flips on the active tab: "Formular erstellen" / "Block erstellen". Behaviour:
  - Formulare + admin (`canCreateFormFromScratch`, see permissions): click opens a `Popover` with two items — "Neues Formular" (`mode='create'`) and "Formular kopieren" (`mode='copy'`). Both items open the same `CreateFormDialog` in the chosen mode.
  - Formulare + moderator: click skips the menu and opens `CreateFormDialog` in `mode='copy'` directly.
  - Blöcke: click opens `CreateBlockSheet` directly.
- **`CreateFormDialog` is now controlled-only** ([create-form-dialog.tsx](src/components/create-form-dialog.tsx)). Props: `open`, `onOpenChange`, `mode: 'create' | 'copy'`, `existingForms`. No internal trigger, no `currentUser` prop — the parent picks the mode (which absorbs the moderator-forced-copy rule that used to live inside the dialog). State resets on every `open` flip.
- **New permission helper** `canCreateFormFromScratch(user)` in [lib/users.ts](src/lib/users.ts) — admin only. Used by `DashboardContent` to decide whether to render the create-form Popover or skip to copy.
- **Volunteer-side `singlechoice` renders as a dropdown** ([form/field-renderer.tsx](src/components/form/field-renderer.tsx)). Single-choice and `select` fields now share one render branch using shadcn `Select`; `RadioGroup` / `RadioGroupItem` imports dropped. Builder/preview is unchanged — choice fields still show as option chips inside `FieldDataHint`.
- **Per-field `required` is now the source of truth on the volunteer form** ([form/form-step.tsx](src/components/form/form-step.tsx), [form/multi-step-form.tsx](src/components/form/multi-step-form.tsx)). Both files used to override `field.required` with `block.effectiveRequired` (a v1-era cascade from the now-removed block-level Pflicht Switch). That override silently made every field mandatory regardless of the builder toggle — fixed by reading `field.required` directly in the renderer and in `validateCurrentStep`. v1's copies still cascade.
- **Single round-trip on field/block-meta save in the builder** ([builder/builder-layout.tsx](src/components/builder/builder-layout.tsx)). The old flow PUT-then-`GET /api/blocks`-then-`setBlocks` — two trips through the file-store's serial `runExclusive` queue per click. New `applyBlockUpdate(updated)` callback splices the PUT response into local state directly. `refreshBlocks` still exists for the only path that needs it: after `CreateBlockSheet` creates a brand-new block whose id wasn't in `blocks` yet.
- **Custom-field picker pruned + `static-text` added** ([lib/predefined-fields.ts](src/lib/predefined-fields.ts), [lib/types.ts](src/lib/types.ts)). System-bound types (`vorname`, `nachname`, `email`, `phone`, `plz`, `iban`, `password`, `checkbox`, `select`) reach blocks via the system-field flow and are excluded from `FIELD_TYPE_OPTIONS`; the union itself still carries them so existing data + system requirements keep working. Picker order: free-text inputs → typed value → selection → special. `singlechoice` is relabeled **Dropdown** (same render). New `static-text` ("Hinweistext") type — no user input, renders volunteer-side as `<p className="text-foreground text-lg whitespace-pre-line">`; builder's `FieldForm` swaps "Feldname" for a "Text" `Textarea` and hides description; required toggle is hidden in `DraggableFieldRow`; validation skips it. Display label across badges goes through `getFieldDisplayLabel(field)` in `predefined-fields.ts` ("Hinweistext" for static-text, `field.label` otherwise) — used by `BlockCard`, `FieldBadge`, `AddBlockDialog`, and the "Block entfernen?" `ConfirmDialog` so the static-text content never leaks into chip previews.

- **DraggableFieldRow content layout** ([draggable-field-row.tsx](src/components/builder/draggable-field-row.tsx)). The inline row content is now three vertical blocks: (1) title (with leading `UserCircle2` icon for system fields), (2) optional description at `mt-0.5` so it reads as one unit with the title, (3) tags row (type badge + Profilfeld badge) at `mt-2`. Replaces the previous single flex-wrap row that bunched title/badges/description together; the change came from user testing — chips at the end scan faster than title + chips mixed.

- **"Profilfeld" replaces "Systemfeld"** ([draggable-field-row.tsx](src/components/builder/draggable-field-row.tsx), [field-data-hint.tsx](src/components/field-data-hint.tsx)). The badge text is now "Profilfeld" with a hover tooltip: *"Wird im Profil der Freiwilligen gespeichert und kann in anderen Formularen und Einrichtungen wiederverwendet werden."* Other "Systemfeld(er)" copy elsewhere (the disabled-required tooltip on `DraggableFieldRow`, "Alle Systemfelder sind hinzugefügt" in `EditBlockSheet`) still uses the old word — sweep when convenient.

- **EditBlockSheet add-field affordances** ([edit-block-sheet.tsx](src/components/builder/edit-block-sheet.tsx)). The "Eigenes Feld erstellen" button moved off the heading row. Two buttons — **Freies Feld erstellen** (Plus icon) and **Dokument hinzufügen** (FileText icon) — now live inside the empty-state dashed container (centred under the "Noch keine Felder..." text) and below the last field when fields exist. State machine is `addType: 'custom' | 'document' | null`; "Dokument hinzufügen" passes `lockedType='document-acknowledgement'` to `FieldForm`. The heading is just `Felder (N)` — no more inline button.

- **Type is creation-only** ([field-form.tsx](src/components/builder/field-form.tsx)). Editing an existing field hides the Feldtyp `Select` entirely. The rule is `hideTypePicker = isLocked || !!lockedType || isEdit` — system fields (`lockType`), document-add (`lockedType`), and edit (`isEdit`) all suppress the picker. Reason: changing type would invalidate the stored value shape and per-type extras (options, document upload). If a field needs a different type, delete and recreate.

- **"Verwendet in" alert gated on real usage** ([edit-block-sheet.tsx](src/components/builder/edit-block-sheet.tsx)). The `AlertTriangle` warning box at the top of the sheet renders only when `usedInForms.length > 0`. Library blocks (not referenced by any form) get a clean alert-free header — the warning was noise when there was nothing to warn about.

- **Andrea pre-seeded with profile entries** ([store-user-profiles.ts](src/lib/store-user-profiles.ts), [data/user-profiles.json](data/user-profiles.json)). Both the seed function and the live JSON now ship Andrea with `vorname / nachname / email` at sub-org "Abteilung EA" alongside Karl's `geburtsdatum`. Lets state 2 (hidden) and state 3 (prefilled) be exercised side-by-side without manual setup.

- **Inline-edit UX upgrade** ([field-form.tsx](src/components/builder/field-form.tsx), [edit-block-sheet.tsx](src/components/builder/edit-block-sheet.tsx)). Three coordinated behaviours so creating/editing a field needs zero unnecessary clicks:
  - **Auto-open type picker.** `defaultOpen={autoOpenTypeSelect}` on the shadcn `Select` — fires only on a brand-new custom field (no `initial`, no `lockedType`). The first interaction is "pick a type", no preliminary click.
  - **Focus chain.** `useEffect([fieldType])` moves focus to the Feldname `Input` as soon as a type is picked. After a document upload, `handleUploadedFile` derives a label from the filename (`deriveLabelFromFilename` strips the extension, replaces `_`/`-` with spaces, capitalises the first char), prefills `label` only if it was empty, then focuses + `select()`s the input so one keystroke replaces the suggestion.
  - **Blur-commit + Abbrechen wins.** An `onBlur` on the form root commits when focus leaves the form. Two guards: `cancellingRef` set by the Abbrechen button's `onMouseDown` (mousedown fires before blur, so the flag is set in time) — explicit cancel always wins; and `committedRef` so the same field can't double-commit when blur and a global Save click arrive in the same tick. The "no-op on empty form" guard avoids erroring out when a user opens then immediately abandons an add.
  - **Scroll-to-error on global Save.** `FieldCommitHandle` gained `scrollToError()` (smooth `scrollIntoView` on the form root). The sheet's Save handler calls it after a failed `commit()` so the user lands on the offending field with its inline error visible instead of hunting for it.

  Underlying UX rules (worth carrying into the real product): eliminate dead clicks; focus follows commitment; implicit save beats explicit save; errors come to the user, not the user to errors; autofilled values are pre-selected so a single keystroke replaces them.

## System Requirement fields

A second class of field alongside the custom fields the org defines. The platform owns the type / validation / required-flag; the org can only edit label + description per block. The value lives on the **volunteer's profile**, keyed by `systemKey`, tagged with the sub-org where it was last filled — so the answer round-trips across forms and sub-orgs without going into submission records.

### Registry & types

- `FormField.systemKey?: string` discriminator (added to [src/lib/types.ts](src/lib/types.ts)).
- [src/lib/system-requirements.ts](src/lib/system-requirements.ts) — `SYSTEM_REQUIREMENTS` registry, `createSystemRequirementField(key)` factory, `isSystemRequirement(field)` guard, `getSystemRequirementPreset(field)`, `getSystemRequirementKeysInUse(fields)`. Ten entries today:

  | Key | Label | FieldType | `defaultRequired` | `requiredEditable` |
  |---|---|---|---|---|
  | `nachname` | Nachname | `nachname` | true | false |
  | `vorname` | Vorname | `vorname` | true | false |
  | `bevorzugter-name` | Bevorzugter Name | `vorname` | false | false |
  | `geschlecht` | Geschlecht | `singlechoice` (Weiblich / Männlich / Divers) | false | true |
  | `email` | E-Mail | `email` | true | false |
  | `telefonnummer` | Telefonnummer | `phone` | false | true |
  | `adresse` | Adresse | `text` | true | true |
  | `plz` | PLZ | `plz` | true | true |
  | `stadt` | Stadt | `text` | true | true |
  | `geburtsdatum` | Geburtsdatum | `date` | true | false |

- **Required-flag policy is two-dimensional** (not just a single boolean): `defaultRequired` seeds `field.required` at creation; `requiredEditable` decides whether the org can flip the Switch later. The factory bakes `defaultRequired` into the field at creation, and the row reads `requiredEditable` from the registry at render time to choose between the live Switch and a disabled+tooltip variant. Generic tooltip copy: *"Diese Einstellung ist durch das Systemfeld vorgegeben."* (works for both always-required and always-optional cases).
- `FormField.lockType: true` is honored — wired in `FieldForm` (was defined-but-unread before this work).

### Profile storage

- [src/lib/store-user-profiles.ts](src/lib/store-user-profiles.ts) — file-based, `runExclusive`, seed-on-ENOENT; mirrors `store-blocks.ts`. Shape: `Record<userId, { userId, entries: Partial<Record<SystemRequirementKey, { value, subOrg, updatedAt }>> }>`. Seeds Karl with `geburtsdatum = '1980-05-12'` (subOrg `Karlstrasse 13`); Andrea has no entry.
- [src/app/api/user-profile/route.ts](src/app/api/user-profile/route.ts) — GET reads cookie + returns profile, POST upserts entries. `getVolunteerId()` helper at the top of the file is the **single production-swap point**: replace the `USER_COOKIE` read with real auth here when the prototype graduates.

### Builder UI

- `EditBlockSheet` got a new subsection **"Systemfelder auswählen"** below the regular field list. Lists `SYSTEM_REQUIREMENT_LIST` entries not yet in this block as `<AvailableSystemFieldCard>`s; click → factory inserts into the block and the card disappears from the available list.
- The original "+ Feld" button was renamed to **"Eigenes Feld erstellen"** to contrast against system fields.
- Used system fields render with `bg-accent/40`, a leading `UserCircle2`, and a secondary `Systemfeld` badge inside `DraggableFieldRow`. The Pflichtig Switch is locked (disabled) **only when `requiredEditable === false`** — for editable presets (Geschlecht, Telefonnummer, Adresse, PLZ, Stadt) the Switch behaves like a normal field's.
- `FieldDataHint` prepends a `Systemfeld` Badge inline (flex flex-wrap gap-2) before the type cue, so the BlockSummaryPreview reads consistently with the EditBlockSheet row.
- `FieldForm` with `lockType: true` **drops the type Select entirely** (was previously a disabled Select) and shows an `Alert` at the bottom of the form (not above — see pitfalls) explaining where the data lands, with the preset's canonical name bolded. It also **hides the `OptionsEditor`** (registry owns options); commit spreads `initial.options` so the registry's choices survive a label/description edit.
- `EditBlockSheet` takes optional `forms?: FormConfig[]` to render a "Verwendet in" list inside the warning header. `BuilderLayout` now fetches `listFormConfigs()` at the page level and passes them through, so block editing has the same affordance from the builder AND from the blocks list.

### Volunteer rendering (3 states)

`MultiStepForm` derives a state per field that has `systemKey`. The rule is computed **once per render** into a `fieldStateMap: Map<fieldId, FieldState>`; `visibleBlocks`, the prefill effect, and `profilePrefilledFieldIds` all read from this map (don't reintroduce per-call `deriveFieldState` lookups).

1. **`empty`** — no profile entry → render normal empty input via `FieldRenderer`.
2. **`hidden`** — profile has entry on the same sub-org → skip entirely (filtered from `resolvedBlocks` before `buildDisplaySteps`, so validation + step nav never see it).
3. **`profile-prefilled`** — profile has entry on a different sub-org → renders `<ProfileFieldDisplay>` (a `bg-secondary` card showing the value at `text-lg` with subtitle "Daten aus meinem Profil mit „{formOrg}" teilen:" and a top-right pencil button). The `<SystemFieldBanner>` from the first cut is **gone** — title/description live above the card, never as a leading banner.

**Per-field edit toggle (state 3 only).** Click the pencil → `handleStartEdit` snapshots `formData[fieldId]` into `editSnapshots` and adds the id to `editingFieldIds`. The card swaps to `bg-card border-primary` and renders `<FieldRenderer hideLabel>` (see Fields below) inside a flex row, with the check button inline at the right end and the original top-right slot replaced by an `Undo2` (back) icon.
- **Confirm** (`Check`) — exits edit mode and fires `POST /api/user-profile` with `{ key, value, subOrg: formOrg }` so the change persists immediately. The display card re-renders from `formData` showing the new value.
- **Cancel** (`Undo2`) — restores `formData[fieldId]` from the snapshot, drops the snapshot, exits edit mode. Repeated confirm→edit→cancel reverts to the most recent confirmed value, not the pristine profile value, because snapshots capture whatever was visible at edit-start.

Label + description are rendered **outside** the card in both display and edit modes so they don't jump when toggling. `FormStep` separates fields with `space-y-8` (groups internally use `space-y-2`).

On submit, `formData` is split via `Promise.all`:
- Regular fields → `/api/submissions` (existing route).
- System req fields with a value → `/api/user-profile` (upserts with current sub-org).

System req values **never** appear in submission records. If neither path has work, the corresponding POST is skipped.

**Files:** [form/multi-step-form.tsx](src/components/form/multi-step-form.tsx) (state + handlers + map), [form/form-step.tsx](src/components/form/form-step.tsx) (3-way dispatch), [form/profile-field-display.tsx](src/components/form/profile-field-display.tsx) (state-3 card), [form/field-renderer.tsx](src/components/form/field-renderer.tsx) (`hideLabel` prop used by edit mode).

### Seed data

- `data/blocks.json` — the existing `f-dob` date field in "Persönliche Daten" was converted into the Geburtsdatum system requirement (`systemKey: 'geburtsdatum'`, `lockType: true`).
- `data/user-profiles.json` does not exist on disk by default; it self-seeds (see `seedProfiles` in [store-user-profiles.ts](src/lib/store-user-profiles.ts)) with Karl's `geburtsdatum` at sub-org `Karlstrasse 13` plus Andrea's `vorname / nachname / email` at sub-org `Abteilung EA`. Andrea has no `geburtsdatum` in the seed — useful for exercising state 1 on her side while state 2/3 hit on the other three.

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

`FieldType` is a closed union in [types.ts](src/lib/types.ts). Validation lives in [src/lib/validation.ts](src/lib/validation.ts) with regex/age checks per type. When adding a field type, update `FieldType`, `FIELD_TYPE_LABELS` in `predefined-fields.ts`, `FIELD_TYPE_OPTIONS` (the builder picker — see the v2 evolutions note about what's intentionally excluded), the validator, and the renderer in `components/form/field-renderer.tsx`.

`FieldRenderer` accepts an optional `hideLabel` prop: when set, `FieldLabel` + `FieldDescription` are skipped so the caller can render its own title above whatever container wraps the control. Used by the state-3 edit card; **don't fork a second input renderer** for that case — extend `FieldRenderer` instead.

`document-acknowledgement` and `checkbox` validate truthy boolean; `multichoice` validates non-empty array; `static-text` is skipped entirely; everything else validates non-empty trimmed string.

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
- Confirmation dialogs go through `<ConfirmDialog>` ([src/components/confirm-dialog.tsx](src/components/confirm-dialog.tsx)), which wraps `AlertDialog` with a destructive `AlertDialogAction`, optional `trigger` slot, and optional `children` for extra body content. Spinner-text pattern: `{pending ? pendingLabel : confirmLabel}`. v1's copy still uses `Dialog`-based confirms — leave it.
- Toasts via `sonner` (`toast.success` / `toast.error`).
- `router.refresh()` after mutations in client components — server components re-read the JSON.
- Date format: always `de-DE` `dd.mm.yyyy`.
- **Heading scale** (calibrated on `EditBlockSheet`):
  - `h2` (SheetTitle) — `text-2xl font-bold` ("Block bearbeiten").
  - `h3` — `text-xl font-semibold` ("Felder (N)").
  - `h4` — `text-lg font-medium` ("Systemfelder auswählen"). Visually lighter than `h3`; weight does the subordination.
  - Inline edit forms (FieldForm-style) **get no heading** — the primary border carries the active signal, surrounding chrome carries the intent.
- **`text-xs` is reserved for decorative + uppercase** (eyebrows like "Verwendet in", "Inhalt"). Body copy, helper text, badges, switch labels all default to `text-sm`. **Never** `text-[10px]` or other arbitrary values.
- **Active-edit affordance** is a 1px `border-primary` on the editing card. Not background tint, not dashed border, not ring overlay. Inactive cards keep the muted `border`.
- **Section subtitle pattern**: heading first, then a one-line `<p className="text-muted-foreground text-sm">` underneath. **Never** lead a section with an Alert/banner — title leads, banner (if any) goes inside the section or at the bottom.
- **Field-row content order**: title (with leading icon if it carries a type cue) → description (`mt-0.5`, coupled) → tag chips (`mt-2`, the only thing on the last row). Title and tag chips never share a flex row — title is the read-target, chips are scannable metadata.
- **Inline-edit autosave (FieldForm-style)**: when an edit surface lives next to other rows, prefer implicit save over an explicit "Hinzufügen/Speichern" button: (a) auto-open the type/picker on first mount; (b) move focus to the next required input as soon as the previous one is satisfied; (c) commit on `onBlur` of the form root when `relatedTarget` is outside the form, with a `cancellingRef` set by the Cancel button's `onMouseDown` so explicit cancel always wins; (d) idempotent commit via a `committedRef` guard so double-fires (blur + global Save in the same tick) don't run `onSubmit` twice; (e) every commit handle exposes `scrollToError()` so a failing global Save scrolls the user back to the broken field. Underlying rules: eliminate dead clicks; focus follows commitment; errors come to the user, not the user to errors; autofilled values are pre-selected so one keystroke replaces them.

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
- Using a native `<datalist>` for input autocomplete. The user rejected the browser-rendered popup; use the styled listbox pattern in `ListControls` (`role="combobox"` + `aria-activedescendant` + `onMouseDown` to commit before blur).
- Hard-coding vertical insets like `-my-2 py-2` on a row child and assuming it'll always be a fixed pixel offset from the wrapper. When the wrapper height is dynamic, set the parent flex to `items-stretch` so the child stretches to the tallest sibling first; the negative-margin trick only behaves consistently then.
- Restoring the block-level `Pflicht` toggle in `section-card`. It was deliberately removed in v2 — the cascade onto fields isn't surfaced and the toggle confused users. `BlockRef.required` stays in types for v1/data compatibility only.
- Sizing a `TabsList` with a plain `h-*` class. The `@repo/ui` variant bakes `group-data-[orientation=horizontal]/tabs:h-9` into the class, which has higher specificity than a bare `h-12`; tailwind-merge can't dedupe across the conditional selector. Use Tailwind v4's important-modifier suffix: `h-12!`.
- Putting an `<Alert>` (or any callout) *above* a section title. The banner steals attention before the user reads what the section is. Title leads; banner (if any) goes inside.
- Adding a heading inside an inline edit form by reflex. When the FieldForm replaces a row in-place, the surrounding context already says "Feld bearbeiten" — a `<h4>` on top is noise. Active border + context wins.
- Reaching for `text-xs` for non-decorative copy. Decorative + uppercase only (eyebrows). Everything else is `text-sm`. Arbitrary values like `text-[10px]` are always wrong.
- `AlertDescription` is a **grid container** (`grid gap-1`) — each direct child becomes its own row. Wrap inline-formatted sentences containing `<strong>` (or any mixed children) in a single `<p>` so the elements stay on one line.
- Forgetting that system-requirement fields don't go into submission records. When touching the submit pipeline, filter on `field.systemKey` before posting to `/api/submissions` — those values belong on `/api/user-profile`.
- Storing system-requirement profile data in `User.subOrg`. That string is the **admin's** sub-org. Profile entries carry their own `subOrg` snapshot from `FormConfig.organizationName` at submit time.
- Trusting `block.effectiveRequired` in the volunteer renderer. It's a v1-era cascade (a "required" block forced every field inside to required) and silently overrides the builder's per-field toggle. Read `field.required` directly in v2's `FormStep` + `validateCurrentStep`. The resolver still emits `effectiveRequired` for v1, but v2 ignores it.
- Discarding the PUT response and immediately doing a GET to "refresh" after a field mutation. The PUT already returns the updated block; splice it into local state via the `onUpdated` callback. Each extra GET goes through `runExclusive` and visibly stalls clicks — felt sharply on rapid actions like adding system fields one after another.
- Treating `SystemRequirementPreset.required` as a single boolean. Two flags: `defaultRequired` (the initial value baked into the field) and `requiredEditable` (whether the org can flip it). Look up `getSystemRequirementPreset(field)` at render time to decide whether the Switch is live or disabled.
- Forking a parallel input renderer for state-3 edit mode. There was briefly a `profile-field-editor.tsx` that re-implemented `FieldRenderer`'s input/Select branches; it drifted from the source within hours. `FieldRenderer` takes a `hideLabel` prop now — use it from any caller that wraps the control in its own titled container.
- Calling `deriveFieldState` in three loops (visibleBlocks filter, prefill effect, prefilled-id Set). Compute it once into `fieldStateMap` and derive the rest from there. Adding a new state-3 consumer? Read the map.
- Letting `static-text`'s `field.label` (which holds the actual paragraph content) flow into chip/badge previews. Every badge that previously displayed `field.label` for a generic field must go through `getFieldDisplayLabel(field)` so static-text reads as "Hinweistext" instead of dumping its body into a card chip.

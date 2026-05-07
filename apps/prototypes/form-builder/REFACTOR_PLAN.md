# Form Builder — Component Refactor Plan

Inline structures that should be extracted, plus a phased plan to do it.

## Findings

### Dead code
1. **`builder/add-field-dialog.tsx`** (356 lines) — `AddFieldDialog` exported but never imported. Superseded by inline `FieldForm` in `edit-block-sheet.tsx`.
2. **`builder/edit-section-dialog.tsx`** (1 line) — empty stub from the section→block refactor.

### Inline components hiding inside larger files
3. **`AppliedToSection`** — 100 lines inside [src/components/builder/builder-layout.tsx:51-150](src/components/builder/builder-layout.tsx#L51-L150). Self-contained rules editor; redefines `TRIGGER_TYPES` / `LOCATIONS` already exported from [src/lib/trigger-options.ts](src/lib/trigger-options.ts) as `RULE_TRIGGER_TYPES` / `RULE_LOCATIONS`.
4. **`FieldForm`** — 280 lines inside [src/components/builder/edit-block-sheet.tsx:61-342](src/components/builder/edit-block-sheet.tsx#L61-L342). Field create/edit form, exposed via imperative handle.
5. **`DraggableFieldRow`** — 100 lines inside [src/components/builder/edit-block-sheet.tsx:625-724](src/components/builder/edit-block-sheet.tsx#L625-L724). List row with drag, type badge, required switch, edit/delete actions.
6. **`CreateBlockButton`** — small helper inside [src/components/dashboard-content.tsx:13-31](src/components/dashboard-content.tsx#L13-L31). Asymmetric with `CreateFormDialog` (its own file).

### Repeated UI patterns
7. **Confirm-delete dialog** — three near-identical copies in [form-card.tsx:168-194](src/components/form-card.tsx#L168-L194), [block-card.tsx:256-296](src/components/block-card.tsx#L256-L296), [section-card.tsx:181-220](src/components/builder/section-card.tsx#L181-L220).
8. **Page header (back-arrow + title)** — duplicated in [submissions/page.tsx](src/app/submissions/page.tsx), [submissions/[formSlug]/page.tsx](src/app/submissions/[formSlug]/page.tsx), partially in `builder-layout.tsx`.
9. **File upload field** — hidden input + uploaded-file pill + `/api/uploads` POST. In both `edit-block-sheet.tsx` and `add-field-dialog.tsx`.
10. **Options editor** (multichoice/singlechoice list of inputs + X + "+ Option") — same two files.
11. **Field-type picker constants** — `FIELD_TYPE_OPTIONS` in `edit-block-sheet.tsx`, `CUSTOM_TYPE_OPTIONS` in `add-field-dialog.tsx`. Belong in `lib/predefined-fields.ts`.
12. **Submission cell formatter** — switch on val type in [submissions/[formSlug]/page.tsx:92-103](src/app/submissions/[formSlug]/page.tsx#L92-L103).
13. **`formatDateTime`** — defined identically in both submissions pages.

### Logic duplication (hooks, not components)
14. **Block field mutations** — `handleAddField` / `handleEditField` / `handleDeleteField` / `handleReorderFields` repeated across [block-card.tsx:71-130](src/components/block-card.tsx#L71-L130) and [builder-layout.tsx:260-312](src/components/builder/builder-layout.tsx#L260-L312). All PUT `/api/blocks/:id` with a `fields` body.
15. **Permission-gated callback plumbing** — the `editBlockId && blockMap.get(editBlockId) && canEditBlock(...)` guard repeats 4× at [builder-layout.tsx:516-543](src/components/builder/builder-layout.tsx#L516-L543).

### Smaller / optional
16. Builder header (back + breadcrumb + undo/redo) — only used once; defer.
17. `FieldRenderer` (272-line switch) — defer until a new field type is added.

---

## Plan

Phased so each ships independently. Matches the repo's small-surgical-change preference.

### Phase 1 — Delete dead code
- Remove `builder/add-field-dialog.tsx` and `builder/edit-section-dialog.tsx`.

### Phase 2 — Shared lib utilities (no UI)
- New **`lib/formatting.ts`** (matches [apps/frontend/src/lib/formatting.ts](../../frontend/src/lib/formatting.ts)) with `formatDateTime` and `formatSubmissionValue`. Replace copies in both submissions pages. Keep the prototype's `(iso: string)` signature + hardcoded `de-DE` for now — the frontend version takes `Date` and uses locale-default; document the divergence.
- Move `FIELD_TYPE_OPTIONS` into `lib/predefined-fields.ts` next to `FIELD_TYPE_LABELS`.
- In `AppliedToSection`, replace local trigger/location constants with `RULE_TRIGGER_TYPES` / `RULE_LOCATIONS`.

### Phase 3 — Extract small reusables
- **`components/confirm-dialog.tsx`** wraps **`AlertDialog`** (not `Dialog` — repo convention, see `domain/role/components/delete-role-dialog.tsx`). Signature: `<ConfirmDialog title description destructiveLabel onConfirm pending trigger?>` with a **`trigger?: ReactNode` slot** matching the frontend's sheet/dialog pattern. Replace the three sites and let each pass its existing icon button as `trigger`.
- `components/back-header.tsx` → `<BackHeader href eyebrow title subtitle right?>`. Replace headers in both submissions pages.
- `components/builder/file-upload-field.tsx` → `<FileUploadField value onChange accept?>` + `useFileUpload` hook.
- `components/builder/options-editor.tsx` → `<OptionsEditor value onChange minRows={2}>`.

### Phase 4 — Split `edit-block-sheet.tsx`
- `components/builder/field-form.tsx` — `FieldForm` + `FieldCommitHandle`, wired to `<FileUploadField>` and `<OptionsEditor>`.
- `components/builder/draggable-field-row.tsx` — `DraggableFieldRow` + `arrayMove`.
- `edit-block-sheet.tsx` keeps the Sheet shell, metadata fields, drag state. Drops from ~730 → ~250 lines.

### Phase 5 — Split `builder-layout.tsx`
- `components/builder/applied-to-section.tsx`.
- `lib/use-block-field-mutations.ts` — `useBlockFieldMutations(blockId, onUpdated?)` returning the four callbacks. Used by `block-card.tsx` and `builder-layout.tsx`. JSDoc note: this is a prototype-shortcut wrapper around `fetch`; the canonical repo idiom (see `apps/frontend/src/domain/*/actions.ts`) is a `next-safe-action` server action consumed via `useTransition`. Don't propagate this hook outside the prototype.
- Compute `currentBlock` / `canEditCurrent` once in builder-layout; stop repeating the guard.

### Phase 6 — Optional, defer
- `components/builder/builder-header.tsx` — only if a second screen needs it.
- Per-type splitting of `FieldRenderer`.

### Cross-check vs. repo conventions ([apps/frontend/CLAUDE.md](../../frontend/CLAUDE.md))
- ✅ `AlertDialog` (not `Dialog`) for destructive confirms.
- ✅ `trigger?: ReactNode` slot pattern on dialog/sheet wrappers.
- ✅ `formatting.ts` filename + the existing `formatDateTime` precedent.
- ✅ `@repo/ui` only — every new component composes existing primitives, none hand-rolled.
- ⚠️ Mutation flow stays as `fetch` + `router.refresh()`. The repo convention is `next-safe-action` + `useTransition`. Migrating is **out of scope** for this refactor — flagged in the hook's JSDoc instead.
- ⚠️ Forms stay as raw `useState`. The repo uses `react-hook-form` + `zodResolver` with an `<EntityForm>` / `<FormContent>` split. Also out of scope; would be a separate "modernize forms" effort if ever wanted.
- N/A `domain/<entity>/` layout — prototype is intentionally flat.

### Order rationale
Phase 1 is free. Phase 2 unblocks Phase 3 (new components consume the moved constants). Phase 3 unblocks Phase 4 (`FieldForm` uses both new primitives). Phase 5 is independent of Phase 4 but cleaner after 4 lands. One commit per phase.

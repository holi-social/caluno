# Delete Shift Instance — Series Support & Frontend

## Context

[`2026-08-11-delete-shift-instance-design.md`](./2026-08-11-delete-shift-instance-design.md) designed `ShiftService.deleteShiftInstance(id, organizationUnitId)` — cancelling a single upcoming shift instance, cancelling its active invites, and notifying affected volunteers. That method is now fully implemented and shipped on this branch: `ShiftService.deleteShiftInstance` (`apps/backend/src/shift/shift.service.ts:1581-1666`), the `deleteShiftInstance` GraphQL resolver (`apps/backend/src/shift/resolvers/shift-mutation.resolver.ts:148-159`), and the single-instance `SHIFT_INSTANCE_CANCELLED` notification plumbing (event, payload, `NotificationService` method, `ShiftListener` handler, email template) are all in place. That spec explicitly deferred `packages/data`/frontend wiring as "mechanical mirrors... with no judgment calls left."

It wasn't mechanical. The frontend `shift-deletion.pen` mockup's delete dialog (frame "S11e — Shift instance delete dialog") offers two choices: **"Only this shift"** and **"This and all future shifts."** The shipped backend only supports the first. This spec covers:

1. Extending `deleteShiftInstance` with an `applyToAllFuture` option, so the second dialog choice has something to call.
2. A new combined notification for the bulk-cancellation case.
3. The `packages/data` mutation wiring the original spec deferred.
4. The frontend delete button and dialog on `ShiftInstanceDetailPage`.

## Goals

- Let an org admin cancel a single upcoming shift instance, or that instance plus every future non-cancelled occurrence in the same series, from `ShiftInstanceDetailPage`.
- Reuse the existing single-instance guards, transaction, and notification path unchanged when the admin picks "only this shift."
- When the admin picks "this and all future shifts," apply the same guards across the whole batch, atomically.
- Notify affected volunteers once per action — one email per instance for the single-instance case (already shipped), one combined email per recipient for the series case.
- Show the two-option dialog only when it's a meaningful choice (i.e. the shift is recurring); otherwise show a plain single-confirm dialog.
- Wire the mutation through `packages/data` and a frontend server action, following the exact conventions `updateShiftInstance` already established for its own this-vs-future choice.

## Non-goals

- **No changes to the single-instance path's behavior.** When `applyToAllFuture` is omitted or `false`, `deleteShiftInstance` behaves exactly as already shipped.
- **No restore/undo**, for either mode — matches the original spec.
- **No itemized per-date notification.** The combined email states a date range ("from X onward"), not a list of every cancelled occurrence.
- **No changes to the master `ShiftDetailPage`** (the non-instance shift view). It's slated for removal; this work only touches `ShiftInstanceDetailPage`.
- **No frontend changes to `updateShiftInstance` / edit flow.** This spec only touches deletion.

## Design

### 1. Backend: `applyToAllFuture` on `ShiftService.deleteShiftInstance`

New signature, matching `updateShiftInstance`'s options-object shape:

```ts
async deleteShiftInstance(
  id: string,
  organizationUnitId: string,
  options: { applyToAllFuture?: boolean } = {},
): Promise<ShiftInstanceEntity>
```

Inside the existing `this.db.transaction(async (tx) => { ... })`, after loading the anchor instance and running the existing not-found and past-instance guards unchanged:

- **`!options.applyToAllFuture`** (default): unchanged — today's exact code path (open-time-entry check on the anchor id → `UPDATE ... WHERE id = :id AND isCancelled = false` → already-cancelled check via empty update result → invite cancellation → single-instance notification).

- **`options.applyToAllFuture`**: new branch.
  1. Compute `fromDate` the same way `updateShiftInstanceSeries` does — `new Date(instance.actualStartsAt)` truncated to midnight (`setHours(0, 0, 0, 0)`) — for consistency with the sibling mutation's "future" boundary.
  2. Select target instance ids: `masterId = instance.masterId AND actualStartsAt >= fromDate AND isCancelled = false` (includes the anchor itself; past instances are excluded by construction since `fromDate` is the anchor's own day and the anchor already passed the past-instance guard).
  3. Open-time-entry check across **every target id**, not just the anchor — reuse `hasOpenTimeEntryForInstance` per id (or a batched variant). If any target instance has an open entry, throw the existing `ConflictGraphQLError('Cannot delete a shift instance with an open time entry')` and cancel nothing.
  4. Two separate `UPDATE`s, run in sequence inside the same transaction, so the anchor's already-cancelled case stays a hard error while future instances' already-cancelled case stays a silent skip:
     - **Anchor**: `UPDATE shiftInstances SET isCancelled = true WHERE id = :id AND isCancelled = false RETURNING *` — same statement the single-instance path already runs. Empty result → throw `ConflictGraphQLError('Shift instance with ID ${id} is already cancelled')`, same as today.
     - **Rest of the future set** (`targetIds` minus the anchor id): `UPDATE shiftInstances SET isCancelled = true WHERE id IN (:restIds) AND isCancelled = false RETURNING id` — the `isCancelled = false` filter here is permissive, not a guard: rows that don't match (already cancelled) are simply absent from the result, no error.
  5. Bulk-cancel active invites (`status IN ACTIVE_SHIFT_INVITE_STATUSES`) for the anchor id plus every id actually returned by the second `UPDATE`, collecting the **union** of `userId`s across all of them (dedup) for the combined notification.
  6. After the transaction commits, call `loadAndEmitShiftInstanceSeriesCancelledNotification(shift, fromDate, recipientUserIds)` (new method, see §2) instead of the single-instance notification call.

Return value: the anchor instance's row (post-cancellation), same as today — the resolver only needs the anchor's updated `isCancelled` state.

### 2. Backend: combined "series cancelled" notification

New event/payload/listener/template trio, modeled on the existing `SHIFT_INSTANCE_CANCELLED` trio but scoped to a range instead of one date:

- **`NotificationEvent.SHIFT_INSTANCE_SERIES_CANCELLED`** = `'notification.shift-instance.series-cancelled'`, new entry in `notification-events.ts`.
- **`ShiftInstanceSeriesCancelledPayload`**, new file in `payloads/`:
  ```ts
  export interface ShiftInstanceSeriesCancelledPayload {
    organizationUnitId: string;
    organizationUnitName: string;
    shiftId: string;
    shiftTitle: string;
    shiftLocation?: string | null;
    recipientUserIds: string[];
    fromDate: Date;
  }
  ```
- **`notification-event-map.ts`** — new entry mapping the event to the payload.
- **`NotificationService.notifyShiftInstanceSeriesCancelled(input)`** — new method alongside `notifyShiftInstanceCancelled`, emitting the event.
- **`ShiftListener.handleShiftInstanceSeriesCancelled`** — new `@OnEvent(NotificationEvent.SHIFT_INSTANCE_SERIES_CANCELLED)` handler, following `handleShiftInstanceCancelled`'s shape (resolve locale per recipient, render template, send), passing `fromDate` instead of `startsAt`/`endsAt`.
- **`shiftInstanceSeriesCancelledTemplate`** — new email template file modeled on `shift-instance-cancelled.template.ts`, wording along the lines of: *"All shifts in the '{shiftTitle}' series from {fromDate} onward have been cancelled."*
- **`ShiftService.loadAndEmitShiftInstanceSeriesCancelledNotification(shift, fromDate, recipientUserIds)`** — new private method mirroring `loadAndEmitShiftInstanceCancelledNotification`: same empty-recipients short-circuit, same try/catch-and-log-only error handling (notification failure must never fail the mutation that already committed).

### 3. GraphQL resolver

Extend the existing `deleteShiftInstance` resolver (`shift-mutation.resolver.ts:148-159`) with the same arg pattern `updateShiftInstance` already uses:

```ts
@Permissions(PERMISSIONS.SHIFT_EDIT)
@Mutation(() => ShiftInstance)
async deleteShiftInstance(
  @Args('id', { type: () => String }) id: string,
  @Args('applyToAllFuture', { type: () => Boolean, nullable: true })
  applyToAllFuture: boolean | null | undefined,
  @Context() context: AuthenticatedGraphQLContext,
): Promise<ShiftInstance> {
  const instance = await this.shiftService.deleteShiftInstance(
    id,
    context.organizationUnitId,
    { applyToAllFuture: applyToAllFuture ?? false },
  );
  return this.shiftInstanceMapper.toModelOrThrow(instance);
}
```

Requires running `bun run codegen` to regenerate `schema.gql` and the typed SDK.

### 4. `packages/data` layer

**`.graphql`** — extend the existing `DeleteShiftInstance` mutation in `packages/data/src/repositories/shift/shift.graphql` with the new optional arg:

```graphql
mutation DeleteShiftInstance($id: ID!, $applyToAllFuture: Boolean) {
  deleteShiftInstance(id: $id, applyToAllFuture: $applyToAllFuture) {
    id
  }
}
```

**`GetShiftInstance` query** — add `rrule` to the `master { ... }` selection (currently: `id, title, location, instructions, minVolunteers, maxVolunteers, visibility` — `shift.graphql:280-288`). The frontend needs this to decide whether to show the one- or two-option dialog.

**Repository method** — `shift.repository.ts`, extend/add `deleteInstance`, mirroring `updateInstance`'s shape:

```ts
async deleteInstance(
  instanceId: string,
  applyToAllFuture?: boolean,
): Promise<{ id: string }> {
  const data = await this.sdk.DeleteShiftInstance({
    id: instanceId,
    applyToAllFuture,
  });
  return { id: data.deleteShiftInstance.id };
}
```

### 5. Frontend

**Delete trigger button** — in `apps/frontend/src/app/[locale]/admin/[orgUId]/shifts/[shiftId]/instances/[instanceId]/page.tsx`, appended after the existing "Manage invites" button in the button row: an icon-only `Button` (`variant="destructive"`, icon size matching the row's `sm` sizing, `Trash2` icon from `lucide-react`, `tooltip` prop for accessibility). Disabled when `isInstanceInThePast` — the same boolean already computed on this page for the Edit button's disabled state.

**`isRecurring` derivation** — `!!instance.master.rrule`, computed in `page.tsx` next to the existing `isInstanceInThePast`/`isOpenShift` booleans, passed down as a prop. (Matches the existing pattern in `edit-shift-instance-page-content.tsx`, minus the redundant `recurrenceDays.length` check since a truthy `rrule` alone is sufficient here.)

**New client component** `apps/frontend/src/domain/shift/components/delete-shift-instance-dialog.tsx`:

```ts
interface DeleteShiftInstanceDialogProps {
  orgUId: string;
  instanceId: string;
  isRecurring: boolean;
  instanceDate: Date; // instance.actualStartsAt, for copy interpolation
  trigger: React.ReactNode;
  disabled?: boolean;
}
```

- **`isRecurring === false`** → reuse `DeleteAlertDialog` (`apps/frontend/src/components/delete-alert-dialog.tsx`) as-is: single confirm, no radio options. Calls the extended `deleteShiftInstance` action with no `applyToAllFuture`.
- **`isRecurring === true`** → new dialog built on shadcn `Dialog` primitives (not `AlertDialog` — this needs local radio-selection state, which `AlertDialog`'s single-action model doesn't fit) composed with the existing `RadioGroup`/`RadioGroupItem` primitives from `@repo/ui` (currently only used in Storybook — this is their first production composition). Layout mirrors the `.pen` mock's "Delete Dialog" frame: title, description, two option cards (title + description text each; the selected card gets the highlighted border/background treatment the mock shows on "Only this shift"), Cancel + destructive Delete footer buttons. Default selection: **"Only this shift"** (matches the mock). On confirm, calls the action with `applyToAllFuture: selected === 'future'`.
- **Both paths**, on success: `toast.success(...)` then `router.push(shiftsListPath(orgUId))` — the admin lands on the shifts list, not the (soon-to-be-removed) parent shift page. On error: `toast.error(...)` with the server error message; dialog stays open, matching `ActionBar`'s existing error-handling pattern for `deleteShift`.

**`apps/frontend/src/domain/shift/actions.ts`** — new `deleteShiftInstance` server action, sibling to `deleteShift`:

```ts
export const deleteShiftInstance = actionClient
  .inputSchema(serverShiftInstanceDeleteSchema)
  .action(async ({ parsedInput }) => {
    const data = await getDataClient({
      orgUId: parsedInput.organizationUnitId,
    });
    return await data.shift.deleteInstance(
      parsedInput.instanceId,
      parsedInput.applyToAllFuture,
    );
  });
```

**`apps/frontend/src/domain/shift/schemas.ts`** — new `shiftInstanceDeleteSchema`/`serverShiftInstanceDeleteSchema`, mirroring `shiftDeleteSchema` but keyed on `instanceId` plus an optional `applyToAllFuture: z.boolean().optional()`.

**i18n** (`apps/frontend/messages/en.json` and `de.json`) — new keys under `Shift.instanceDetail`:
- `deleteAria` — button tooltip/aria label.
- `deleteDialog.title`, `deleteDialog.description` — non-recurring single-confirm copy.
- `deleteDialog.onlyThisTitle`, `deleteDialog.onlyThisDescription` — first radio option ("Only this shift" / "Deletes the shift on {date}. Other occurrences stay untouched.").
- `deleteDialog.futureTitle`, `deleteDialog.futureDescription` — second radio option ("This and all future shifts" / "Deletes this shift and every upcoming occurrence in the series. Past occurrences are kept.").
- `deleteDialog.cancel`, `deleteDialog.confirm` — footer button labels (can likely reuse `Common.cancel` / `Common.delete`, matching `DeleteAlertDialog`'s existing pattern, rather than duplicating).
- Toast keys for success/error, mirroring `Shift.action.deleteSuccess`/`deleteError`.

Date interpolation follows the existing `{shiftTitle}`-style pattern already used elsewhere (e.g. `requiredForms.subtitle`).

## Error cases summary

| Condition | Error |
|---|---|
| Instance doesn't exist / wrong org unit | `NotFoundGraphQLError` (unchanged) |
| Anchor instance already cancelled | `ConflictGraphQLError('Shift instance with ID ${id} is already cancelled')` (unchanged, applies in both modes) |
| Anchor instance is in the past | `ConflictGraphQLError('Cannot delete a past or completed shift instance')` (unchanged) |
| Any target instance (anchor or, in `applyToAllFuture` mode, any future one) has an open time entry | `ConflictGraphQLError('Cannot delete a shift instance with an open time entry')` — blocks the whole batch |
| Already-cancelled instance among the *future* set (not the anchor), `applyToAllFuture` mode only | No error — silently excluded from the update |
| Caller lacks `SHIFT_EDIT` permission | `ForbiddenGraphQLError` (via `@Permissions` decorator, unchanged) |

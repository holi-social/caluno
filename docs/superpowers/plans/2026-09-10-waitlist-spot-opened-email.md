# Waitlist Spot-Opened Email Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a seat frees on a live, capped shift instance with a waitlist, email every waitlisted volunteer a "spot opened" link; the seat goes to whoever claims first (no more silent auto-promotion of the oldest waitlisted volunteer).

**Architecture:** A guard helper in `ShiftService` (`notifyWaitlistOfOpenedSeat`) emits a new typed notification event from the two single-instance seat-freeing paths; a `ShiftListener` handler renders a new per-locale email template deep-linking to the shift. The claim path opens WAITLIST_JOINED → JOINED self-service in both join mutations, re-checking capacity so first-come-first-served is race-safe. Frontend shows waitlisted volunteers a Join button when a spot is free.

**Tech Stack:** NestJS backend (Drizzle + Postgres, @nestjs/event-emitter, nodemailer), Next.js frontend (next-intl), bun test.

**Spec:** `docs/superpowers/specs/2026-09-10-waitlist-spot-opened-email-design.md` (also mirrored in VOLI-1260's description)

## Global Constraints

- Use `bun` only — never npm or yarn.
- Backend tests need local Postgres: run `bun run db:up` from the repo root first.
- No GraphQL schema changes — do NOT run codegen.
- Run backend tests from `apps/backend`: `bun test <path>`.
- `promoteOldestWaitlisted` is deleted; nobody is auto-joined anymore.
- Email copy lives in `apps/backend/src/i18n/locales/{en,de}/email.json`; frontend copy in `apps/frontend/messages/{en,de}.json`.
- Commit after every task (conventional commits, e.g. `feat(shift): …`, `test(shift): …`).

---

### Task 1: Allow waitlist self-claim in the shared permission rule

**Files:**
- Modify: `apps/backend/src/shared/invite-status.ts` (function `volunteerMayRequestInviteStatus`, ~line 173)
- Test: `apps/backend/src/shared/invite-status.spec.ts` (~line 259)

**Interfaces:**
- Produces: `volunteerMayRequestInviteStatus(WAITLIST_JOINED, JOINED) === true`. All other behavior unchanged (admin-only targets still blocked, AWAITING_ADMIN_APPROVAL → JOINED still blocked).

- [ ] **Step 1: Update the failing test**

In `invite-status.spec.ts`, replace the test `it('blocks self-approve and waitlist skip', …)` (lines 259–272) with:

```ts
    it('blocks self-approve but allows waitlist claim (VOLI-1260)', () => {
      expect(
        volunteerMayRequestInviteStatus(
          ShiftInviteStatus.AWAITING_ADMIN_APPROVAL,
          ShiftInviteStatus.JOINED,
        ),
      ).toBe(false);
      expect(
        volunteerMayRequestInviteStatus(
          ShiftInviteStatus.WAITLIST_JOINED,
          ShiftInviteStatus.JOINED,
        ),
      ).toBe(true);
    });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/backend && bun test src/shared/invite-status.spec.ts`
Expected: FAIL — `expected true, received false` on the WAITLIST_JOINED → JOINED expectation.

- [ ] **Step 3: Implement**

In `invite-status.ts`, change the JOINED/WAITLIST_JOINED arm of `volunteerMayRequestInviteStatus` (lines 188–193) from:

```ts
  if (
    to === ShiftInviteStatus.JOINED ||
    to === ShiftInviteStatus.WAITLIST_JOINED
  ) {
    return isVolunteerJoinResolveSource(from);
  }
```

to:

```ts
  if (
    to === ShiftInviteStatus.JOINED ||
    to === ShiftInviteStatus.WAITLIST_JOINED
  ) {
    return (
      isVolunteerJoinResolveSource(from) ||
      from === ShiftInviteStatus.WAITLIST_JOINED
    );
  }
```

Also update the doc comment above the function (lines 155–159) to end with: `…admin approval is admin-only; a waitlisted volunteer may claim a freed seat themselves (VOLI-1260).`

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/backend && bun test src/shared/invite-status.spec.ts`
Expected: PASS (all cases in the file).

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/shared/invite-status.ts apps/backend/src/shared/invite-status.spec.ts
git commit -m "feat(shift): allow volunteers to claim a freed seat from the waitlist"
```

---

### Task 2: Spot-opened event, email template, listener, i18n

**Files:**
- Create: `apps/backend/src/notification/payloads/shift-instance-waitlist-spot-opened.payload.ts`
- Create: `apps/backend/src/notification/email/templates/shift-instance-waitlist-spot-opened.template.ts`
- Modify: `apps/backend/src/notification/notification-events.ts` (add constant after `SHIFT_INSTANCE_LEFT`, line 15)
- Modify: `apps/backend/src/notification/notification-event-map.ts` (import + map entry)
- Modify: `apps/backend/src/notification/notification.service.ts` (input type + emit method)
- Modify: `apps/backend/src/notification/listeners/shift.listener.ts` (new handler)
- Modify: `apps/backend/src/notification/email/templates/index.ts` (export)
- Modify: `apps/backend/src/i18n/locales/en/email.json` + `apps/backend/src/i18n/locales/de/email.json`
- Test: `apps/backend/src/notification/notification.spec.ts`

**Interfaces:**
- Produces: `NotificationEvent.SHIFT_INSTANCE_WAITLIST_SPOT_OPENED`, payload type `ShiftInstanceWaitlistSpotOpenedPayload` (fields: `organizationUnitId: string; organizationUnitName: string; shiftId: string; shiftTitle: string; shiftLocation?: string | null; instanceId: string; startsAt: Date; endsAt: Date; recipientUserIds: string[]`), `NotificationService.notifyShiftInstanceWaitlistSpotOpened(input): void`, and `shiftInstanceWaitlistSpotOpenedTemplate(data, ctx): Promise<{subject, html}>` with `ShiftInstanceWaitlistSpotOpenedTemplateData` = payload minus `recipientUserIds`/`organizationUnitId`, plus `recipientFirstName: string`.

- [ ] **Step 1: Write the failing listener test**

In `notification.spec.ts`, add the template import next to the other template imports (top of file, after line 41):

```ts
import { shiftInstanceWaitlistSpotOpenedTemplate } from './email/templates/shift-instance-waitlist-spot-opened.template';
```

Then add this test after the `it('sends shift instance invited emails to invited volunteers', …)` block (~line 585):

```ts
  it('sends spot-opened email to each waitlisted volunteer', async () => {
    const startsAt = new Date('2026-07-10T09:00:00.000Z');
    const endsAt = new Date('2026-07-10T12:00:00.000Z');

    userService.findById.mockImplementation((id: string) =>
      Promise.resolve({
        id,
        name: id === 'waitlist-1' ? 'Sam Waitlist' : 'Robin Waitlist',
        email: id === 'waitlist-1' ? 'sam@example.com' : 'robin@example.com',
      }),
    );

    const payload = {
      organizationUnitId: 'unit-root-1',
      organizationUnitName: 'Acme Volunteers',
      shiftId: 'shift-1',
      shiftTitle: 'Morning Kitchen',
      shiftLocation: 'Main hall',
      instanceId: 'instance-1',
      startsAt,
      endsAt,
      recipientUserIds: ['waitlist-1', 'waitlist-2'],
    };
    const templateData = (recipientFirstName: string) => ({
      organizationUnitName: payload.organizationUnitName,
      shiftId: payload.shiftId,
      shiftTitle: payload.shiftTitle,
      shiftLocation: payload.shiftLocation,
      instanceId: payload.instanceId,
      recipientFirstName,
      startsAt,
      endsAt,
    });
    const expectedSam = await shiftInstanceWaitlistSpotOpenedTemplate(
      templateData('Sam'),
      createFixtureTranslator('en'),
    );
    const expectedRobin = await shiftInstanceWaitlistSpotOpenedTemplate(
      templateData('Robin'),
      createFixtureTranslator('en'),
    );

    notificationService.notifyShiftInstanceWaitlistSpotOpened(payload);

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(emailService.send).toHaveBeenCalledTimes(2);
    expect(emailService.send).toHaveBeenCalledWith({
      to: 'sam@example.com',
      subject: expectedSam.subject,
      html: expectedSam.html,
    });
    expect(emailService.send).toHaveBeenCalledWith({
      to: 'robin@example.com',
      subject: expectedRobin.subject,
      html: expectedRobin.html,
    });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/backend && bun test src/notification/notification.spec.ts`
Expected: FAIL — cannot resolve the template module.

- [ ] **Step 3: Create the payload type**

`apps/backend/src/notification/payloads/shift-instance-waitlist-spot-opened.payload.ts`:

```ts
export interface ShiftInstanceWaitlistSpotOpenedPayload {
  organizationUnitId: string;
  organizationUnitName: string;
  shiftId: string;
  shiftTitle: string;
  shiftLocation?: string | null;
  instanceId: string;
  startsAt: Date;
  endsAt: Date;
  recipientUserIds: string[];
}
```

- [ ] **Step 4: Register the event**

In `notification-events.ts`, after line 15 (`SHIFT_INSTANCE_LEFT: …`), add:

```ts
  SHIFT_INSTANCE_WAITLIST_SPOT_OPENED:
    'notification.shift-instance.waitlist-spot-opened',
```

In `notification-event-map.ts`, add the import (alphabetical, after the `ShiftInstanceVolunteerLeftPayload` import at line 28):

```ts
import type { ShiftInstanceWaitlistSpotOpenedPayload } from './payloads/shift-instance-waitlist-spot-opened.payload';
```

and the map entry (after the `SHIFT_INSTANCE_VOLUNTEER_LEFT` entry, line 50):

```ts
  [NotificationEvent.SHIFT_INSTANCE_WAITLIST_SPOT_OPENED]: ShiftInstanceWaitlistSpotOpenedPayload;
```

- [ ] **Step 5: Add the NotificationService emitter**

In `notification.service.ts`, add the input type alias after `ShiftInstanceInvitedInput` (line 45):

```ts
type ShiftInstanceWaitlistSpotOpenedInput =
  NotificationEventPayloadMap[typeof NotificationEvent.SHIFT_INSTANCE_WAITLIST_SPOT_OPENED];
```

and the method next to `notifyShiftInstanceInvited` (after line 213):

```ts
  notifyShiftInstanceWaitlistSpotOpened(
    input: ShiftInstanceWaitlistSpotOpenedInput,
  ): void {
    this.emitter.emit(
      NotificationEvent.SHIFT_INSTANCE_WAITLIST_SPOT_OPENED,
      input,
    );
  }
```

- [ ] **Step 6: Add i18n strings**

In `en/email.json`, insert a new block after `"shiftInstanceVolunteerLeft"` (keep the file's alphabetical key order; the block sorts after it):

```json
  "shiftInstanceWaitlistSpotOpened": {
    "buttonLabel": "Claim your spot",
    "detailLocation": "Location",
    "detailOrganization": "Organization",
    "detailShift": "Shift",
    "detailWhen": "When",
    "footerNote": "You're receiving this because you're on the waitlist for this shift on {brandName}.",
    "greeting": "Hi {firstName}, a spot just opened up on a shift you're waiting for.",
    "heading": "A spot opened up",
    "note": "First come, first served — the spot goes to whoever joins first. If someone else is quicker, you stay on the waitlist.",
    "previewText": "A spot opened up for {shiftTitle} at {organizationName} on {startsAt}.",
    "subject": "A spot opened up: {shiftTitle}",
    "whenRange": "{date} · {timeRange}"
  },
```

In `de/email.json`, same position:

```json
  "shiftInstanceWaitlistSpotOpened": {
    "buttonLabel": "Platz sichern",
    "detailLocation": "Ort",
    "detailOrganization": "Organisation",
    "detailShift": "Einsatz",
    "detailWhen": "Wann",
    "footerNote": "Du erhältst diese E-Mail, weil du auf {brandName} auf der Warteliste für diesen Einsatz stehst.",
    "greeting": "Hallo {firstName}, für einen Einsatz, auf den du wartest, ist gerade ein Platz frei geworden.",
    "heading": "Ein Platz ist frei",
    "note": "Wer zuerst kommt, mahlt zuerst — der Platz geht an die Person, die zuerst beitritt. Wenn jemand anderes schneller ist, bleibst du auf der Warteliste.",
    "previewText": "Ein Platz ist frei für {shiftTitle} bei {organizationName} am {startsAt}.",
    "subject": "Ein Platz ist frei: {shiftTitle}",
    "whenRange": "{date} · {timeRange}"
  },
```

- [ ] **Step 7: Create the template**

`apps/backend/src/notification/email/templates/shift-instance-waitlist-spot-opened.template.ts` — mirrors `shift-instance-invited.template.ts` (same `buildDetailRows` structure with `detailTable`):

```ts
import type { EmailTemplateContext } from '../../../i18n/email-translate';
import {
  button,
  card,
  type DetailTableRow,
  detailTable,
  divider,
  emailTheme,
  escapeHtml,
  heading,
  note,
  paragraph,
  renderEmail,
  shiftPublicUrl,
} from './shared';

export interface ShiftInstanceWaitlistSpotOpenedTemplateData {
  organizationUnitName: string;
  shiftId: string;
  shiftTitle: string;
  shiftLocation?: string | null;
  instanceId: string;
  recipientFirstName: string;
  startsAt: Date;
  endsAt: Date;
}

function buildDetailRows(
  data: ShiftInstanceWaitlistSpotOpenedTemplateData,
  { t, formatDate, formatTime }: EmailTemplateContext,
): DetailTableRow[] {
  const organizationUnitName = escapeHtml(data.organizationUnitName);
  const shiftTitle = escapeHtml(data.shiftTitle);
  const shiftLocation = data.shiftLocation
    ? escapeHtml(data.shiftLocation)
    : null;
  const whenValue = escapeHtml(
    t('shiftInstanceWaitlistSpotOpened.whenRange', {
      date: formatDate(data.startsAt),
      timeRange: `${formatTime(data.startsAt)} – ${formatTime(data.endsAt)}`,
    }),
  );

  const rows: DetailTableRow[] = [
    { label: t('shiftInstanceWaitlistSpotOpened.detailShift'), value: shiftTitle },
    {
      label: t('shiftInstanceWaitlistSpotOpened.detailOrganization'),
      value: organizationUnitName,
    },
    { label: t('shiftInstanceWaitlistSpotOpened.detailWhen'), value: whenValue },
  ];

  if (shiftLocation) {
    rows.push({
      label: t('shiftInstanceWaitlistSpotOpened.detailLocation'),
      value: shiftLocation,
    });
  }

  return rows;
}

export async function shiftInstanceWaitlistSpotOpenedTemplate(
  data: ShiftInstanceWaitlistSpotOpenedTemplateData,
  context: EmailTemplateContext,
): Promise<{ subject: string; html: string }> {
  const { t } = context;
  const firstName = escapeHtml(data.recipientFirstName);
  const claimUrl = shiftPublicUrl(data.shiftId, data.instanceId);
  const brandName = emailTheme.brandName;
  const startsAtText = escapeHtml(context.formatDateTime(data.startsAt));

  const body = card(`
    ${heading(t('shiftInstanceWaitlistSpotOpened.heading'))}
    ${paragraph(
      t('shiftInstanceWaitlistSpotOpened.greeting', { firstName }),
      { padding: '0 0 20px' },
    )}
    ${detailTable(buildDetailRows(data, context))}
    ${button({
      href: claimUrl,
      label: t('shiftInstanceWaitlistSpotOpened.buttonLabel'),
    })}
    ${divider()}
    ${note(t('shiftInstanceWaitlistSpotOpened.note'))}
  `);

  return renderEmail({
    templateName: 'shiftInstanceWaitlistSpotOpenedTemplate',
    subject: t('shiftInstanceWaitlistSpotOpened.subject', {
      shiftTitle: data.shiftTitle,
    }),
    previewText: t('shiftInstanceWaitlistSpotOpened.previewText', {
      shiftTitle: data.shiftTitle,
      organizationName: data.organizationUnitName,
      startsAt: startsAtText,
    }),
    body,
    footerNote: t('shiftInstanceWaitlistSpotOpened.footerNote', { brandName }),
  });
}
```

**IMPORTANT:** Before finalizing, open `shift-instance-invited.template.ts` lines 46–62 and copy its exact `DetailTableRow` construction (label/value escaping and row building) so the row shape matches the shared helpers precisely — adjust the code above to whatever that file actually does (e.g. if it wraps values differently).

In `templates/index.ts`, add after the `shiftInstanceJoinedTemplate` export:

```ts
export { shiftInstanceWaitlistSpotOpenedTemplate } from './shift-instance-waitlist-spot-opened.template';
```

- [ ] **Step 8: Add the listener handler**

In `shift.listener.ts`, add the import after line 9 (`shiftInstanceLeftTemplate`):

```ts
import { shiftInstanceWaitlistSpotOpenedTemplate } from '../email/templates/shift-instance-waitlist-spot-opened.template';
```

and the handler after `handleShiftInstanceInvited` (after line 98):

```ts
  @OnEvent(NotificationEvent.SHIFT_INSTANCE_WAITLIST_SPOT_OPENED)
  async handleShiftInstanceWaitlistSpotOpened(
    payload: NotificationEventPayloadMap[typeof NotificationEvent.SHIFT_INSTANCE_WAITLIST_SPOT_OPENED],
  ): Promise<void> {
    await this.notificationService.sendNotification(
      payload.recipientUserIds,
      {
        event: NotificationEvent.SHIFT_INSTANCE_WAITLIST_SPOT_OPENED,
      },
      async (recipient) => {
        const templateContext = createEmailTemplateContext(
          this.appI18n,
          recipient.locale,
        );
        return shiftInstanceWaitlistSpotOpenedTemplate(
          {
            organizationUnitName: payload.organizationUnitName,
            shiftId: payload.shiftId,
            shiftTitle: payload.shiftTitle,
            shiftLocation: payload.shiftLocation,
            instanceId: payload.instanceId,
            recipientFirstName: recipient.firstName,
            startsAt: payload.startsAt,
            endsAt: payload.endsAt,
          },
          templateContext,
        );
      },
    );
  }
```

- [ ] **Step 9: Run test to verify it passes**

Run: `cd apps/backend && bun test src/notification/notification.spec.ts`
Expected: PASS — new test green, all existing listener tests green.

- [ ] **Step 10: Commit**

```bash
git add apps/backend/src/notification apps/backend/src/i18n/locales
git commit -m "feat(notification): spot-opened waitlist email event, template, listener"
```

---

### Task 3: Seat-free trigger helper replaces auto-promotion

**Files:**
- Modify: `apps/backend/src/shift/shift.service.ts` — add `notifyWaitlistOfOpenedSeat`, replace the `promoteOldestWaitlisted` call site (~line 4246), delete `promoteOldestWaitlisted` (~lines 4353–4419)
- Test: `apps/backend/test/shift.service.spec.ts` — extend notification mock (~line 60), replace the auto-promote test (~line 2252)

**Interfaces:**
- Consumes: `NotificationService.notifyShiftInstanceWaitlistSpotOpened` from Task 2.
- Produces: private `ShiftService.notifyWaitlistOfOpenedSeat(instanceId: string, db: Database = this.db): Promise<void>` (used again by Task 5). Behavior: emits the spot-opened event iff instance live + future + seat available + waitlist non-empty; never throws.

- [ ] **Step 1: Replace the service test**

In `shift.service.spec.ts` `beforeAll`, extend the notification mock literal (lines 60–66) — replace the whole literal with:

```ts
    notificationService = {
      notifyShiftInstanceInvited: mock(() => {}),
      notifyShiftInvited: mock(() => {}),
      notifyShiftInstanceCancelled: mock(() => {}),
      notifyShiftInstanceSeriesCancelled: mock(() => {}),
      notifyShiftInstanceJoined: mock(() => {}),
      notifyShiftInstanceRemoved: mock(() => {}),
      notifyShiftInstanceLeft: mock(() => {}),
      notifyShiftSeriesLeft: mock(() => {}),
      notifyShiftSeriesRemoved: mock(() => {}),
      notifyShiftInstanceWaitlistSpotOpened: mock(() => {}),
    } as unknown as NotificationService;
```

Then replace the whole test `it('captures shift_instance_join from waitlist promotion when a seat frees', …)` (lines 2252–2302) with:

```ts
  it('emails the waitlist instead of auto-promoting when a volunteer cancels', async () => {
    const startsAt = new Date(Date.now() + 3600_000);
    const endsAt = new Date(Date.now() + 7200_000);
    const shift = await createShift(db, {
      organizationUnitId,
      createdById: userId,
      startsAt,
      endsAt,
      rrule: null,
      maxVolunteers: 1,
    });
    const [instance] = await getInstances(shift.id);
    const joinedUser = await createUser(db);
    const firstWaitlisted = await createUser(db);
    const secondWaitlisted = await createUser(db);

    await db.insert(schema.shiftInstanceInvites).values([
      {
        instanceId: instance.id,
        userId: joinedUser.id,
        status: ShiftInviteStatus.JOINED,
      },
      {
        instanceId: instance.id,
        userId: firstWaitlisted.id,
        status: ShiftInviteStatus.WAITLIST_JOINED,
      },
      {
        instanceId: instance.id,
        userId: secondWaitlisted.id,
        status: ShiftInviteStatus.WAITLIST_JOINED,
      },
    ]);

    const spotOpened =
      notificationService.notifyShiftInstanceWaitlistSpotOpened as ReturnType<
        typeof mock
      >;
    spotOpened.mockClear();

    await shiftService.updateShiftInstanceInviteStatus(
      joinedUser.id,
      instance.id,
      ShiftInviteStatus.VOLUNTEER_CANCELLED,
    );

    const waitlisted = await db.query.shiftInstanceInvites.findFirst({
      where: { instanceId: instance.id, userId: firstWaitlisted.id },
    });
    expect(waitlisted?.status).toBe(ShiftInviteStatus.WAITLIST_JOINED);

    expect(spotOpened).toHaveBeenCalledTimes(1);
    expect(spotOpened).toHaveBeenCalledWith(
      expect.objectContaining({
        instanceId: instance.id,
        recipientUserIds: expect.arrayContaining([
          firstWaitlisted.id,
          secondWaitlisted.id,
        ]),
      }),
    );
  });

  it('emails the waitlist when an admin rejects a joined volunteer', async () => {
    const startsAt = new Date(Date.now() + 3600_000);
    const endsAt = new Date(Date.now() + 7200_000);
    const shift = await createShift(db, {
      organizationUnitId,
      createdById: userId,
      startsAt,
      endsAt,
      rrule: null,
      maxVolunteers: 1,
    });
    const [instance] = await getInstances(shift.id);
    const joinedUser = await createUser(db);
    const waitlistedUser = await createUser(db);

    await db.insert(schema.shiftInstanceInvites).values([
      {
        instanceId: instance.id,
        userId: joinedUser.id,
        status: ShiftInviteStatus.JOINED,
      },
      {
        instanceId: instance.id,
        userId: waitlistedUser.id,
        status: ShiftInviteStatus.WAITLIST_JOINED,
      },
    ]);

    const spotOpened =
      notificationService.notifyShiftInstanceWaitlistSpotOpened as ReturnType<
        typeof mock
      >;
    spotOpened.mockClear();

    await shiftService.updateShiftInstanceInviteStatus(
      joinedUser.id,
      instance.id,
      ShiftInviteStatus.ADMIN_REJECTED,
      userId, // admin actor ≠ target user
    );

    expect(spotOpened).toHaveBeenCalledTimes(1);
    expect(spotOpened).toHaveBeenCalledWith(
      expect.objectContaining({
        instanceId: instance.id,
        recipientUserIds: [waitlistedUser.id],
      }),
    );
  });

  it('does not email anyone when the waitlist is empty', async () => {
    const startsAt = new Date(Date.now() + 3600_000);
    const endsAt = new Date(Date.now() + 7200_000);
    const shift = await createShift(db, {
      organizationUnitId,
      createdById: userId,
      startsAt,
      endsAt,
      rrule: null,
      maxVolunteers: 1,
    });
    const [instance] = await getInstances(shift.id);
    const joinedUser = await createUser(db);

    await db.insert(schema.shiftInstanceInvites).values({
      instanceId: instance.id,
      userId: joinedUser.id,
      status: ShiftInviteStatus.JOINED,
    });

    const spotOpened =
      notificationService.notifyShiftInstanceWaitlistSpotOpened as ReturnType<
        typeof mock
      >;
    spotOpened.mockClear();

    await shiftService.updateShiftInstanceInviteStatus(
      joinedUser.id,
      instance.id,
      ShiftInviteStatus.VOLUNTEER_CANCELLED,
    );

    expect(spotOpened).not.toHaveBeenCalled();
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/backend && bun test test/shift.service.spec.ts`
Expected: FAIL — first two tests: `spotOpened` never called (auto-promote consumed the seat / no emit exists). Third may pass already.

- [ ] **Step 3: Implement the helper and swap the call site**

In `shift.service.ts`, add this private method next to `hasAvailableSeat` (after line 4351):

```ts
  /**
   * Notifies the waitlist that a seat opened up. Guarded so call sites can
   * invoke it unconditionally after a seat *may* have freed: no-op unless
   * the instance is live and in the future, a seat is actually available,
   * and someone is waiting (VOLI-1260).
   */
  private async notifyWaitlistOfOpenedSeat(
    instanceId: string,
    db: Database = this.db,
  ): Promise<void> {
    try {
      const instance = await db.query.shiftInstances.findFirst({
        where: {
          id: instanceId,
          isCancelled: false,
          actualStartsAt: { gte: new Date() },
        },
        with: { master: true },
      });

      if (!instance?.master || instance.master.isDeleted) {
        return;
      }

      const maxVolunteers =
        instance.overrideMaxVolunteers ?? instance.master.maxVolunteers;
      if (!(await this.hasAvailableSeat(instanceId, maxVolunteers, db))) {
        return;
      }

      const waitlisted = await db.query.shiftInstanceInvites.findMany({
        where: {
          instanceId,
          status: ShiftInviteStatus.WAITLIST_JOINED,
        },
        columns: { userId: true },
      });
      if (waitlisted.length === 0) {
        return;
      }

      const organizationUnit = await db.query.organizationUnits.findFirst({
        where: { id: instance.master.organizationUnitId },
        columns: { id: true, name: true },
      });
      if (!organizationUnit) {
        return;
      }

      this.notificationService.notifyShiftInstanceWaitlistSpotOpened({
        organizationUnitId: organizationUnit.id,
        organizationUnitName: organizationUnit.name,
        shiftId: instance.master.id,
        shiftTitle: instance.master.title,
        shiftLocation: instance.master.location,
        instanceId: instance.id,
        startsAt: instance.actualStartsAt,
        endsAt: instance.actualEndsAt,
        recipientUserIds: waitlisted.map((invite) => invite.userId),
      });
    } catch (error) {
      this.logger.error(
        `Failed to notify waitlist of opened seat: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
```

Then replace the promotion block (lines 4246–4252):

```ts
    if (
      freedSeat &&
      (targetStatus === ShiftInviteStatus.VOLUNTEER_CANCELLED ||
        targetStatus === ShiftInviteStatus.ADMIN_REJECTED)
    ) {
      await this.promoteOldestWaitlisted(instanceId);
    }
```

with:

```ts
    if (
      freedSeat &&
      (targetStatus === ShiftInviteStatus.VOLUNTEER_CANCELLED ||
        targetStatus === ShiftInviteStatus.ADMIN_REJECTED)
    ) {
      void this.notifyWaitlistOfOpenedSeat(instanceId);
    }
```

Finally, delete the entire `promoteOldestWaitlisted` method (lines ~4353–4419). Check `shift.service.ts` still compiles — `POSTHOG_JOIN_SOURCE.WAITLIST_PROMOTE` and `POSTHOG_EVENT.SHIFT_INSTANCE_INVITE_UPDATE` remain used elsewhere; leave imports alone unless the compiler flags one.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd apps/backend && bun test test/shift.service.spec.ts`
Expected: PASS — new tests green; no other test regresses (the old auto-promote assertion is gone).

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/shift/shift.service.ts apps/backend/test/shift.service.spec.ts
git commit -m "feat(shift): email waitlist on freed seat, drop oldest-first auto-promotion"
```

---

### Task 4: Claim path in the join mutations

**Files:**
- Modify: `apps/backend/src/shift/shift.service.ts` — `requestJoinShiftInstance` (~lines 3761–3789) and `joinShiftInstance` (~lines 3452–3460)
- Test: `apps/backend/test/shift.service.spec.ts` — membership mock in `beforeAll` (~line 85), new tests

**Interfaces:**
- Consumes: Task 1's permission rule (not directly — this task changes service internals only).
- Produces: `joinShiftInstance` claims a freed seat for a WAITLIST_JOINED invite (PostHog join source `waitlist_promote`); full instance ⇒ invite unchanged, no error. `requestJoinShiftInstance` lets WAITLIST_JOINED invites flow into `joinShiftInstance` and returns the resulting `JoinStatus`.

- [ ] **Step 1: Write the failing tests**

In `shift.service.spec.ts` `beforeAll`, replace the constructor argument `{} as MembershipService` (line 85) with a working mock — add above the `shiftService = new ShiftService(` line:

```ts
    const membershipService = {
      isMemberOfUnitOrAncestor: async () => true,
      getMembershipState: async () => 'JOINED',
    } as unknown as MembershipService;
```

and pass `membershipService` as the fourth constructor argument instead of `{} as MembershipService`. (Import `JoinStatus` from `'../src/shift/enums'` if the compiler asks for the `'JOINED'` literal type; the `as unknown as` cast avoids the need.)

Add these tests next to the Task 3 tests:

```ts
  it('lets a waitlisted volunteer claim a freed seat via join', async () => {
    const startsAt = new Date(Date.now() + 3600_000);
    const endsAt = new Date(Date.now() + 7200_000);
    const shift = await createShift(db, {
      organizationUnitId,
      createdById: userId,
      startsAt,
      endsAt,
      rrule: null,
      maxVolunteers: 1,
    });
    const [instance] = await getInstances(shift.id);
    const waitlistedUser = await createUser(db);

    await db.insert(schema.shiftInstanceInvites).values({
      instanceId: instance.id,
      userId: waitlistedUser.id,
      status: ShiftInviteStatus.WAITLIST_JOINED,
    });

    capture.mockClear();

    await shiftService.joinShiftInstance(waitlistedUser.id, instance.id);

    const invite = await db.query.shiftInstanceInvites.findFirst({
      where: { instanceId: instance.id, userId: waitlistedUser.id },
    });
    expect(invite?.status).toBe(ShiftInviteStatus.JOINED);
    expect(capture).toHaveBeenCalledWith(
      expect.objectContaining({
        event: POSTHOG_EVENT.SHIFT_INSTANCE_JOIN,
        userId: waitlistedUser.id,
        properties: expect.objectContaining({
          source: 'waitlist_promote',
          shift_instance_id: instance.id,
        }),
      }),
    );
  });

  it('keeps a waitlisted volunteer waitlisted when joining a full instance', async () => {
    const startsAt = new Date(Date.now() + 3600_000);
    const endsAt = new Date(Date.now() + 7200_000);
    const shift = await createShift(db, {
      organizationUnitId,
      createdById: userId,
      startsAt,
      endsAt,
      rrule: null,
      maxVolunteers: 1,
    });
    const [instance] = await getInstances(shift.id);
    const joinedUser = await createUser(db);
    const waitlistedUser = await createUser(db);

    await db.insert(schema.shiftInstanceInvites).values([
      {
        instanceId: instance.id,
        userId: joinedUser.id,
        status: ShiftInviteStatus.JOINED,
      },
      {
        instanceId: instance.id,
        userId: waitlistedUser.id,
        status: ShiftInviteStatus.WAITLIST_JOINED,
      },
    ]);

    await expect(
      shiftService.joinShiftInstance(waitlistedUser.id, instance.id),
    ).resolves.toBeUndefined();

    const invite = await db.query.shiftInstanceInvites.findFirst({
      where: { instanceId: instance.id, userId: waitlistedUser.id },
    });
    expect(invite?.status).toBe(ShiftInviteStatus.WAITLIST_JOINED);
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/backend && bun test test/shift.service.spec.ts -t "waitlisted"`
Expected: FAIL — first test: invite stays WAITLIST_JOINED (join no-ops).

- [ ] **Step 3: Implement the claim branch in `joinShiftInstance`**

In `joinShiftInstance`, the `if (existingInvite) {` block (line 3452) currently lumps WAITLIST_JOINED into the early return. Insert a claim branch at the top of that block:

```ts
    if (existingInvite) {
      if (existingInvite.status === ShiftInviteStatus.WAITLIST_JOINED) {
        // Waitlist claim (VOLI-1260): a freed seat goes to whoever claims
        // first. No seat → stay waitlisted, no error.
        if (!hasSeat) {
          return;
        }

        this.assertInviteStatusTransition(
          existingInvite.status,
          ShiftInviteStatus.JOINED,
        );

        await db
          .update(schema.shiftInstanceInvites)
          .set({ status: ShiftInviteStatus.JOINED })
          .where(eq(schema.shiftInstanceInvites.id, existingInvite.id));

        void this.notifyShiftInstanceJoined(userId, shift, instance);
        await this.captureShiftInstanceJoin({
          userId,
          organizationUnitId: shift.organizationUnitId,
          shiftId: shift.id,
          shiftInstanceId: instanceId,
          source: POSTHOG_JOIN_SOURCE.WAITLIST_PROMOTE,
        });
        return;
      }

      if (
        isParticipatingShiftInviteStatus(existingInvite.status) ||
        existingInvite.status === ShiftInviteStatus.AWAITING_ADMIN_APPROVAL ||
        existingInvite.status === ShiftInviteStatus.ADMIN_REJECTED
      ) {
        return;
      }
      // …existing VOLUNTEER_CANCELLED / VOLUNTEER_REJECTED / ADMIN_INVITED
      // resolve branch stays unchanged below
```

(That is: remove `existingInvite.status === ShiftInviteStatus.WAITLIST_JOINED ||` from the early-return condition and add the new branch above it.)

- [ ] **Step 4: Open the gates in `requestJoinShiftInstance`**

Change the first early-return guard (lines 3761–3771) from:

```ts
    if (
      existingInvite &&
      !isVolunteerJoinResolveSource(existingInvite.status)
    ) {
```

to:

```ts
    if (
      existingInvite &&
      !isVolunteerJoinResolveSource(existingInvite.status) &&
      existingInvite.status !== ShiftInviteStatus.WAITLIST_JOINED
    ) {
```

and the second guard (lines 3778–3782) from:

```ts
    if (
      existingInvite &&
      isVolunteerJoinResolveSource(existingInvite.status) &&
      !isAllowed
    ) {
```

to:

```ts
    if (
      existingInvite &&
      !isAllowed &&
      (isVolunteerJoinResolveSource(existingInvite.status) ||
        existingInvite.status === ShiftInviteStatus.WAITLIST_JOINED)
    ) {
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd apps/backend && bun test test/shift.service.spec.ts`
Expected: PASS — both new tests green, whole file green.

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/shift/shift.service.ts apps/backend/test/shift.service.spec.ts
git commit -m "feat(shift): waitlisted volunteers claim freed seats via the join mutation"
```

---

### Task 5: Claim path in `updateShiftInstanceInviteStatus` (integration-tested)

**Files:**
- Modify: `apps/backend/src/shift/shift.service.ts` — `updateShiftInstanceInviteStatus` (~line 4208, after the existing resolve branches)
- Test: `apps/backend/test/shift.integration.spec.ts` — replace the test at lines 3339–3392

**Interfaces:**
- Consumes: Task 1 permission rule (`volunteerMayRequestInviteStatus` allows WAITLIST_JOINED → JOINED).
- Produces: self-requesting `JOINED` from `WAITLIST_JOINED` via the `updateShiftInstanceInviteStatus` mutation lands on `JOINED` when a seat is free, and returns the unchanged `WAITLIST_JOINED` invite when full (no error). Admin-driven WAITLIST_JOINED → JOINED behavior unchanged.

- [ ] **Step 1: Replace the integration test**

In `shift.integration.spec.ts`, replace `it('forbids volunteer from skipping waitlist WAITLIST_JOINED to JOINED', …)` (lines 3339–3392) with:

```ts
  it('lets a waitlisted volunteer claim a freed seat via updateShiftInstanceInviteStatus', async () => {
    const startsAt = new Date(Date.now() + 3600_000);
    const endsAt = new Date(Date.now() + 7200_000);
    const { id: shiftId } = await createShift(db, {
      organizationUnitId,
      startsAt,
      endsAt,
      maxVolunteers: 1,
    });
    const instances = await db.query.shiftInstances.findMany({
      where: { masterId: shiftId },
    });
    const instanceId = instances[0]?.id;
    expect(instanceId).toBeDefined();
    if (!instanceId) {
      throw new Error('Expected shift instance');
    }

    const volunteer = await createUser(db);
    await db.insert(schema.shiftInstanceInvites).values({
      instanceId,
      userId: volunteer.id,
      status: ShiftInviteStatus.WAITLIST_JOINED,
    });

    const originalUserId = getAuthMockUserId();
    setAuthMockUserId(volunteer.id);
    try {
      const response = await graphqlRequest<{
        updateShiftInstanceInviteStatus: { status: string };
      }>(app, {
        query: `
          mutation UpdateInviteStatus(
            $instanceId: String!
            $status: ShiftInviteStatus!
          ) {
            updateShiftInstanceInviteStatus(
              instanceId: $instanceId
              status: $status
            ) {
              status
            }
          }
        `,
        variables: {
          instanceId,
          status: ShiftInviteStatus.JOINED,
        },
        headers: { 'x-organization-unit-id': organizationUnitId },
      });

      expect(response.errors).toBeUndefined();
      expect(response.data?.updateShiftInstanceInviteStatus.status).toBe(
        ShiftInviteStatus.JOINED,
      );

      const row = await db.query.shiftInstanceInvites.findFirst({
        where: { instanceId, userId: volunteer.id },
      });
      expect(row?.status).toBe(ShiftInviteStatus.JOINED);
    } finally {
      setAuthMockUserId(originalUserId);
    }
  });

  it('keeps a waitlisted volunteer on the waitlist when claiming a full instance', async () => {
    const startsAt = new Date(Date.now() + 3600_000);
    const endsAt = new Date(Date.now() + 7200_000);
    const { id: shiftId } = await createShift(db, {
      organizationUnitId,
      startsAt,
      endsAt,
      maxVolunteers: 1,
    });
    const instances = await db.query.shiftInstances.findMany({
      where: { masterId: shiftId },
    });
    const instanceId = instances[0]?.id;
    expect(instanceId).toBeDefined();
    if (!instanceId) {
      throw new Error('Expected shift instance');
    }

    const joinedUser = await createUser(db);
    const volunteer = await createUser(db);
    await db.insert(schema.shiftInstanceInvites).values([
      {
        instanceId,
        userId: joinedUser.id,
        status: ShiftInviteStatus.JOINED,
      },
      {
        instanceId,
        userId: volunteer.id,
        status: ShiftInviteStatus.WAITLIST_JOINED,
      },
    ]);

    const originalUserId = getAuthMockUserId();
    setAuthMockUserId(volunteer.id);
    try {
      const response = await graphqlRequest<{
        updateShiftInstanceInviteStatus: { status: string };
      }>(app, {
        query: `
          mutation UpdateInviteStatus(
            $instanceId: String!
            $status: ShiftInviteStatus!
          ) {
            updateShiftInstanceInviteStatus(
              instanceId: $instanceId
              status: $status
            ) {
              status
            }
          }
        `,
        variables: {
          instanceId,
          status: ShiftInviteStatus.JOINED,
        },
        headers: { 'x-organization-unit-id': organizationUnitId },
      });

      expect(response.errors).toBeUndefined();
      expect(response.data?.updateShiftInstanceInviteStatus.status).toBe(
        ShiftInviteStatus.WAITLIST_JOINED,
      );

      const row = await db.query.shiftInstanceInvites.findFirst({
        where: { instanceId, userId: volunteer.id },
      });
      expect(row?.status).toBe(ShiftInviteStatus.WAITLIST_JOINED);
    } finally {
      setAuthMockUserId(originalUserId);
    }
  });
```

Note: check how neighbouring tests in this file call `createShift` (some pass `startsAt`/`endsAt`/`maxVolunteers`, some don't). Match the local factory signature — if `maxVolunteers` isn't supported by this file's factory import, set it via a direct `db.update(schema.shifts)` before querying instances.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/backend && bun test test/shift.integration.spec.ts -t "waitlisted"`
Expected: FAIL — first test: response has a Forbidden error (permission still blocks); status stays WAITLIST_JOINED.

- [ ] **Step 3: Implement the capacity re-resolve branch**

In `updateShiftInstanceInviteStatus`, after the existing `else if (invite.status === AWAITING_ADMIN_APPROVAL && …)` block (line 4230), add:

```ts
    } else if (
      invite.status === ShiftInviteStatus.WAITLIST_JOINED &&
      status === ShiftInviteStatus.JOINED &&
      !isAdminActor
    ) {
      // Waitlist claim from the shift page (VOLI-1260): re-resolve by
      // capacity — a full instance keeps the volunteer on the waitlist.
      targetStatus = hasSeat
        ? ShiftInviteStatus.JOINED
        : ShiftInviteStatus.WAITLIST_JOINED;
    }
```

The existing `assertInviteStatusTransition` + `invite.status === targetStatus` early return (lines 4232–4236) then handle both outcomes: full ⇒ no-op return of the unchanged invite; seat ⇒ normal JOINED flow with its notifications and PostHog captures.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd apps/backend && bun test test/shift.integration.spec.ts`
Expected: PASS — both new tests green, no regressions in the file.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/shift/shift.service.ts apps/backend/test/shift.integration.spec.ts
git commit -m "feat(shift): waitlist claim via invite-status mutation re-resolves capacity"
```

---

### Task 6: Member-list removal triggers the waitlist email

**Files:**
- Modify: `apps/backend/src/shift/shift.service.ts` — `updateMembersForShiftInstance` post-commit block (~lines 1492–1500)
- Test: `apps/backend/test/shift.service.spec.ts`

**Interfaces:**
- Consumes: `notifyWaitlistOfOpenedSeat` from Task 3.
- Produces: single-instance member-list removal that drops a JOINED volunteer emits the spot-opened event; removing only non-JOINED members does not.

- [ ] **Step 1: Write the failing tests**

Add to `shift.service.spec.ts` (next to the Task 3 tests):

```ts
  it('emails the waitlist when member-list removal drops a joined volunteer', async () => {
    const startsAt = new Date(Date.now() + 3600_000);
    const endsAt = new Date(Date.now() + 7200_000);
    const shift = await createShift(db, {
      organizationUnitId,
      createdById: userId,
      startsAt,
      endsAt,
      rrule: null,
      maxVolunteers: 1,
    });
    const [instance] = await getInstances(shift.id);
    const joinedUser = await createUser(db);
    const waitlistedUser = await createUser(db);

    await db.insert(schema.shiftInstanceInvites).values([
      {
        instanceId: instance.id,
        userId: joinedUser.id,
        status: ShiftInviteStatus.JOINED,
      },
      {
        instanceId: instance.id,
        userId: waitlistedUser.id,
        status: ShiftInviteStatus.WAITLIST_JOINED,
      },
    ]);

    const spotOpened =
      notificationService.notifyShiftInstanceWaitlistSpotOpened as ReturnType<
        typeof mock
      >;
    spotOpened.mockClear();

    // New member list keeps only the waitlisted volunteer.
    await shiftService.updateMembersForShiftInstance(
      instance.id,
      [waitlistedUser.id],
      organizationUnitId,
    );

    expect(spotOpened).toHaveBeenCalledTimes(1);
    expect(spotOpened).toHaveBeenCalledWith(
      expect.objectContaining({
        instanceId: instance.id,
        recipientUserIds: [waitlistedUser.id],
      }),
    );
  });

  it('does not email the waitlist when removal only affects waitlisted members', async () => {
    const startsAt = new Date(Date.now() + 3600_000);
    const endsAt = new Date(Date.now() + 7200_000);
    const shift = await createShift(db, {
      organizationUnitId,
      createdById: userId,
      startsAt,
      endsAt,
      rrule: null,
      maxVolunteers: 1,
    });
    const [instance] = await getInstances(shift.id);
    const waitlistedUser = await createUser(db);
    const otherWaitlisted = await createUser(db);

    await db.insert(schema.shiftInstanceInvites).values([
      {
        instanceId: instance.id,
        userId: waitlistedUser.id,
        status: ShiftInviteStatus.WAITLIST_JOINED,
      },
      {
        instanceId: instance.id,
        userId: otherWaitlisted.id,
        status: ShiftInviteStatus.WAITLIST_JOINED,
      },
    ]);

    const spotOpened =
      notificationService.notifyShiftInstanceWaitlistSpotOpened as ReturnType<
        typeof mock
      >;
    spotOpened.mockClear();

    await shiftService.updateMembersForShiftInstance(
      instance.id,
      [waitlistedUser.id],
      organizationUnitId,
    );

    expect(spotOpened).not.toHaveBeenCalled();
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/backend && bun test test/shift.service.spec.ts -t "member-list"`
Expected: FAIL — first test: `spotOpened` never called.

- [ ] **Step 3: Implement**

In `updateMembersForShiftInstance`, inside the post-commit `if (userIdsToRemove.length > 0)` block, non-cascade branch (lines 1492–1500), after the `for (const removedUserId of userIdsToRemove) { … loadAndEmitShiftInstanceRemovedNotification … }` loop, add:

```ts
        const removedJoinedMember = userIdsToRemove.some((removedId) =>
          currentShiftInstance.invites.some(
            (invite) =>
              invite.userId === removedId &&
              invite.status === ShiftInviteStatus.JOINED,
          ),
        );
        if (removedJoinedMember) {
          void this.notifyWaitlistOfOpenedSeat(shiftInstanceId);
        }
```

(`currentShiftInstance.invites` was loaded with `{ userId, status }` columns before the transaction, so the removed members' prior statuses are available here. Only the non-cascade branch notifies — cascade removal is intentionally silent per the spec's email-storm decision.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd apps/backend && bun test test/shift.service.spec.ts`
Expected: PASS — both new tests green, whole file green.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/shift/shift.service.ts apps/backend/test/shift.service.spec.ts
git commit -m "feat(shift): notify waitlist when member-list removal frees a seat"
```

---

### Task 7: Frontend — claim button, badge gating, icons

**Files:**
- Modify: `apps/frontend/src/domain/shift/components/join-shift-button.tsx` (imports line 28, `showWaitlistCta` button ~lines 460–474, `WaitlistJoined` branch lines 357–370)
- Modify: `apps/frontend/src/domain/shift/components/shift-action-card.tsx` (note switch ~line 134, badge ~line 199)
- Modify: `apps/frontend/messages/en.json` + `apps/frontend/messages/de.json` (`ShiftDetail` namespace)

**Interfaces:**
- Consumes: backend claim behavior from Tasks 4–5 (no API changes; `isFull` and `inviteStatus` props already exist).

- [ ] **Step 1: Add the new message keys**

In `apps/frontend/messages/en.json`, in the `ShiftDetail` object (next to `waitlistNote`), add:

```json
      "waitlistSpotOpenNote": "A spot just opened — join to claim it.",
```

In `apps/frontend/messages/de.json`, same place:

```json
      "waitlistSpotOpenNote": "Gerade ist ein Platz frei – tritt bei, um ihn zu sichern.",
```

- [ ] **Step 2: Update `JoinShiftButton`**

Change the lucide import (line 28) from:

```ts
import { ArrowRightIcon, BanIcon, ClockIcon } from 'lucide-react';
```

to:

```ts
import { BanIcon, ClockIcon, ListPlusIcon, ListXIcon } from 'lucide-react';
```

Replace the `WaitlistJoined` branch (lines 357–370) with:

```tsx
  if (inviteStatus === ShiftInviteStatus.WaitlistJoined) {
    if (!isFull) {
      // A seat is free — the waitlisted volunteer can claim it directly
      // (first come, first served; backend re-checks capacity).
      return (
        <Button
          onClick={handleReenter}
          disabled={
            joinShiftInstance.isPending ||
            respondToInvite.isPending ||
            !instanceId
          }
          size="xl"
          className={className}
        >
          {joinShiftInstance.isPending || respondToInvite.isPending
            ? t('join.joining')
            : (label ?? t('join.joinShift'))}
        </Button>
      );
    }

    return (
      <Button
        onClick={() => handleCancel(t('join.leftWaitlist'))}
        disabled={respondToInvite.isPending || !instanceId}
        variant="secondary"
        size="xl"
        className={className}
      >
        <ListXIcon className="size-5" />
        {t('join.leaveWaitlist')}
      </Button>
    );
  }
```

In the `showWaitlistCta` branch (line 468), replace `<ArrowRightIcon className="size-5" />` with `<ListPlusIcon className="size-5" />`.

- [ ] **Step 3: Update `ShiftActionCard`**

Note switch (~line 134): change

```ts
      case ShiftInviteStatus.WaitlistJoined:
        return t('waitlistNote');
```

to

```ts
      case ShiftInviteStatus.WaitlistJoined:
        return full ? t('waitlistNote') : t('waitlistSpotOpenNote');
```

Badge (~line 199): change

```tsx
      {inviteStatus === ShiftInviteStatus.WaitlistJoined && (
```

to

```tsx
      {inviteStatus === ShiftInviteStatus.WaitlistJoined && full && (
```

- [ ] **Step 4: Typecheck and lint**

Run: `bun run check-types && bun run lint`
Expected: both pass.

- [ ] **Step 5: Verify in the browser**

Start the dev stack (`bun run dev`), then with two test accounts verify on a shift page:
1. Full shift (max reached) as a waitlisted volunteer: "Leave the waitlist" button with `ListXIcon`, waitlist badge visible.
2. Have the joined volunteer cancel (or remove them in the backoffice member list): the waitlisted viewer's page now shows a primary Join button, no badge, "A spot just opened — join to claim it." note.
3. Click Join: state transitions to joined (accepted badge, cancel-shift button).
4. Second waitlisted volunteer arrives after the seat is taken: back to leave-waitlist + badge.
5. Switch locale to German: note and buttons render German copy.

- [ ] **Step 6: Commit**

```bash
git add apps/frontend
git commit -m "feat(shift): waitlisted volunteers can claim open spots from the shift page"
```

---

## Final verification

- [ ] Run the full backend suite: `cd apps/backend && bun test` — all green.
- [ ] Run `bun run check-types` and `bun run lint` at the repo root — both green.
- [ ] Skim the diff for leftovers: `promoteOldestWaitlisted` gone, no stray `ArrowRightIcon` in `join-shift-button.tsx`, no unused imports.

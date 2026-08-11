import 'reflect-metadata';
import { beforeAll, describe, expect, it, mock } from 'bun:test';
import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { asc, eq } from 'drizzle-orm';
import { AuthService } from '../src/auth/auth.service';
import { type Database, DatabaseModule } from '../src/database/database.module';
import { DATABASE_CONNECTION } from '../src/database/database-connection';
import * as schema from '../src/database/schema';
import { ConflictGraphQLError } from '../src/graphql/errors/conflict.error';
import { NotFoundGraphQLError } from '../src/graphql/errors/not-found.error';
import { MembershipService } from '../src/membership/membership.service';
import { NotificationService } from '../src/notification/notification.service';
import { OrganizationService } from '../src/organization/organization.service';
import { ACTIVE_SHIFT_INVITE_STATUSES } from '../src/shared/invite-status';
import { ShiftInviteStatus } from '../src/shift/enums';
import { ShiftService } from '../src/shift/shift.service';
import { UserService } from '../src/user/user.service';
import { slugify } from '../src/utils/slug.util';
import {
  cancelShiftInstance,
  createShift,
  createShiftInstance,
  createUser,
} from './factories';
import {
  ensureTestDatabase,
  registerTestResourceCleanup,
} from './helpers/ensure-test-database';

describe('ShiftService', () => {
  let moduleRef: TestingModule;
  let shiftService: ShiftService;
  let db: Database;
  let userId: string;
  let organizationUnitId: string;
  let notificationService: NotificationService;

  beforeAll(async () => {
    await ensureTestDatabase();
    moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule],
    }).compile();
    db = moduleRef.get<Database>(DATABASE_CONNECTION);

    notificationService = {
      notifyShiftInstanceInvited: mock(() => {}),
      notifyShiftInvited: mock(() => {}),
      notifyShiftInstanceCancelled: mock(() => {}),
    } as unknown as NotificationService;

    shiftService = new ShiftService(
      db,
      {} as AuthService,
      {} as UserService,
      {} as MembershipService,
      notificationService,
      {} as OrganizationService,
      {
        assertUploadedFileForPurpose: async () => ({}),
        resolvePublicUrlForUploadedFile: async () =>
          'https://example.com/image.png',
      } as never,
      {} as never,
    );

    userId = (await createUser(db)).id;

    const orgName = `Shift Service Test Org ${crypto.randomUUID()}`;
    const [organization] = await db
      .insert(schema.organizations)
      .values({
        name: orgName,
        slug: slugify(orgName),
      })
      .returning();
    const [rootType] = await db
      .insert(schema.organizationUnitTypes)
      .values({
        organizationId: organization.id,
        name: 'organisation unit',
        description: `organization unit for ${orgName}`,
        icon: 'building-2',
      })
      .returning();
    const [rootUnit] = await db
      .insert(schema.organizationUnits)
      .values({
        organizationId: organization.id,
        parentId: null,
        typeId: rootType.id,
        name: organization.name,
        slug: organization.slug,
      })
      .returning();

    organizationUnitId = rootUnit.id;

    registerTestResourceCleanup(async () => {
      await moduleRef.close();
    });
  });

  const createNoneRecurringShift = async (startsAt: Date, endsAt: Date) =>
    (
      await createShift(db, {
        organizationUnitId,
        createdById: userId,
        startsAt,
        endsAt,
        rrule: null,
      })
    ).id;

  const DAILY_RRULE = 'FREQ=DAILY;INTERVAL=1';

  const daysAgo = (days: number, hourUtc: number) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - days);
    d.setUTCHours(hourUtc, 0, 0, 0);
    return d;
  };

  const createRecurringShift = async (startsAt: Date, endsAt: Date) =>
    (
      await createShift(db, {
        organizationUnitId,
        createdById: userId,
        startsAt,
        endsAt,
        rrule: DAILY_RRULE,
      })
    ).id;

  const getInstances = async (shiftId: string) =>
    db
      .select()
      .from(schema.shiftInstances)
      .where(eq(schema.shiftInstances.masterId, shiftId))
      .orderBy(asc(schema.shiftInstances.actualStartsAt));

  describe('update', () => {
    it('updates the instance time of a none-recurring shift to match the new time', async () => {
      const shiftId = await createNoneRecurringShift(
        new Date('2026-07-15T08:00:00.000Z'),
        new Date('2026-07-15T10:00:00.000Z'),
      );

      const newStartsAt = new Date('2026-07-15T09:00:00.000Z');
      const newEndsAt = new Date('2026-07-15T11:00:00.000Z');

      await shiftService.update(userId, shiftId, organizationUnitId, {
        startsAt: newStartsAt,
        endsAt: newEndsAt,
        rrule: null,
      });

      const instances = await db
        .select()
        .from(schema.shiftInstances)
        .where(eq(schema.shiftInstances.masterId, shiftId));

      expect(instances).toHaveLength(1);
      expect(instances[0]?.actualStartsAt.toISOString()).toBe(
        newStartsAt.toISOString(),
      );
      expect(instances[0]?.actualEndsAt.toISOString()).toBe(
        newEndsAt.toISOString(),
      );
    });

    it('leaves exception and cancelled instances untouched, when the time is edited', async () => {
      const shiftId = await createNoneRecurringShift(
        new Date('2026-07-15T08:00:00.000Z'),
        new Date('2026-07-15T10:00:00.000Z'),
      );

      const [normalInstance] = await db
        .select()
        .from(schema.shiftInstances)
        .where(eq(schema.shiftInstances.masterId, shiftId));

      const cancelledInstance = await createShiftInstance(db, shiftId, {
        actualStartsAt: new Date('2026-07-16T08:00:00.000Z'),
        actualEndsAt: new Date('2026-07-16T10:00:00.000Z'),
        occurrenceIndex: 1,
        isCancelled: true,
      });

      const exceptionInstance = await createShiftInstance(db, shiftId, {
        actualStartsAt: new Date('2026-07-17T08:00:00.000Z'),
        actualEndsAt: new Date('2026-07-17T10:00:00.000Z'),
        occurrenceIndex: 2,
        isException: true,
      });

      const newStartsAt = new Date('2026-07-15T09:00:00.000Z');
      const newEndsAt = new Date('2026-07-15T11:00:00.000Z');

      await shiftService.update(userId, shiftId, organizationUnitId, {
        startsAt: newStartsAt,
        endsAt: newEndsAt,
        rrule: null,
      });

      const updated = await db
        .select()
        .from(schema.shiftInstances)
        .where(eq(schema.shiftInstances.masterId, shiftId));
      const normal = updated.find((i) => i.id === normalInstance.id);
      const cancelled = updated.find((i) => i.id === cancelledInstance.id);
      const exception = updated.find((i) => i.id === exceptionInstance.id);

      // The aligned instance picks up the new time.
      expect(normal?.actualStartsAt.toISOString()).toBe(
        newStartsAt.toISOString(),
      );
      expect(normal?.actualEndsAt.toISOString()).toBe(newEndsAt.toISOString());

      // Cancelled and exception instances keep their original times and flags.
      expect(cancelled?.actualStartsAt.toISOString()).toBe(
        cancelledInstance.actualStartsAt.toISOString(),
      );
      expect(cancelled?.actualEndsAt.toISOString()).toBe(
        cancelledInstance.actualEndsAt.toISOString(),
      );

      expect(exception?.actualStartsAt.toISOString()).toBe(
        exceptionInstance.actualStartsAt.toISOString(),
      );
      expect(exception?.actualEndsAt.toISOString()).toBe(
        exceptionInstance.actualEndsAt.toISOString(),
      );
    });
  });

  describe('findAllForEvent', () => {
    const createTestEvent = async () => {
      const title = `Test Event ${crypto.randomUUID()}`;
      const [event] = await db
        .insert(schema.events)
        .values({
          title,
          slug: slugify(title),
          organizationUnitId,
          createdById: userId,
          startsAt: new Date(),
          endsAt: new Date(Date.now() + 3600000),
        })
        .returning();

      if (!event) {
        throw new Error('Failed to create test event');
      }

      return event;
    };

    it('returns only shifts belonging to the given event', async () => {
      const event = await createTestEvent();
      const otherEvent = await createTestEvent();

      const matchingShift = await createShift(db, {
        organizationUnitId,
        createdById: userId,
        eventId: event.id,
      });
      await createShift(db, {
        organizationUnitId,
        createdById: userId,
        eventId: otherEvent.id,
      });
      await createShift(db, {
        organizationUnitId,
        createdById: userId,
        eventId: null,
      });

      const { shifts, total } = await shiftService.findAllForEvent(
        event.id,
        organizationUnitId,
        { limit: 10, offset: 0 },
      );

      expect(total).toBe(1);
      expect(shifts.map((shift) => shift.id)).toEqual([matchingShift.id]);
    });

    it('paginates results and reports the correct total', async () => {
      const event = await createTestEvent();
      const shiftA = await createShift(db, {
        organizationUnitId,
        createdById: userId,
        eventId: event.id,
      });
      const shiftB = await createShift(db, {
        organizationUnitId,
        createdById: userId,
        eventId: event.id,
      });
      const shiftC = await createShift(db, {
        organizationUnitId,
        createdById: userId,
        eventId: event.id,
      });

      const firstPage = await shiftService.findAllForEvent(
        event.id,
        organizationUnitId,
        { limit: 2, offset: 0 },
      );
      const secondPage = await shiftService.findAllForEvent(
        event.id,
        organizationUnitId,
        { limit: 2, offset: 2 },
      );

      expect(firstPage.total).toBe(3);
      expect(firstPage.shifts).toHaveLength(2);
      expect(secondPage.shifts).toHaveLength(1);

      const allIds = [...firstPage.shifts, ...secondPage.shifts]
        .map((shift) => shift.id)
        .sort();
      expect(allIds).toEqual([shiftA.id, shiftB.id, shiftC.id].sort());
    });

    it('excludes soft-deleted shifts', async () => {
      const event = await createTestEvent();
      const activeShift = await createShift(db, {
        organizationUnitId,
        createdById: userId,
        eventId: event.id,
      });
      const deletedShift = await createShift(db, {
        organizationUnitId,
        createdById: userId,
        eventId: event.id,
      });

      await db
        .update(schema.shifts)
        .set({ isDeleted: true })
        .where(eq(schema.shifts.id, deletedShift.id));

      const { shifts, total } = await shiftService.findAllForEvent(
        event.id,
        organizationUnitId,
        { limit: 10, offset: 0 },
      );

      expect(total).toBe(1);
      expect(shifts.map((shift) => shift.id)).toEqual([activeShift.id]);
    });
  });

  describe('findInstancesByMasterIds', () => {
    it('returns an empty map when given no shift ids', async () => {
      const result = await shiftService.findInstancesByMasterIds(
        [],
        organizationUnitId,
      );

      expect(result.size).toBe(0);
    });

    it('returns the instance for each one-time shift keyed by masterId', async () => {
      const shiftA = await createNoneRecurringShift(
        new Date('2026-08-01T08:00:00.000Z'),
        new Date('2026-08-01T10:00:00.000Z'),
      );
      const shiftB = await createNoneRecurringShift(
        new Date('2026-08-02T08:00:00.000Z'),
        new Date('2026-08-02T10:00:00.000Z'),
      );

      const result = await shiftService.findInstancesByMasterIds(
        [shiftA, shiftB],
        organizationUnitId,
      );

      expect(result.size).toBe(2);
      expect(result.get(shiftA)?.[0]?.masterId).toBe(shiftA);
      expect(result.get(shiftB)?.[0]?.masterId).toBe(shiftB);
    });

    it('returns all instances of a shift ordered by start time', async () => {
      const shiftId = await createNoneRecurringShift(
        new Date('2026-08-06T08:00:00.000Z'),
        new Date('2026-08-06T10:00:00.000Z'),
      );
      const later = await createShiftInstance(db, shiftId, {
        actualStartsAt: new Date('2026-08-07T08:00:00.000Z'),
        actualEndsAt: new Date('2026-08-07T10:00:00.000Z'),
        occurrenceIndex: 1,
      });

      const result = await shiftService.findInstancesByMasterIds(
        [shiftId],
        organizationUnitId,
      );

      const instances = result.get(shiftId);
      expect(instances).toHaveLength(2);
      expect(instances?.[1]?.id).toBe(later.id);
    });

    it('omits shifts that have no instance', async () => {
      const shiftId = await createNoneRecurringShift(
        new Date('2026-08-03T08:00:00.000Z'),
        new Date('2026-08-03T10:00:00.000Z'),
      );
      await db
        .delete(schema.shiftInstances)
        .where(eq(schema.shiftInstances.masterId, shiftId));

      const result = await shiftService.findInstancesByMasterIds(
        [shiftId],
        organizationUnitId,
      );

      expect(result.has(shiftId)).toBe(false);
      expect(result.size).toBe(0);
    });

    it('omits instances when the org unit does not match the master shift', async () => {
      const shiftId = await createNoneRecurringShift(
        new Date('2026-08-04T08:00:00.000Z'),
        new Date('2026-08-04T10:00:00.000Z'),
      );

      const result = await shiftService.findInstancesByMasterIds(
        [shiftId],
        crypto.randomUUID(),
      );

      expect(result.size).toBe(0);
    });

    it('omits instances whose master shift is soft-deleted', async () => {
      const shiftId = await createNoneRecurringShift(
        new Date('2026-08-05T08:00:00.000Z'),
        new Date('2026-08-05T10:00:00.000Z'),
      );
      await db
        .update(schema.shifts)
        .set({ isDeleted: true })
        .where(eq(schema.shifts.id, shiftId));

      const result = await shiftService.findInstancesByMasterIds(
        [shiftId],
        organizationUnitId,
      );

      expect(result.size).toBe(0);
    });
  });

  describe('updateMembersForShiftInstance', () => {
    it('does not double-count existing instance invites when inviting to all instances', async () => {
      const shift = await createShift(db, {
        organizationUnitId,
        createdById: userId,
        maxVolunteers: 1,
      });
      const instances = await db.query.shiftInstances.findMany({
        where: { masterId: shift.id },
      });
      const firstInstanceId = instances[0]?.id;
      expect(firstInstanceId).toBeDefined();

      const user = await createUser(db);

      const originalNotificationHandler =
        // biome-ignore lint/complexity/useLiteralKeys: accessing private method for test stubbing
        shiftService['loadAndEmitShiftInvitedNotification'];
      // biome-ignore lint/complexity/useLiteralKeys: assigning private method for test stubbing
      shiftService['loadAndEmitShiftInvitedNotification'] = async () => {};

      try {
        await shiftService.updateMembersForShiftInstance(
          firstInstanceId,
          [user.id],
          organizationUnitId,
          { inviteToAllInstances: true },
        );

        await expect(
          shiftService.updateMembersForShiftInstance(
            firstInstanceId,
            [user.id],
            organizationUnitId,
            { inviteToAllInstances: true },
          ),
        ).resolves.toBeDefined();

        const invites = await db.query.shiftInstanceInvites.findMany({
          where: { userId: user.id },
        });
        expect(invites).toHaveLength(instances.length);
        const uniqueInstanceIds = new Set(
          invites.map((invite) => invite.instanceId),
        );
        expect(uniqueInstanceIds.size).toBe(invites.length);
      } finally {
        // biome-ignore lint/complexity/useLiteralKeys: restoring private method after test stubbing
        shiftService['loadAndEmitShiftInvitedNotification'] =
          originalNotificationHandler;
      }
    });

    it('does not emit invite notifications when the transaction rolls back', async () => {
      const shift = await createShift(db, {
        organizationUnitId,
        createdById: userId,
        maxVolunteers: 1,
      });
      const instances = await db.query.shiftInstances.findMany({
        where: { masterId: shift.id },
      });
      const instanceId = instances[0]?.id;
      expect(instanceId).toBeDefined();

      const existingUser = await createUser(db);
      const newUser = await createUser(db);

      await db.insert(schema.shiftInstanceInvites).values({
        instanceId: instanceId,
        userId: existingUser.id,
        status: ShiftInviteStatus.INVITED,
      });

      await expect(
        shiftService.updateMembersForShiftInstance(
          instanceId,
          [newUser.id],
          organizationUnitId,
        ),
      ).rejects.toThrow(ConflictGraphQLError);

      expect(
        notificationService.notifyShiftInstanceInvited,
      ).not.toHaveBeenCalled();
      expect(notificationService.notifyShiftInvited).not.toHaveBeenCalled();
    });

    it('keeps pending invites when re-saving the same member list', async () => {
      const shift = await createShift(db, {
        organizationUnitId,
        createdById: userId,
      });
      const instances = await db.query.shiftInstances.findMany({
        where: { masterId: shift.id },
      });
      const instanceId = instances[0]?.id;
      expect(instanceId).toBeDefined();

      const user = await createUser(db);

      await shiftService.updateMembersForShiftInstance(
        instanceId,
        [user.id],
        organizationUnitId,
      );
      // Re-save with the same list — the pending invite must survive.
      await shiftService.updateMembersForShiftInstance(
        instanceId,
        [user.id],
        organizationUnitId,
      );

      const invites = await db.query.shiftInstanceInvites.findMany({
        where: { instanceId, userId: user.id },
      });
      expect(invites).toHaveLength(1);
      expect(invites[0]?.status).toBe(ShiftInviteStatus.INVITED);
    });

    it('resurrects a REJECTED invite when re-inviting the member', async () => {
      const shift = await createShift(db, {
        organizationUnitId,
        createdById: userId,
      });
      const instances = await db.query.shiftInstances.findMany({
        where: { masterId: shift.id },
      });
      const instanceId = instances[0]?.id;
      expect(instanceId).toBeDefined();

      const user = await createUser(db);
      await db.insert(schema.shiftInstanceInvites).values({
        instanceId,
        userId: user.id,
        status: ShiftInviteStatus.ADMIN_REJECTED,
      });

      await shiftService.updateMembersForShiftInstance(
        instanceId,
        [user.id],
        organizationUnitId,
      );

      const invites = await db.query.shiftInstanceInvites.findMany({
        where: { instanceId, userId: user.id },
      });
      expect(invites).toHaveLength(1);
      expect(invites[0]?.status).toBe(ShiftInviteStatus.INVITED);
    });

    it('returns pending invitees via findVolunteers when active statuses are requested', async () => {
      const shift = await createShift(db, {
        organizationUnitId,
        createdById: userId,
      });
      const instances = await db.query.shiftInstances.findMany({
        where: { masterId: shift.id },
      });
      const instanceId = instances[0]?.id;
      expect(instanceId).toBeDefined();

      const user = await createUser(db);
      await db.insert(schema.shiftInstanceInvites).values({
        instanceId,
        userId: user.id,
        status: ShiftInviteStatus.INVITED,
      });

      const withActiveStatuses = await shiftService.findVolunteers(
        instanceId,
        organizationUnitId,
        ACTIVE_SHIFT_INVITE_STATUSES,
      );
      expect(withActiveStatuses.map((u) => u.id)).toContain(user.id);

      const withDefaults = await shiftService.findVolunteers(
        instanceId,
        organizationUnitId,
      );
      expect(withDefaults.map((u) => u.id)).not.toContain(user.id);
    });
  });
  describe('update — series resync', () => {
    it('does not touch instances when the series definition is unchanged', async () => {
      const startsAt = daysAgo(7, 8);
      const endsAt = new Date(startsAt.getTime() + 120 * 60000);
      const shiftId = await createRecurringShift(startsAt, endsAt);

      const before = (await getInstances(shiftId)).map((i) => ({
        id: i.id,
        actualStartsAt: i.actualStartsAt.toISOString(),
        actualEndsAt: i.actualEndsAt.toISOString(),
      }));

      await shiftService.update(userId, shiftId, organizationUnitId, {
        title: `Renamed shift ${crypto.randomUUID()}`,
      });

      const after = (await getInstances(shiftId)).map((i) => ({
        id: i.id,
        actualStartsAt: i.actualStartsAt.toISOString(),
        actualEndsAt: i.actualEndsAt.toISOString(),
      }));

      expect(after).toEqual(before);
    });

    it('backfills instances when the start date moves earlier', async () => {
      const startsAt = daysAgo(7, 8);
      const endsAt = new Date(startsAt.getTime() + 120 * 60000);
      const shiftId = await createRecurringShift(startsAt, endsAt);
      const beforeCount = (await getInstances(shiftId)).length;

      const newStartsAt = daysAgo(14, 8);
      await shiftService.update(userId, shiftId, organizationUnitId, {
        startsAt: newStartsAt,
        endsAt: new Date(newStartsAt.getTime() + 120 * 60000),
        rrule: DAILY_RRULE,
      });

      const instances = await getInstances(shiftId);
      expect(instances[0]?.actualStartsAt.toISOString()).toBe(
        newStartsAt.toISOString(),
      );
      expect(instances).toHaveLength(beforeCount + 7);
    });

    it('deletes clean out-of-range instances when the start date moves later', async () => {
      const startsAt = daysAgo(14, 8);
      const endsAt = new Date(startsAt.getTime() + 120 * 60000);
      const shiftId = await createRecurringShift(startsAt, endsAt);
      const beforeCount = (await getInstances(shiftId)).length;

      const newStartsAt = daysAgo(7, 8);
      await shiftService.update(userId, shiftId, organizationUnitId, {
        startsAt: newStartsAt,
        endsAt: new Date(newStartsAt.getTime() + 120 * 60000),
        rrule: DAILY_RRULE,
      });

      const instances = await getInstances(shiftId);
      expect(instances[0]?.actualStartsAt.toISOString()).toBe(
        newStartsAt.toISOString(),
      );
      expect(instances).toHaveLength(beforeCount - 7);
    });

    it('cancels out-of-range instances that have invites instead of deleting them', async () => {
      const startsAt = daysAgo(14, 8);
      const endsAt = new Date(startsAt.getTime() + 120 * 60000);
      const shiftId = await createRecurringShift(startsAt, endsAt);
      const beforeCount = (await getInstances(shiftId)).length;

      const [oldest] = await getInstances(shiftId);
      const volunteer = await createUser(db);
      await db.insert(schema.shiftInstanceInvites).values({
        instanceId: oldest.id,
        userId: volunteer.id,
        status: ShiftInviteStatus.ACCEPTED,
      });

      const newStartsAt = daysAgo(7, 8);
      await shiftService.update(userId, shiftId, organizationUnitId, {
        startsAt: newStartsAt,
        endsAt: new Date(newStartsAt.getTime() + 120 * 60000),
        rrule: DAILY_RRULE,
      });

      const instances = await getInstances(shiftId);
      const kept = instances.find((i) => i.id === oldest.id);
      expect(kept?.isCancelled).toBe(true);
      expect(kept?.cancelledBySync).toBe(true);
      // 7 out-of-range: 6 clean deleted, 1 with invite kept as cancelled
      expect(instances).toHaveLength(beforeCount - 6);

      const invites = await db
        .select()
        .from(schema.shiftInstanceInvites)
        .where(eq(schema.shiftInstanceInvites.instanceId, oldest.id));
      expect(invites).toHaveLength(1);
    });

    it('cancels out-of-range instances that have time entries instead of deleting them', async () => {
      const startsAt = daysAgo(14, 8);
      const endsAt = new Date(startsAt.getTime() + 120 * 60000);
      const shiftId = await createRecurringShift(startsAt, endsAt);

      const [oldest] = await getInstances(shiftId);
      const volunteer = await createUser(db);
      await db.insert(schema.timeEntries).values({
        shiftInstanceId: oldest.id,
        volunteerId: volunteer.id,
        startedAt: oldest.actualStartsAt,
        endedAt: oldest.actualEndsAt,
      });

      const newStartsAt = daysAgo(7, 8);
      await shiftService.update(userId, shiftId, organizationUnitId, {
        startsAt: newStartsAt,
        endsAt: new Date(newStartsAt.getTime() + 120 * 60000),
        rrule: DAILY_RRULE,
      });

      const instances = await getInstances(shiftId);
      const kept = instances.find((i) => i.id === oldest.id);
      expect(kept?.isCancelled).toBe(true);
      expect(kept?.cancelledBySync).toBe(true);
    });

    it('restores sync-cancelled instances on re-expansion, but not manually cancelled ones', async () => {
      const startsAt = daysAgo(14, 8);
      const endsAt = new Date(startsAt.getTime() + 120 * 60000);
      const shiftId = await createRecurringShift(startsAt, endsAt);

      const initial = await getInstances(shiftId);
      // 14 and 12 days ago; array destructuring keeps the element type
      // (index access like initial[0] would be `| undefined` under noUncheckedIndexedAccess)
      const [syncTarget, , manualTarget] = initial;
      const volunteer = await createUser(db);
      const volunteer2 = await createUser(db);
      await db.insert(schema.shiftInstanceInvites).values([
        {
          instanceId: syncTarget.id,
          userId: volunteer.id,
          status: ShiftInviteStatus.ACCEPTED,
        },
        {
          instanceId: manualTarget.id,
          userId: volunteer2.id,
          status: ShiftInviteStatus.ACCEPTED,
        },
      ]);
      await db
        .update(schema.shiftInstances)
        .set({ isCancelled: true })
        .where(eq(schema.shiftInstances.id, manualTarget.id));

      // Shrink: move start to 3 days ago — both instances fall out of range.
      const shrunkStart = daysAgo(3, 8);
      await shiftService.update(userId, shiftId, organizationUnitId, {
        startsAt: shrunkStart,
        endsAt: new Date(shrunkStart.getTime() + 120 * 60000),
        rrule: DAILY_RRULE,
      });

      let instances = await getInstances(shiftId);
      expect(
        instances.find((i) => i.id === syncTarget.id)?.cancelledBySync,
      ).toBe(true);
      expect(
        instances.find((i) => i.id === manualTarget.id)?.cancelledBySync,
      ).toBe(false);

      // Re-expand: move start back to 14 days ago.
      const restoredStart = daysAgo(14, 8);
      await shiftService.update(userId, shiftId, organizationUnitId, {
        startsAt: restoredStart,
        endsAt: new Date(restoredStart.getTime() + 120 * 60000),
        rrule: DAILY_RRULE,
      });

      instances = await getInstances(shiftId);
      const restored = instances.find((i) => i.id === syncTarget.id);
      expect(restored?.isCancelled).toBe(false);
      expect(restored?.cancelledBySync).toBe(false);

      const stillCancelled = instances.find((i) => i.id === manualTarget.id);
      expect(stillCancelled?.isCancelled).toBe(true);
      expect(stillCancelled?.cancelledBySync).toBe(false);
    });

    it('updates actualEndsAt on matched instances when the duration changes', async () => {
      const startsAt = daysAgo(7, 8);
      const endsAt = new Date(startsAt.getTime() + 120 * 60000);
      const shiftId = await createRecurringShift(startsAt, endsAt);
      const beforeCount = (await getInstances(shiftId)).length;

      await shiftService.update(userId, shiftId, organizationUnitId, {
        startsAt,
        endsAt: new Date(startsAt.getTime() + 180 * 60000), // 2h -> 3h
        rrule: DAILY_RRULE,
      });

      const instances = await getInstances(shiftId);
      expect(instances).toHaveLength(beforeCount);
      for (const instance of instances) {
        expect(
          instance.actualEndsAt.getTime() - instance.actualStartsAt.getTime(),
        ).toBe(180 * 60000);
      }
    });
  });

  describe('deleteShiftInstance', () => {
    const futureWindow = () => ({
      startsAt: new Date(Date.now() + 3600_000),
      endsAt: new Date(Date.now() + 7200_000),
    });

    it('throws NotFoundGraphQLError when the instance does not exist', async () => {
      await expect(
        shiftService.deleteShiftInstance(
          crypto.randomUUID(),
          organizationUnitId,
        ),
      ).rejects.toThrow(NotFoundGraphQLError);
    });

    it('throws NotFoundGraphQLError when the instance belongs to a different org unit', async () => {
      const { startsAt, endsAt } = futureWindow();
      const shift = await createShift(db, {
        organizationUnitId,
        createdById: userId,
        startsAt,
        endsAt,
        rrule: null,
      });
      const instances = await getInstances(shift.id);

      await expect(
        shiftService.deleteShiftInstance(instances[0].id, crypto.randomUUID()),
      ).rejects.toThrow(NotFoundGraphQLError);
    });

    it('cancels a future instance', async () => {
      const { startsAt, endsAt } = futureWindow();
      const shift = await createShift(db, {
        organizationUnitId,
        createdById: userId,
        startsAt,
        endsAt,
        rrule: null,
      });
      const instances = await getInstances(shift.id);

      const result = await shiftService.deleteShiftInstance(
        instances[0].id,
        organizationUnitId,
      );

      expect(result.isCancelled).toBe(true);

      const [reloaded] = await getInstances(shift.id);
      expect(reloaded.isCancelled).toBe(true);
    });

    it('throws ConflictGraphQLError when the instance is already cancelled', async () => {
      const { startsAt, endsAt } = futureWindow();
      const shift = await createShift(db, {
        organizationUnitId,
        createdById: userId,
        startsAt,
        endsAt,
        rrule: null,
      });
      const instances = await getInstances(shift.id);
      await cancelShiftInstance(db, instances[0].id);

      await expect(
        shiftService.deleteShiftInstance(instances[0].id, organizationUnitId),
      ).rejects.toThrow(ConflictGraphQLError);
    });

    it('throws ConflictGraphQLError when the instance is in the past', async () => {
      const shift = await createShift(db, {
        organizationUnitId,
        createdById: userId,
        startsAt: daysAgo(2, 9),
        endsAt: daysAgo(2, 11),
        rrule: null,
      });
      const instances = await getInstances(shift.id);

      await expect(
        shiftService.deleteShiftInstance(instances[0].id, organizationUnitId),
      ).rejects.toThrow(ConflictGraphQLError);
    });

    it('throws ConflictGraphQLError when the instance has an open time entry', async () => {
      const { startsAt, endsAt } = futureWindow();
      const shift = await createShift(db, {
        organizationUnitId,
        createdById: userId,
        startsAt,
        endsAt,
        rrule: null,
      });
      const instances = await getInstances(shift.id);
      const volunteer = await createUser(db);
      await db.insert(schema.timeEntries).values({
        shiftInstanceId: instances[0].id,
        volunteerId: volunteer.id,
        startedAt: new Date(),
        endedAt: null,
      });

      await expect(
        shiftService.deleteShiftInstance(instances[0].id, organizationUnitId),
      ).rejects.toThrow(ConflictGraphQLError);
    });

    it('allows deletion when the instance only has a closed time entry', async () => {
      const { startsAt, endsAt } = futureWindow();
      const shift = await createShift(db, {
        organizationUnitId,
        createdById: userId,
        startsAt,
        endsAt,
        rrule: null,
      });
      const instances = await getInstances(shift.id);
      const volunteer = await createUser(db);
      await db.insert(schema.timeEntries).values({
        shiftInstanceId: instances[0].id,
        volunteerId: volunteer.id,
        startedAt: new Date(Date.now() - 3600_000),
        endedAt: new Date(),
      });

      const result = await shiftService.deleteShiftInstance(
        instances[0].id,
        organizationUnitId,
      );
      expect(result.isCancelled).toBe(true);
    });

    it('cancels active invites and leaves rejected invites untouched', async () => {
      const { startsAt, endsAt } = futureWindow();
      const shift = await createShift(db, {
        organizationUnitId,
        createdById: userId,
        startsAt,
        endsAt,
        rrule: null,
      });
      const instances = await getInstances(shift.id);
      const invitedUser = await createUser(db);
      const acceptedUser = await createUser(db);
      const selfJoinedUser = await createUser(db);
      const rejectedUser = await createUser(db);

      await db.insert(schema.shiftInstanceInvites).values([
        {
          instanceId: instances[0].id,
          userId: invitedUser.id,
          status: ShiftInviteStatus.INVITED,
        },
        {
          instanceId: instances[0].id,
          userId: acceptedUser.id,
          status: ShiftInviteStatus.ACCEPTED,
        },
        {
          instanceId: instances[0].id,
          userId: selfJoinedUser.id,
          status: ShiftInviteStatus.SELF_JOINED,
        },
        {
          instanceId: instances[0].id,
          userId: rejectedUser.id,
          status: ShiftInviteStatus.VOLUNTEER_REJECTED,
        },
      ]);

      await shiftService.deleteShiftInstance(
        instances[0].id,
        organizationUnitId,
      );

      const invites = await db.query.shiftInstanceInvites.findMany({
        where: { instanceId: instances[0].id },
      });
      const statusByUserId = new Map(
        invites.map((invite) => [invite.userId, invite.status]),
      );

      expect(statusByUserId.get(invitedUser.id)).toBe(
        ShiftInviteStatus.CANCELLED,
      );
      expect(statusByUserId.get(acceptedUser.id)).toBe(
        ShiftInviteStatus.CANCELLED,
      );
      expect(statusByUserId.get(selfJoinedUser.id)).toBe(
        ShiftInviteStatus.CANCELLED,
      );
      expect(statusByUserId.get(rejectedUser.id)).toBe(
        ShiftInviteStatus.VOLUNTEER_REJECTED,
      );
    });

    it('leaves the rest of the recurring series untouched', async () => {
      const { startsAt, endsAt } = futureWindow();
      const shift = await createShift(db, {
        organizationUnitId,
        createdById: userId,
        startsAt,
        endsAt,
        rrule: null,
      });
      const [targetInstance] = await getInstances(shift.id);

      const siblingInstance = await createShiftInstance(db, shift.id, {
        actualStartsAt: new Date(startsAt.getTime() + 86_400_000),
        actualEndsAt: new Date(endsAt.getTime() + 86_400_000),
        occurrenceIndex: 1,
      });

      const sharedVolunteer = await createUser(db);
      await db.insert(schema.shiftInstanceInvites).values([
        {
          instanceId: targetInstance.id,
          userId: sharedVolunteer.id,
          status: ShiftInviteStatus.ACCEPTED,
        },
        {
          instanceId: siblingInstance.id,
          userId: sharedVolunteer.id,
          status: ShiftInviteStatus.ACCEPTED,
        },
      ]);

      await shiftService.deleteShiftInstance(
        targetInstance.id,
        organizationUnitId,
      );

      const [reloadedSibling] = await db
        .select()
        .from(schema.shiftInstances)
        .where(eq(schema.shiftInstances.id, siblingInstance.id));
      expect(reloadedSibling.isCancelled).toBe(false);

      const siblingInvites = await db
        .select()
        .from(schema.shiftInstanceInvites)
        .where(eq(schema.shiftInstanceInvites.instanceId, siblingInstance.id));
      expect(siblingInvites).toHaveLength(1);
      expect(siblingInvites[0]?.status).toBe(ShiftInviteStatus.ACCEPTED);
    });

    it('emits a cancellation notification for volunteers with an active invite', async () => {
      const { startsAt, endsAt } = futureWindow();
      const shift = await createShift(db, {
        organizationUnitId,
        createdById: userId,
        startsAt,
        endsAt,
        rrule: null,
      });
      const instances = await getInstances(shift.id);
      const invitedUser = await createUser(db);

      await db.insert(schema.shiftInstanceInvites).values({
        instanceId: instances[0].id,
        userId: invitedUser.id,
        status: ShiftInviteStatus.INVITED,
      });

      (
        notificationService.notifyShiftInstanceCancelled as ReturnType<
          typeof mock
        >
      ).mockClear();

      await shiftService.deleteShiftInstance(
        instances[0].id,
        organizationUnitId,
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(
        notificationService.notifyShiftInstanceCancelled,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          instanceId: instances[0].id,
          recipientUserIds: [invitedUser.id],
        }),
      );
    });

    it('does not emit a cancellation notification when there are no active invites', async () => {
      const { startsAt, endsAt } = futureWindow();
      const shift = await createShift(db, {
        organizationUnitId,
        createdById: userId,
        startsAt,
        endsAt,
        rrule: null,
      });
      const instances = await getInstances(shift.id);

      (
        notificationService.notifyShiftInstanceCancelled as ReturnType<
          typeof mock
        >
      ).mockClear();

      await shiftService.deleteShiftInstance(
        instances[0].id,
        organizationUnitId,
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(
        notificationService.notifyShiftInstanceCancelled,
      ).not.toHaveBeenCalled();
    });
  });
});

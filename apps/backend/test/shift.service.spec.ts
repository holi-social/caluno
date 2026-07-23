import 'reflect-metadata';
import { beforeAll, describe, expect, it } from 'bun:test';
import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { asc, eq } from 'drizzle-orm';
import { AuthService } from '../src/auth/auth.service';
import { type Database, DatabaseModule } from '../src/database/database.module';
import { DATABASE_CONNECTION } from '../src/database/database-connection';
import * as schema from '../src/database/schema';
import { MembershipService } from '../src/membership/membership.service';
import { NotificationService } from '../src/notification/notification.service';
import { OrganizationService } from '../src/organization/organization.service';
import { ShiftInviteStatus } from '../src/shift/enums';
import { ShiftService } from '../src/shift/shift.service';
import { UserService } from '../src/user/user.service';
import { slugify } from '../src/utils/slug.util';
import { createShift, createShiftInstance, createUser } from './factories';
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

  beforeAll(async () => {
    await ensureTestDatabase();
    moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule],
    }).compile();
    db = moduleRef.get<Database>(DATABASE_CONNECTION);

    shiftService = new ShiftService(
      db,
      {} as AuthService,
      {} as UserService,
      {} as MembershipService,
      {} as NotificationService,
      {} as OrganizationService,
      {
        assertUploadedFileForPurpose: async () => ({}),
        resolvePublicUrlForUploadedFile: async () =>
          'https://example.com/image.png',
      } as never,
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
});

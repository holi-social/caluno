import 'reflect-metadata';
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { AuthService } from '../src/auth/auth.service';
import { type Database, DatabaseModule } from '../src/database/database.module';
import { DATABASE_CONNECTION } from '../src/database/database-connection';
import { MembershipService } from '../src/membership/membership.service';
import { NotificationService } from '../src/notification/notification.service';
import { ShiftService } from '../src/shift/shift.service';
import { UserService } from '../src/user/user.service';
import { createShift, createShiftInstance, createUser } from './factories';
import { applyTestDatabaseEnvironment } from './helpers/ensure-test-database';

describe('ShiftService', () => {
  let moduleRef: TestingModule;
  let shiftService: ShiftService;
  let db: Database;
  let userId: string;
  let organizationUnitId: string;

  beforeAll(async () => {
    applyTestDatabaseEnvironment();
    moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule],
    }).compile();
    db = moduleRef.get(DATABASE_CONNECTION);

    shiftService = new ShiftService(
      db,
      {} as AuthService,
      {} as UserService,
      {} as MembershipService,
      {} as NotificationService,
    );

    userId = (await createUser(db)).id;
    const rootUnit = await db.query.organizationUnits.findFirst({
      where: { parentId: { isNull: true } },
      columns: { id: true },
    });
    organizationUnitId = rootUnit?.id ?? '';
  });

  afterAll(async () => {
    await moduleRef.close();
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

      const instances = await db.query.shiftInstances.findMany({
        where: { masterId: shiftId },
      });

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

      const [normalInstance] = await db.query.shiftInstances.findMany({
        where: { masterId: shiftId },
      });

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

      const updated = await db.query.shiftInstances.findMany({
        where: { masterId: shiftId },
      });
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
});

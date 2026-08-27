import 'reflect-metadata';
import {
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  mock,
  setDefaultTimeout,
} from 'bun:test';
import type { INestApplication } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { Database } from '../src/database/database.module';
import * as schema from '../src/database/schema';
import {
  ConflictGraphQLError,
  NotFoundGraphQLError,
} from '../src/graphql/errors';
import { ShiftInviteStatus } from '../src/shift/enums';
import { AddTimeEntryInput } from '../src/time-tracking/inputs/add-time-entry.input';
import { TimeTrackingService } from '../src/time-tracking/time-tracking.service';
import { createShift, createUser } from './factories';
import {
  createOrganizationWithType,
  createUnit,
} from './factories/org.factory';
import { applyBunAuthMocks, setAuthMockUserId } from './helpers/auth-mocks';
import { getGraphqlTestContext } from './helpers/graphql-test-context';

applyBunAuthMocks(mock.module);
setDefaultTimeout(20_000);

describe('TimeTrackingService', () => {
  let app: INestApplication;
  let db: Database;
  let organizationUnitId: string;
  let testUserId: string;
  let service: TimeTrackingService;

  beforeAll(async () => {
    const context = await getGraphqlTestContext();
    app = context.app;
    db = context.db;
    organizationUnitId = context.organizationUnitId;
    testUserId = context.testUserId;
    service = app.get(TimeTrackingService);
  });

  // Restore the shared context user so the mock user never leaks into other
  // spec files running in the same process.
  afterEach(() => {
    setAuthMockUserId(testUserId);
  });

  it('prevents duplicate open time entries for the same instance and volunteer', async () => {
    const user = await createUser(db);
    setAuthMockUserId(user.id);

    await db.insert(schema.memberships).values({
      userId: user.id,
      organizationUnitId,
    });

    const { id: shiftId } = await createShift(db, {
      organizationUnitId,
    });
    const instances = await db.query.shiftInstances.findMany({
      where: { masterId: shiftId },
    });
    const instanceId = instances[0]?.id;
    expect(instanceId).toBeDefined();

    // Self check-in is only valid around the shift time; put this instance now.
    await db
      .update(schema.shiftInstances)
      .set({
        actualStartsAt: new Date(),
        actualEndsAt: new Date(Date.now() + 60 * 60 * 1000),
      })
      .where(eq(schema.shiftInstances.id, instanceId ?? ''));

    await db.insert(schema.shiftInstanceInvites).values({
      instanceId: instanceId ?? '',
      userId: user.id,
      status: ShiftInviteStatus.ACCEPTED,
    });

    await service.checkIn(instanceId ?? '', user.id);

    await expect(service.checkIn(instanceId ?? '', user.id)).rejects.toThrow(
      ConflictGraphQLError,
    );

    const entries = await db.query.timeEntries.findMany({
      where: {
        shiftInstanceId: instanceId,
        volunteerId: user.id,
        endedAt: { isNull: true },
      },
    });
    expect(entries).toHaveLength(1);
  });

  it('addTimeEntry rejects duplicate open time entries at the database guard level', async () => {
    const user = await createUser(db);

    const { id: shiftId } = await createShift(db, {
      organizationUnitId,
    });
    const instances = await db.query.shiftInstances.findMany({
      where: { masterId: shiftId },
    });
    const instanceId = instances[0]?.id;
    expect(instanceId).toBeDefined();

    const input = new AddTimeEntryInput();
    input.shiftInstanceId = instanceId ?? '';
    input.volunteerId = user.id;
    input.startedAt = new Date();
    input.endedAt = null;
    input.notes = null;

    await service.addTimeEntry(organizationUnitId, input, user.id);

    await expect(
      service.addTimeEntry(organizationUnitId, input, user.id),
    ).rejects.toThrow(ConflictGraphQLError);

    const entries = await db.query.timeEntries.findMany({
      where: {
        shiftInstanceId: instanceId,
        volunteerId: user.id,
        endedAt: { isNull: true },
      },
    });
    expect(entries).toHaveLength(1);
  });

  it('addTimeEntry creates a shift-less entry with the given org unit and no shift instance', async () => {
    const user = await createUser(db);

    const input = new AddTimeEntryInput();
    input.volunteerId = user.id;
    input.startedAt = new Date();
    input.endedAt = null;
    input.notes = 'Checked in without a shift';

    const entry = await service.addTimeEntry(organizationUnitId, input, user.id);

    expect(entry.shiftInstanceId).toBeNull();
    expect(entry.organizationUnitId).toBe(organizationUnitId);
    expect(entry.notes).toBe('Checked in without a shift');
  });

  it('addTimeEntry persists endedAt when provided (manual complete entry)', async () => {
    const user = await createUser(db);
    const startedAt = new Date(Date.now() - 60 * 60 * 1000);
    const endedAt = new Date();

    const input = new AddTimeEntryInput();
    input.volunteerId = user.id;
    input.startedAt = startedAt;
    input.endedAt = endedAt;
    input.notes = null;

    const entry = await service.addTimeEntry(organizationUnitId, input, user.id);

    expect(entry.endedAt).toEqual(endedAt);
  });

  it('addTimeEntry rejects a second open shift-less entry for the same volunteer and org unit', async () => {
    const user = await createUser(db);

    const first = new AddTimeEntryInput();
    first.volunteerId = user.id;
    first.startedAt = new Date();
    first.endedAt = null;
    first.notes = null;
    await service.addTimeEntry(organizationUnitId, first, user.id);

    const second = new AddTimeEntryInput();
    second.volunteerId = user.id;
    second.startedAt = new Date();
    second.endedAt = null;
    second.notes = null;

    await expect(
      service.addTimeEntry(organizationUnitId, second, user.id),
    ).rejects.toThrow(ConflictGraphQLError);
  });

  it('closeTimeEntry closes a shift-less entry scoped by organizationUnitId', async () => {
    const user = await createUser(db);

    const openInput = new AddTimeEntryInput();
    openInput.volunteerId = user.id;
    openInput.startedAt = new Date();
    openInput.endedAt = null;
    openInput.notes = null;
    const opened = await service.addTimeEntry(organizationUnitId, openInput, user.id);

    const closeInput = { endedAt: new Date(), notes: 'done' };
    const closed = await service.closeTimeEntry(
      opened.id,
      organizationUnitId,
      closeInput,
      user.id,
    );

    expect(closed.endedAt).toEqual(closeInput.endedAt);
  });

  it('closeTimeEntry throws NotFoundGraphQLError for a different org unit', async () => {
    const user = await createUser(db);
    const { organization, type } = await createOrganizationWithType(
      db,
      `Other Org ${crypto.randomUUID()}`,
    );
    const otherUnit = await createUnit(db, {
      organizationId: organization.id,
      typeId: type.id,
      name: 'Other Unit',
    });

    const openInput = new AddTimeEntryInput();
    openInput.volunteerId = user.id;
    openInput.startedAt = new Date();
    openInput.endedAt = null;
    openInput.notes = null;
    const opened = await service.addTimeEntry(organizationUnitId, openInput, user.id);

    await expect(
      service.closeTimeEntry(opened.id, otherUnit.id, {
        endedAt: new Date(),
        notes: null,
      }, user.id),
    ).rejects.toThrow(NotFoundGraphQLError);
  });

  it('findAll includes shift-less entries for the org unit', async () => {
    const user = await createUser(db);
    const input = new AddTimeEntryInput();
    input.volunteerId = user.id;
    input.startedAt = new Date();
    input.endedAt = new Date();
    input.notes = null;
    const created = await service.addTimeEntry(organizationUnitId, input, user.id);

    const { entries } = await service.findAll(organizationUnitId, {
      limit: 50,
      offset: 0,
    });

    expect(entries.some((e) => e.id === created.id)).toBe(true);
  });

  it('findByUser includes shift-less entries for that volunteer and org unit', async () => {
    const user = await createUser(db);
    const input = new AddTimeEntryInput();
    input.volunteerId = user.id;
    input.startedAt = new Date();
    input.endedAt = new Date();
    input.notes = null;
    const created = await service.addTimeEntry(organizationUnitId, input, user.id);

    const { entries } = await service.findByUser(organizationUnitId, user.id, {
      limit: 50,
      offset: 0,
    });

    expect(entries.map((e) => e.id)).toContain(created.id);
  });

  it('updateTimeEntry clears shiftInstanceId when set to null (unlink)', async () => {
    const user = await createUser(db);
    const { id: shiftId } = await createShift(db, { organizationUnitId });
    const instances = await db.query.shiftInstances.findMany({
      where: { masterId: shiftId },
    });
    const instanceId = instances[0]?.id;
    expect(instanceId).toBeDefined();

    const input = new AddTimeEntryInput();
    input.shiftInstanceId = instanceId ?? '';
    input.volunteerId = user.id;
    input.startedAt = new Date('2026-08-01T08:00:00Z');
    input.endedAt = new Date('2026-08-01T10:00:00Z');
    input.notes = null;
    const entry = await service.addTimeEntry(organizationUnitId, input, user.id);

    const updated = await service.updateTimeEntry(entry.id, organizationUnitId, {
        shiftInstanceId: null,
        startedAt: input.startedAt,
        endedAt: input.endedAt,
        notes: null,
      }, user.id);

    expect(updated.shiftInstanceId).toBeNull();
  });

  it('updateTimeEntry links a shift-less entry to a shift in the same org unit', async () => {
    const user = await createUser(db);
    const { id: shiftId } = await createShift(db, { organizationUnitId });
    const instances = await db.query.shiftInstances.findMany({
      where: { masterId: shiftId },
    });
    const instanceId = instances[0]?.id;
    expect(instanceId).toBeDefined();

    const input = new AddTimeEntryInput();
    input.volunteerId = user.id;
    input.startedAt = new Date('2026-08-02T08:00:00Z');
    input.endedAt = new Date('2026-08-02T10:00:00Z');
    input.notes = null;
    const entry = await service.addTimeEntry(organizationUnitId, input, user.id);
    expect(entry.shiftInstanceId).toBeNull();

    const updated = await service.updateTimeEntry(entry.id, organizationUnitId, {
        shiftInstanceId: instanceId ?? '',
        startedAt: input.startedAt,
        endedAt: input.endedAt,
        notes: null,
      }, user.id);

    expect(updated.shiftInstanceId).toBe(instanceId);
  });

  it('updateTimeEntry rejects a shift instance from a different org unit', async () => {
    const user = await createUser(db);
    const { organization, type } = await createOrganizationWithType(
      db,
      `Other Org ${crypto.randomUUID()}`,
    );
    const otherUnit = await createUnit(db, {
      organizationId: organization.id,
      typeId: type.id,
      name: 'Other Unit',
    });
    const { id: otherShiftId } = await createShift(db, {
      organizationUnitId: otherUnit.id,
    });
    const otherInstances = await db.query.shiftInstances.findMany({
      where: { masterId: otherShiftId },
    });
    const otherInstanceId = otherInstances[0]?.id;
    expect(otherInstanceId).toBeDefined();

    const input = new AddTimeEntryInput();
    input.volunteerId = user.id;
    input.startedAt = new Date('2026-08-03T08:00:00Z');
    input.endedAt = new Date('2026-08-03T10:00:00Z');
    input.notes = null;
    const entry = await service.addTimeEntry(organizationUnitId, input, user.id);

    await expect(
      service.updateTimeEntry(entry.id, organizationUnitId, {
        shiftInstanceId: otherInstanceId ?? '',
        startedAt: input.startedAt,
        endedAt: input.endedAt,
        notes: null,
      }, user.id),
    ).rejects.toThrow(NotFoundGraphQLError);
  });

  it('updateTimeEntry rejects re-opening a second shift-less entry for the same volunteer and org unit', async () => {
    const user = await createUser(db);

    const first = new AddTimeEntryInput();
    first.volunteerId = user.id;
    first.startedAt = new Date();
    first.endedAt = null;
    first.notes = null;
    await service.addTimeEntry(organizationUnitId, first, user.id);

    const second = new AddTimeEntryInput();
    second.volunteerId = user.id;
    second.startedAt = new Date('2026-08-04T08:00:00Z');
    second.endedAt = new Date('2026-08-04T10:00:00Z');
    second.notes = null;
    const closed = await service.addTimeEntry(organizationUnitId, second, user.id);

    await expect(
      service.updateTimeEntry(closed.id, organizationUnitId, {
        shiftInstanceId: null,
        startedAt: second.startedAt,
        endedAt: null,
        notes: null,
      }, user.id),
    ).rejects.toThrow(ConflictGraphQLError);

    const entries = await db.query.timeEntries.findMany({
      where: {
        volunteerId: user.id,
        endedAt: { isNull: true },
      },
    });
    expect(entries).toHaveLength(1);
  });
});

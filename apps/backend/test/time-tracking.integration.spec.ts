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
import { ConflictGraphQLError } from '../src/graphql/errors';
import { ShiftInviteStatus } from '../src/shift/enums';
import { AddTimeEntryInput } from '../src/time-tracking/inputs/add-time-entry.input';
import { TimeTrackingService } from '../src/time-tracking/time-tracking.service';
import { createShift, createUser } from './factories';
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

    await service.addTimeEntry(organizationUnitId, input);

    await expect(
      service.addTimeEntry(organizationUnitId, input),
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
});

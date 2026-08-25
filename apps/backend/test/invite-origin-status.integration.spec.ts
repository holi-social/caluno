import 'reflect-metadata';
import {
  beforeAll,
  describe,
  expect,
  it,
  mock,
  setDefaultTimeout,
} from 'bun:test';
import type { INestApplication } from '@nestjs/common';
import type { Database } from '../src/database/database.module';
import * as schema from '../src/database/schema';
import { EventInviteOrigin, EventInviteStatus } from '../src/event/enums';
import { EventService } from '../src/event/event.service';
import { ShiftInviteOrigin, ShiftInviteStatus } from '../src/shift/enums';
import { ShiftService } from '../src/shift/shift.service';
import { createEvent, createShift, createUser } from './factories';
import { applyBunAuthMocks } from './helpers/auth-mocks';
import { getGraphqlTestContext } from './helpers/graphql-test-context';

applyBunAuthMocks(mock.module);
setDefaultTimeout(20_000);

describe('VOLI-1139 invite origin + status', () => {
  let app: INestApplication;
  let db: Database;
  let organizationUnitId: string;
  let shiftService: ShiftService;
  let eventService: EventService;

  beforeAll(async () => {
    const context = await getGraphqlTestContext();
    app = context.app;
    db = context.db;
    organizationUnitId = context.organizationUnitId;
    shiftService = app.get(ShiftService);
    eventService = app.get(EventService);
  });

  const firstInstanceId = async (shiftId: string): Promise<string> => {
    const instances = await db.query.shiftInstances.findMany({
      where: { masterId: shiftId },
    });
    const instanceId = instances[0]?.id;
    if (!instanceId) {
      throw new Error('Expected shift instance');
    }
    return instanceId;
  };

  it('admin uninvite of outstanding invite writes ADMIN_REJECTED and preserves origin', async () => {
    const { id: shiftId } = await createShift(db, { organizationUnitId });
    const instanceId = await firstInstanceId(shiftId);
    const volunteer = await createUser(db);

    await db.insert(schema.shiftInstanceInvites).values({
      instanceId,
      userId: volunteer.id,
      origin: ShiftInviteOrigin.ADMIN_INVITED,
      status: null,
    });

    await shiftService.updateShiftInstanceInviteStatus(
      volunteer.id,
      instanceId,
      ShiftInviteStatus.ADMIN_REJECTED,
    );

    const row = await db.query.shiftInstanceInvites.findFirst({
      where: { instanceId, userId: volunteer.id },
    });
    expect(row?.origin).toBe(ShiftInviteOrigin.ADMIN_INVITED);
    expect(row?.status).toBe(ShiftInviteStatus.ADMIN_REJECTED);
  });

  it('admin uninvite of participating invite writes ADMIN_CANCELLED and preserves origin', async () => {
    const { id: shiftId } = await createShift(db, { organizationUnitId });
    const instanceId = await firstInstanceId(shiftId);
    const accepted = await createUser(db);
    const signedUp = await createUser(db);

    await db.insert(schema.shiftInstanceInvites).values([
      {
        instanceId,
        userId: accepted.id,
        origin: ShiftInviteOrigin.ADMIN_INVITED,
        status: ShiftInviteStatus.VOLUNTEER_ACCEPTED,
      },
      {
        instanceId,
        userId: signedUp.id,
        origin: ShiftInviteOrigin.VOLUNTEER_JOINED,
        status: null,
      },
    ]);

    await shiftService.updateShiftInstanceInviteStatus(
      accepted.id,
      instanceId,
      ShiftInviteStatus.ADMIN_CANCELLED,
    );
    await shiftService.updateShiftInstanceInviteStatus(
      signedUp.id,
      instanceId,
      ShiftInviteStatus.ADMIN_CANCELLED,
    );

    const acceptedRow = await db.query.shiftInstanceInvites.findFirst({
      where: { instanceId, userId: accepted.id },
    });
    const signedUpRow = await db.query.shiftInstanceInvites.findFirst({
      where: { instanceId, userId: signedUp.id },
    });
    expect(acceptedRow?.origin).toBe(ShiftInviteOrigin.ADMIN_INVITED);
    expect(acceptedRow?.status).toBe(ShiftInviteStatus.ADMIN_CANCELLED);
    expect(signedUpRow?.origin).toBe(ShiftInviteOrigin.VOLUNTEER_JOINED);
    expect(signedUpRow?.status).toBe(ShiftInviteStatus.ADMIN_CANCELLED);
  });

  it('admin re-invite from ADMIN_REJECTED and ADMIN_CANCELLED restores ADMIN_INVITED + null', async () => {
    const { id: shiftId } = await createShift(db, { organizationUnitId });
    const instanceId = await firstInstanceId(shiftId);
    const rejected = await createUser(db);
    const cancelled = await createUser(db);

    await db.insert(schema.shiftInstanceInvites).values([
      {
        instanceId,
        userId: rejected.id,
        origin: null,
        status: ShiftInviteStatus.ADMIN_REJECTED,
      },
      {
        instanceId,
        userId: cancelled.id,
        origin: ShiftInviteOrigin.VOLUNTEER_JOINED,
        status: ShiftInviteStatus.ADMIN_CANCELLED,
      },
    ]);

    await shiftService.updateShiftInstanceInviteStatus(
      rejected.id,
      instanceId,
      null,
    );
    await shiftService.updateShiftInstanceInviteStatus(
      cancelled.id,
      instanceId,
      null,
    );

    const rejectedRow = await db.query.shiftInstanceInvites.findFirst({
      where: { instanceId, userId: rejected.id },
    });
    const cancelledRow = await db.query.shiftInstanceInvites.findFirst({
      where: { instanceId, userId: cancelled.id },
    });
    expect(rejectedRow?.origin).toBe(ShiftInviteOrigin.ADMIN_INVITED);
    expect(rejectedRow?.status).toBeNull();
    expect(cancelledRow?.origin).toBe(ShiftInviteOrigin.ADMIN_INVITED);
    expect(cancelledRow?.status).toBeNull();
  });

  it('volunteer decline of outstanding invite writes VOLUNTEER_REJECTED; leave writes VOLUNTEER_CANCELLED', async () => {
    const { id: shiftId } = await createShift(db, { organizationUnitId });
    const instanceId = await firstInstanceId(shiftId);
    const declining = await createUser(db);
    const leaving = await createUser(db);

    await db.insert(schema.shiftInstanceInvites).values([
      {
        instanceId,
        userId: declining.id,
        origin: ShiftInviteOrigin.ADMIN_INVITED,
        status: null,
      },
      {
        instanceId,
        userId: leaving.id,
        origin: ShiftInviteOrigin.ADMIN_INVITED,
        status: ShiftInviteStatus.VOLUNTEER_ACCEPTED,
      },
    ]);

    await shiftService.updateShiftInstanceInviteStatus(
      declining.id,
      instanceId,
      ShiftInviteStatus.VOLUNTEER_REJECTED,
    );
    await shiftService.updateShiftInstanceInviteStatus(
      leaving.id,
      instanceId,
      ShiftInviteStatus.VOLUNTEER_CANCELLED,
    );

    const declinedRow = await db.query.shiftInstanceInvites.findFirst({
      where: { instanceId, userId: declining.id },
    });
    const leftRow = await db.query.shiftInstanceInvites.findFirst({
      where: { instanceId, userId: leaving.id },
    });
    expect(declinedRow?.origin).toBe(ShiftInviteOrigin.ADMIN_INVITED);
    expect(declinedRow?.status).toBe(ShiftInviteStatus.VOLUNTEER_REJECTED);
    expect(leftRow?.origin).toBe(ShiftInviteOrigin.ADMIN_INVITED);
    expect(leftRow?.status).toBe(ShiftInviteStatus.VOLUNTEER_CANCELLED);
  });

  it('cancelling an instance sets isCancelled and does not change invite origin or status', async () => {
    const { id: shiftId } = await createShift(db, { organizationUnitId });
    const instanceId = await firstInstanceId(shiftId);
    const volunteer = await createUser(db);

    await db.insert(schema.shiftInstanceInvites).values({
      instanceId,
      userId: volunteer.id,
      origin: ShiftInviteOrigin.ADMIN_INVITED,
      status: ShiftInviteStatus.VOLUNTEER_ACCEPTED,
    });

    await shiftService.deleteShiftInstance(instanceId, organizationUnitId);

    const instance = await db.query.shiftInstances.findFirst({
      where: { id: instanceId },
    });
    const invite = await db.query.shiftInstanceInvites.findFirst({
      where: { instanceId, userId: volunteer.id },
    });
    expect(instance?.isCancelled).toBe(true);
    expect(invite?.origin).toBe(ShiftInviteOrigin.ADMIN_INVITED);
    expect(invite?.status).toBe(ShiftInviteStatus.VOLUNTEER_ACCEPTED);
  });

  it('event uninvite cascade splits outstanding vs participating; re-invite restores only admin-ended', async () => {
    const event = await createEvent(db, { organizationUnitId });
    const { id: shiftId } = await createShift(db, {
      organizationUnitId,
      eventId: event.id,
    });
    const instanceId = await firstInstanceId(shiftId);

    const outstanding = await createUser(db);
    const participating = await createUser(db);
    const volunteerEnded = await createUser(db);

    await db.insert(schema.eventInvites).values([
      {
        eventId: event.id,
        userId: outstanding.id,
        origin: EventInviteOrigin.ADMIN_INVITED,
        status: null,
      },
      {
        eventId: event.id,
        userId: participating.id,
        origin: EventInviteOrigin.ADMIN_INVITED,
        status: EventInviteStatus.VOLUNTEER_ACCEPTED,
      },
      {
        eventId: event.id,
        userId: volunteerEnded.id,
        origin: EventInviteOrigin.ADMIN_INVITED,
        status: EventInviteStatus.VOLUNTEER_REJECTED,
      },
    ]);
    await db.insert(schema.shiftInvites).values([
      {
        shiftId,
        userId: outstanding.id,
        origin: ShiftInviteOrigin.ADMIN_INVITED,
        status: null,
      },
      {
        shiftId,
        userId: participating.id,
        origin: ShiftInviteOrigin.ADMIN_INVITED,
        status: ShiftInviteStatus.VOLUNTEER_ACCEPTED,
      },
      {
        shiftId,
        userId: volunteerEnded.id,
        origin: ShiftInviteOrigin.ADMIN_INVITED,
        status: ShiftInviteStatus.VOLUNTEER_REJECTED,
      },
    ]);
    await db.insert(schema.shiftInstanceInvites).values([
      {
        instanceId,
        userId: outstanding.id,
        origin: ShiftInviteOrigin.ADMIN_INVITED,
        status: null,
      },
      {
        instanceId,
        userId: participating.id,
        origin: ShiftInviteOrigin.VOLUNTEER_JOINED,
        status: null,
      },
      {
        instanceId,
        userId: volunteerEnded.id,
        origin: ShiftInviteOrigin.ADMIN_INVITED,
        status: ShiftInviteStatus.VOLUNTEER_CANCELLED,
      },
    ]);

    await eventService.updateEventInviteStatus(
      outstanding.id,
      event.id,
      EventInviteStatus.ADMIN_REJECTED,
    );
    await eventService.updateEventInviteStatus(
      participating.id,
      event.id,
      EventInviteStatus.ADMIN_CANCELLED,
    );

    const outstandingShift = await db.query.shiftInvites.findFirst({
      where: { shiftId, userId: outstanding.id },
    });
    const outstandingInstance = await db.query.shiftInstanceInvites.findFirst({
      where: { instanceId, userId: outstanding.id },
    });
    const participatingShift = await db.query.shiftInvites.findFirst({
      where: { shiftId, userId: participating.id },
    });
    const participatingInstance = await db.query.shiftInstanceInvites.findFirst(
      {
        where: { instanceId, userId: participating.id },
      },
    );
    const volunteerEndedShift = await db.query.shiftInvites.findFirst({
      where: { shiftId, userId: volunteerEnded.id },
    });
    const volunteerEndedInstance =
      await db.query.shiftInstanceInvites.findFirst({
        where: { instanceId, userId: volunteerEnded.id },
      });

    expect(outstandingShift?.origin).toBe(ShiftInviteOrigin.ADMIN_INVITED);
    expect(outstandingShift?.status).toBe(ShiftInviteStatus.ADMIN_REJECTED);
    expect(outstandingInstance?.origin).toBe(ShiftInviteOrigin.ADMIN_INVITED);
    expect(outstandingInstance?.status).toBe(ShiftInviteStatus.ADMIN_REJECTED);
    expect(participatingShift?.origin).toBe(ShiftInviteOrigin.ADMIN_INVITED);
    expect(participatingShift?.status).toBe(ShiftInviteStatus.ADMIN_CANCELLED);
    expect(participatingInstance?.origin).toBe(
      ShiftInviteOrigin.VOLUNTEER_JOINED,
    );
    expect(participatingInstance?.status).toBe(
      ShiftInviteStatus.ADMIN_CANCELLED,
    );
    expect(volunteerEndedShift?.status).toBe(
      ShiftInviteStatus.VOLUNTEER_REJECTED,
    );
    expect(volunteerEndedInstance?.status).toBe(
      ShiftInviteStatus.VOLUNTEER_CANCELLED,
    );

    await eventService.updateEventInviteStatus(outstanding.id, event.id, null);
    await eventService.updateEventInviteStatus(
      participating.id,
      event.id,
      null,
    );

    const restoredOutstanding = await db.query.shiftInstanceInvites.findFirst({
      where: { instanceId, userId: outstanding.id },
    });
    const restoredParticipating = await db.query.shiftInstanceInvites.findFirst(
      {
        where: { instanceId, userId: participating.id },
      },
    );
    const stillVolunteerEnded = await db.query.shiftInstanceInvites.findFirst({
      where: { instanceId, userId: volunteerEnded.id },
    });

    expect(restoredOutstanding?.origin).toBe(ShiftInviteOrigin.ADMIN_INVITED);
    expect(restoredOutstanding?.status).toBeNull();
    expect(restoredParticipating?.origin).toBe(ShiftInviteOrigin.ADMIN_INVITED);
    expect(restoredParticipating?.status).toBeNull();
    expect(stillVolunteerEnded?.status).toBe(
      ShiftInviteStatus.VOLUNTEER_CANCELLED,
    );
  });
});

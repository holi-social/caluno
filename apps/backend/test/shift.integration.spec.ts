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
import { eq } from 'drizzle-orm';
import type { Database } from '../src/database/database.module';
import * as schema from '../src/database/schema';
import { ShiftInviteStatus, ShiftVisibility } from '../src/shift/enums';
import {
  cancelShiftInstance,
  createMembershipRequest,
  createShift,
  createShiftInstance,
  createUser,
} from './factories';
import { applyBunAuthMocks, setAuthMockUserId } from './helpers/auth-mocks';
import {
  graphqlRequest,
  graphqlRequestRequiringData,
} from './helpers/graphql-request';
import { getGraphqlTestContext } from './helpers/graphql-test-context';

applyBunAuthMocks(mock.module);
setDefaultTimeout(20_000);

describe('ShiftService.findShiftsForWeek', () => {
  let app: INestApplication;
  let db: Database;
  let organizationUnitId: string;

  beforeAll(async () => {
    const context = await getGraphqlTestContext();
    app = context.app;
    db = context.db;
    organizationUnitId = context.organizationUnitId;
  });

  it('returns instances within the week and excludes cancelled instances', async () => {
    const { id: shiftId } = await createShift(db, {
      organizationUnitId,
      startsAt: new Date('2026-06-15T08:00:00.000Z'),
      endsAt: new Date('2026-06-15T10:00:00.000Z'),
    });

    const instances = await db.query.shiftInstances.findMany({
      where: { masterId: shiftId },
    });
    const instanceId = instances[0]?.id;
    expect(instanceId).toBeDefined();

    const from = new Date('2026-06-15T00:00:00.000Z');
    const to = new Date('2026-06-22T00:00:00.000Z');

    const weekData = await graphqlRequestRequiringData<{
      weeklyShifts: Array<{ id: string }>;
    }>(
      app,
      {
        query: `
          query WeeklyShifts($from: DateTime!, $to: DateTime!) {
            weeklyShifts(from: $from, to: $to) {
              id
            }
          }
        `,
        variables: {
          from: from.toISOString(),
          to: to.toISOString(),
        },
        headers: {
          'x-organization-unit-id': organizationUnitId,
        },
      },
      'weeklyShifts',
    );

    expect(weekData.weeklyShifts.map((instance) => instance.id)).toContain(
      instanceId,
    );

    await cancelShiftInstance(db, instanceId);

    const weekDataAfterCancel = await graphqlRequestRequiringData<{
      weeklyShifts: Array<{ id: string }>;
    }>(
      app,
      {
        query: `
          query WeeklyShifts($from: DateTime!, $to: DateTime!) {
            weeklyShifts(from: $from, to: $to) {
              id
            }
          }
        `,
        variables: {
          from: from.toISOString(),
          to: to.toISOString(),
        },
        headers: {
          'x-organization-unit-id': organizationUnitId,
        },
      },
      'weeklyShifts',
    );

    expect(
      weekDataAfterCancel.weeklyShifts.map((instance) => instance.id),
    ).not.toContain(instanceId);
  });

  it('invites members to all non-cancelled instances of a shift', async () => {
    const user = await createUser(db);
    const { id: shiftId } = await createShift(db, {
      organizationUnitId,
      visibility: ShiftVisibility.INVITED_MEMBERS,
    });

    await Promise.all([
      createShiftInstance(db, shiftId, {
        actualStartsAt: new Date('2026-06-19T08:00:00.000Z'),
        actualEndsAt: new Date('2026-06-19T10:00:00.000Z'),
        occurrenceIndex: 1,
      }),
      createShiftInstance(db, shiftId, {
        actualStartsAt: new Date('2026-06-20T08:00:00.000Z'),
        actualEndsAt: new Date('2026-06-20T10:00:00.000Z'),
        occurrenceIndex: 2,
      }),
    ]);

    const instances = await db.query.shiftInstances.findMany({
      where: { masterId: shiftId },
      orderBy: { actualStartsAt: 'asc' },
    });
    expect(instances).toHaveLength(3);

    const cancelledInstanceId = instances[1]?.id;
    expect(cancelledInstanceId).toBeDefined();
    await cancelShiftInstance(db, cancelledInstanceId);

    await graphqlRequestRequiringData<{
      updateMembersForShiftInstance: { id: string };
    }>(
      app,
      {
        query: `
          mutation updateMembersForShiftInstance($shiftInstanceId: String!, $memberIds: [String!]!) {
            updateMembersForShiftInstance(instanceId: $shiftInstanceId, memberIds: $memberIds, inviteToAllInstances: true) {
              id
            }
          }
        `,
        variables: {
          shiftInstanceId: instances[0].id,
          memberIds: [user.id],
        },
        headers: {
          'x-organization-unit-id': organizationUnitId,
        },
      },
      'updateMembersForShiftInstance',
    );

    const invites = await db.query.shiftInstanceInvites.findMany({
      where: { userId: user.id, status: ShiftInviteStatus.ACCEPTED },
    });
    const activeInstanceIds = instances
      .map((instance) => instance.id)
      .filter((id) => id !== cancelledInstanceId);

    expect(invites.map((invite) => invite.instanceId).sort()).toEqual(
      activeInstanceIds.sort(),
    );
    expect(invites.map((invite) => invite.instanceId)).not.toContain(
      cancelledInstanceId,
    );

    const shiftInvites = await db.query.shiftInvites.findMany({
      where: {
        shiftId,
        userId: user.id,
        status: ShiftInviteStatus.ACCEPTED,
      },
    });
    expect(shiftInvites).toHaveLength(1);
  });

  it('invites members only to instances from the given date onwards', async () => {
    const userId = `shift-past-future-invite-user-${crypto.randomUUID()}`;
    await db.insert(schema.users).values({
      id: userId,
      name: 'Shift Past Future Invite User',
      email: `shift-past-future-invite-${crypto.randomUUID()}@example.com`,
    });

    const createShiftData = await graphqlRequestRequiringData<{
      createShift: { id: string };
    }>(
      app,
      {
        query: `
          mutation CreateShift($input: CreateShiftInput!) {
            createShift(input: $input) {
              id
            }
          }
        `,
        variables: {
          input: {
            title: `Past Future Invite Shift ${crypto.randomUUID()}`,
            instructions: null,
            location: null,
            startsAt: '2020-01-01T08:00:00.000Z',
            endsAt: '2020-01-01T10:00:00.000Z',
            visibility: 'INVITED_MEMBERS',
            maxVolunteers: null,
            minVolunteers: null,
            invitedMemberIds: [],
            rrule: null,
          },
        },
        headers: {
          'x-organization-unit-id': organizationUnitId,
        },
      },
      'createShift',
    );

    const shiftId = createShiftData.createShift.id;
    const [pastInstance, futureInstance] = await db
      .insert(schema.shiftInstances)
      .values([
        {
          masterId: shiftId,
          actualStartsAt: new Date('2020-01-02T08:00:00.000Z'),
          actualEndsAt: new Date('2020-01-02T10:00:00.000Z'),
          occurrenceIndex: 1,
        },
        {
          masterId: shiftId,
          actualStartsAt: new Date('2030-01-01T08:00:00.000Z'),
          actualEndsAt: new Date('2030-01-01T10:00:00.000Z'),
          occurrenceIndex: 2,
        },
      ])
      .returning();

    if (!pastInstance || !futureInstance) {
      throw new Error('Expected additional shift instances to be created');
    }

    await graphqlRequestRequiringData<{
      updateMembersForShiftInstance: { id: string };
    }>(
      app,
      {
        query: `
          mutation updateMembersForShiftInstance(
            $instanceId: String!
            $memberIds: [String!]!
          ) {
            updateMembersForShiftInstance(
              instanceId: $instanceId
              memberIds: $memberIds
              inviteToAllInstances: true
            ) {
              id
            }
          }
        `,
        variables: {
          instanceId: futureInstance.id,
          memberIds: [userId],
        },
        headers: {
          'x-organization-unit-id': organizationUnitId,
        },
      },
      'updateMembersForShiftInstance',
    );

    const invites = await db.query.shiftInstanceInvites.findMany({
      where: { userId, status: ShiftInviteStatus.ACCEPTED },
    });

    const invitedInstanceIds = invites
      .map((invite) => invite.instanceId)
      .sort();
    expect(invitedInstanceIds).toContain(futureInstance.id);
    expect(invitedInstanceIds).not.toContain(pastInstance.id);

    const shiftInvites = await db.query.shiftInvites.findMany({
      where: {
        shiftId,
        userId,
        status: ShiftInviteStatus.ACCEPTED,
      },
    });
    expect(shiftInvites).toHaveLength(1);
  });

  it('removes members from the shift and future instances when syncing from a date', async () => {
    const userId = `shift-remove-future-user-${crypto.randomUUID()}`;
    await db.insert(schema.users).values({
      id: userId,
      name: 'Shift Remove Future User',
      email: `shift-remove-future-${crypto.randomUUID()}@example.com`,
    });

    const createShiftData = await graphqlRequestRequiringData<{
      createShift: { id: string };
    }>(
      app,
      {
        query: `
          mutation CreateShift($input: CreateShiftInput!) {
            createShift(input: $input) {
              id
            }
          }
        `,
        variables: {
          input: {
            title: `Remove Future Shift ${crypto.randomUUID()}`,
            instructions: null,
            location: null,
            startsAt: '2020-01-01T08:00:00.000Z',
            endsAt: '2020-01-01T10:00:00.000Z',
            visibility: 'INVITED_MEMBERS',
            maxVolunteers: null,
            minVolunteers: null,
            invitedMemberIds: [],
            rrule: null,
          },
        },
        headers: {
          'x-organization-unit-id': organizationUnitId,
        },
      },
      'createShift',
    );

    const shiftId = createShiftData.createShift.id;
    const [pastInstance, futureInstance] = await db
      .insert(schema.shiftInstances)
      .values([
        {
          masterId: shiftId,
          actualStartsAt: new Date('2020-01-02T08:00:00.000Z'),
          actualEndsAt: new Date('2020-01-02T10:00:00.000Z'),
          occurrenceIndex: 1,
        },
        {
          masterId: shiftId,
          actualStartsAt: new Date('2030-01-01T08:00:00.000Z'),
          actualEndsAt: new Date('2030-01-01T10:00:00.000Z'),
          occurrenceIndex: 2,
        },
      ])
      .returning();

    if (!pastInstance || !futureInstance) {
      throw new Error('Expected additional shift instances to be created');
    }

    await graphqlRequestRequiringData<{
      updateMembersForShiftInstance: { id: string };
    }>(
      app,
      {
        query: `
          mutation updateMembersForShiftInstance(
            $instanceId: String!
            $memberIds: [String!]!
          ) {
            updateMembersForShiftInstance(
              instanceId: $instanceId
              memberIds: $memberIds
              inviteToAllInstances: true
            ) {
              id
            }
          }
        `,
        variables: {
          instanceId: pastInstance.id,
          memberIds: [userId],
        },
        headers: {
          'x-organization-unit-id': organizationUnitId,
        },
      },
      'updateMembersForShiftInstance',
    );

    await graphqlRequestRequiringData<{
      updateMembersForShiftInstance: { id: string };
    }>(
      app,
      {
        query: `
          mutation UpdateMembersForShiftInstance(
            $instanceId: String!
            $memberIds: [String!]!
          ) {
            updateMembersForShiftInstance(
              instanceId: $instanceId
              memberIds: $memberIds
              inviteToAllInstances: true
            ) {
              id
            }
          }
        `,
        variables: {
          instanceId: futureInstance.id,
          memberIds: [],
        },
        headers: {
          'x-organization-unit-id': organizationUnitId,
        },
      },
      'updateMembersForShiftInstance',
    );

    const instanceInvites = await db.query.shiftInstanceInvites.findMany({
      where: { userId, status: ShiftInviteStatus.ACCEPTED },
    });
    const invitedInstanceIds = instanceInvites.map(
      (invite) => invite.instanceId,
    );
    expect(invitedInstanceIds).toContain(pastInstance.id);
    expect(invitedInstanceIds).not.toContain(futureInstance.id);

    const shiftInvites = await db.query.shiftInvites.findMany({
      where: { shiftId, userId, status: ShiftInviteStatus.ACCEPTED },
    });
    expect(shiftInvites).toHaveLength(0);
  });

  it('approves a shift membership request into only the intended shift instance', async () => {
    const user = await createUser(db);
    const { id: shiftId } = await createShift(db, { organizationUnitId });

    const existingInstances = await db.query.shiftInstances.findMany({
      where: { masterId: shiftId },
    });
    const intendedInstanceId = existingInstances[0]?.id;
    expect(intendedInstanceId).toBeDefined();

    const otherInstance = await createShiftInstance(db, shiftId, {
      actualStartsAt: new Date('2026-06-17T08:00:00.000Z'),
      actualEndsAt: new Date('2026-06-17T10:00:00.000Z'),
      occurrenceIndex: 1,
    });

    const membershipRequest = await createMembershipRequest(db, {
      userId: user.id,
      organizationUnitId,
      metadata: {
        intendedShiftInstanceIds: [intendedInstanceId],
      },
    });

    await graphqlRequestRequiringData<{
      approveMembershipRequest: { id: string };
    }>(
      app,
      {
        query: `
          mutation ApproveMembershipRequest($id: ID!, $organizationUnitId: ID!) {
            approveMembershipRequest(
              id: $id
              organizationUnitId: $organizationUnitId
            ) {
              id
            }
          }
        `,
        variables: {
          id: membershipRequest.id,
          organizationUnitId,
        },
        headers: {
          'x-organization-unit-id': organizationUnitId,
        },
      },
      'approveMembershipRequest',
    );

    const invites = await db.query.shiftInstanceInvites.findMany({
      where: { userId: user.id, status: ShiftInviteStatus.ACCEPTED },
    });

    expect(invites.map((invite) => invite.instanceId).sort()).toEqual([
      intendedInstanceId,
    ]);
    expect(invites.map((invite) => invite.instanceId)).not.toContain(
      otherInstance.id,
    );
  });

  it('approves a shift membership request into all intended shift instances', async () => {
    const user = await createUser(db);
    const { id: shiftId } = await createShift(db, { organizationUnitId });

    const [, cancelledInstance] = await Promise.all([
      createShiftInstance(db, shiftId, {
        actualStartsAt: new Date(Date.now() + 300000),
        actualEndsAt: new Date(Date.now() + 400000),
        occurrenceIndex: 1,
      }),
      createShiftInstance(db, shiftId, {
        actualStartsAt: new Date(Date.now() + 500000),
        actualEndsAt: new Date(Date.now() + 600000),
        isCancelled: true,
        occurrenceIndex: 2,
      }),
    ]);

    const instances = await db.query.shiftInstances.findMany({
      where: { masterId: shiftId },
      orderBy: { actualStartsAt: 'asc' },
    });
    expect(instances).toHaveLength(3);

    const membershipRequest = await createMembershipRequest(db, {
      userId: user.id,
      organizationUnitId,
      metadata: {
        intendedShiftIds: [shiftId],
      },
    });

    await graphqlRequestRequiringData<{
      approveMembershipRequest: { id: string };
    }>(
      app,
      {
        query: `
          mutation ApproveMembershipRequest($id: ID!, $organizationUnitId: ID!) {
            approveMembershipRequest(
              id: $id
              organizationUnitId: $organizationUnitId
            ) {
              id
            }
          }
        `,
        variables: {
          id: membershipRequest.id,
          organizationUnitId,
        },
        headers: {
          'x-organization-unit-id': organizationUnitId,
        },
      },
      'approveMembershipRequest',
    );

    const invites = await db.query.shiftInstanceInvites.findMany({
      where: { userId: user.id, status: ShiftInviteStatus.ACCEPTED },
    });
    const activeInstanceIds = instances
      .filter((instance) => !instance.isCancelled)
      .map((instance) => instance.id);

    expect(invites.map((invite) => invite.instanceId).sort()).toEqual(
      activeInstanceIds.sort(),
    );
    expect(invites.map((invite) => invite.instanceId)).not.toContain(
      cancelledInstance.id,
    );
  });

  it('rejects inviting members to a deleted shift', async () => {
    const userId = `deleted-shift-invite-user-${crypto.randomUUID()}`;
    await db.insert(schema.users).values({
      id: userId,
      name: 'Deleted Shift Invite User',
      email: `deleted-shift-invite-${crypto.randomUUID()}@example.com`,
    });

    const createShiftData = await graphqlRequestRequiringData<{
      createShift: { id: string };
    }>(
      app,
      {
        query: `
          mutation CreateShift($input: CreateShiftInput!) {
            createShift(input: $input) {
              id
            }
          }
        `,
        variables: {
          input: {
            title: `Deleted Invite Shift ${crypto.randomUUID()}`,
            instructions: null,
            location: null,
            startsAt: '2026-06-18T08:00:00.000Z',
            endsAt: '2026-06-18T10:00:00.000Z',
            visibility: 'INVITED_MEMBERS',
            maxVolunteers: null,
            minVolunteers: null,
            invitedMemberIds: [],
            rrule: null,
          },
        },
        headers: {
          'x-organization-unit-id': organizationUnitId,
        },
      },
      'createShift',
    );

    const shiftId = createShiftData.createShift.id;

    await db
      .update(schema.shifts)
      .set({ isDeleted: true })
      .where(eq(schema.shifts.id, shiftId));

    const instance = await db.query.shiftInstances.findFirst({
      where: { masterId: shiftId },
    });

    const response = await graphqlRequest<{
      updateMembersForShiftInstance: { id: string };
    }>(app, {
      query: `
          mutation updateMembersForShiftInstance(
            $instanceId: String!
            $memberIds: [String!]!
          ) {
            updateMembersForShiftInstance(
              instanceId: $instanceId
              memberIds: $memberIds
              inviteToAllInstances: true
            ) {
              id
            }
          }
      `,
      variables: {
        instanceId: instance?.id,
        memberIds: [userId],
      },
      headers: {
        'x-organization-unit-id': organizationUnitId,
      },
    });

    expect(response.errors).toBeDefined();
    expect(response.errors?.[0]?.message).toMatch(
      /Shift instance with ID .* not found/,
    );
  });

  it('rejects inviting members to an instance of a deleted shift', async () => {
    const userId = `deleted-master-invite-user-${crypto.randomUUID()}`;
    await db.insert(schema.users).values({
      id: userId,
      name: 'Deleted Master Invite User',
      email: `deleted-master-invite-${crypto.randomUUID()}@example.com`,
    });

    const createShiftData = await graphqlRequestRequiringData<{
      createShift: { id: string };
    }>(
      app,
      {
        query: `
          mutation CreateShift($input: CreateShiftInput!) {
            createShift(input: $input) {
              id
            }
          }
        `,
        variables: {
          input: {
            title: `Deleted Master Invite Shift ${crypto.randomUUID()}`,
            instructions: null,
            location: null,
            startsAt: '2026-06-18T08:00:00.000Z',
            endsAt: '2026-06-18T10:00:00.000Z',
            visibility: 'INVITED_MEMBERS',
            maxVolunteers: null,
            minVolunteers: null,
            invitedMemberIds: [],
            rrule: null,
          },
        },
        headers: {
          'x-organization-unit-id': organizationUnitId,
        },
      },
      'createShift',
    );

    const shiftId = createShiftData.createShift.id;
    const instances = await db.query.shiftInstances.findMany({
      where: { masterId: shiftId },
    });
    const instanceId = instances[0]?.id;
    expect(instanceId).toBeDefined();

    await db
      .update(schema.shifts)
      .set({ isDeleted: true })
      .where(eq(schema.shifts.id, shiftId));

    const response = await graphqlRequest<{
      updateMembersForShiftInstance: { id: string };
    }>(app, {
      query: `
        mutation updateMembersForShiftInstance($instanceId: String!, $memberIds: [String!]!) {
          updateMembersForShiftInstance(instanceId: $instanceId, memberIds: $memberIds) {
            id
          }
        }
      `,
      variables: {
        instanceId,
        memberIds: [userId],
      },
      headers: {
        'x-organization-unit-id': organizationUnitId,
      },
    });

    expect(response.errors).toBeDefined();
    expect(response.errors?.[0]?.message).toMatch(
      /Shift instance with ID .* not found/,
    );
  });
});

describe('Volunteer home fields and check-in', () => {
  let app: INestApplication;
  let db: Database;
  let organizationUnitId: string;
  let testUserId: string;

  beforeAll(async () => {
    const context = await getGraphqlTestContext();
    app = context.app;
    db = context.db;
    organizationUnitId = context.organizationUnitId;
    testUserId = context.testUserId;
  });

  it('returns filledCount from accepted invites', async () => {
    const volunteer = await createUser(db);
    const { id: shiftId } = await createShift(db, {
      organizationUnitId,
      maxVolunteers: 5,
    });
    const instances = await db.query.shiftInstances.findMany({
      where: { masterId: shiftId },
    });
    const instanceId = instances[0]?.id;
    expect(instanceId).toBeDefined();

    await db.insert(schema.shiftInstanceInvites).values({
      instanceId: instanceId ?? '',
      userId: volunteer.id,
      status: ShiftInviteStatus.ACCEPTED,
    });

    const data = await graphqlRequestRequiringData<{
      shiftInstances: Array<{ id: string; filledCount: number }>;
    }>(
      app,
      {
        query: `
          query ShiftInstances($shiftId: ID!) {
            shiftInstances(shiftId: $shiftId) {
              id
              filledCount
            }
          }
        `,
        variables: { shiftId },
        headers: {
          'x-organization-unit-id': organizationUnitId,
        },
      },
      'shiftInstances',
    );

    const instance = data.shiftInstances.find((i) => i.id === instanceId);
    expect(instance?.filledCount).toBe(1);
  });

  it('returns event data on a shift linked to an event', async () => {
    const eventData = await graphqlRequestRequiringData<{
      createEvent: { id: string };
    }>(
      app,
      {
        query: `
          mutation CreateEvent($input: CreateEventInput!) {
            createEvent(input: $input) {
              id
            }
          }
        `,
        variables: {
          input: {
            title: 'Test Event',
            location: null,
            logoUrl: null,
            coverUrl: 'https://example.com/cover.jpg',
            startsAt: '2026-06-18T08:00:00.000Z',
            endsAt: '2026-06-18T10:00:00.000Z',
            invitedMemberIds: null,
          },
        },
        headers: {
          'x-organization-unit-id': organizationUnitId,
        },
      },
      'createEvent',
    );

    const { id: shiftId } = await createShift(db, {
      organizationUnitId,
    });
    await db
      .update(schema.shifts)
      .set({ eventId: eventData.createEvent.id })
      .where(eq(schema.shifts.id, shiftId));

    const data = await graphqlRequestRequiringData<{
      shift: {
        id: string;
        event: { title: string; coverImageUrl: string } | null;
      };
    }>(
      app,
      {
        query: `
          query Shift($id: String!) {
            shift(id: $id) {
              id
              event {
                title
                coverImageUrl
              }
            }
          }
        `,
        variables: { id: shiftId },
        headers: {
          'x-organization-unit-id': organizationUnitId,
        },
      },
      'shift',
    );

    expect(data.shift.event?.title).toBe('Test Event');
    expect(data.shift.event?.coverImageUrl).toBe(
      'https://example.com/cover.jpg',
    );
  });

  it('returns isCheckedIn when the user has an open time entry', async () => {
    const { id: shiftId } = await createShift(db, {
      organizationUnitId,
    });
    const instances = await db.query.shiftInstances.findMany({
      where: { masterId: shiftId },
    });
    const instanceId = instances[0]?.id;
    expect(instanceId).toBeDefined();

    await db.insert(schema.shiftInstanceInvites).values({
      instanceId: instanceId ?? '',
      userId: testUserId,
      status: ShiftInviteStatus.ACCEPTED,
    });

    await db.insert(schema.timeEntries).values({
      shiftInstanceId: instanceId ?? '',
      volunteerId: testUserId,
      startedAt: new Date(),
    });

    const data = await graphqlRequestRequiringData<{
      shiftInstances: Array<{ id: string; isCheckedIn: boolean }>;
    }>(
      app,
      {
        query: `
          query ShiftInstances($shiftId: ID!) {
            shiftInstances(shiftId: $shiftId) {
              id
              isCheckedIn
            }
          }
        `,
        variables: { shiftId },
        headers: {
          'x-organization-unit-id': organizationUnitId,
        },
      },
      'shiftInstances',
    );

    const instance = data.shiftInstances.find((i) => i.id === instanceId);
    expect(instance?.isCheckedIn).toBe(true);
  });

  it('checks in and out a booked volunteer', async () => {
    const volunteer = await createUser(db);
    setAuthMockUserId(volunteer.id);

    await db.insert(schema.memberships).values({
      userId: volunteer.id,
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
      userId: volunteer.id,
      status: ShiftInviteStatus.ACCEPTED,
    });

    const checkInData = await graphqlRequestRequiringData<{
      checkIn: { id: string; startedAt: string; endedAt: string | null };
    }>(
      app,
      {
        query: `
          mutation CheckIn($shiftInstanceId: ID!) {
            checkIn(shiftInstanceId: $shiftInstanceId) {
              id
              startedAt
              endedAt
            }
          }
        `,
        variables: { shiftInstanceId: instanceId },
        headers: {
          'x-organization-unit-id': organizationUnitId,
        },
      },
      'checkIn',
    );

    expect(checkInData.checkIn.endedAt).toBeNull();

    const checkOutData = await graphqlRequestRequiringData<{
      checkOut: { id: string; endedAt: string };
    }>(
      app,
      {
        query: `
          mutation CheckOut($shiftInstanceId: ID!) {
            checkOut(shiftInstanceId: $shiftInstanceId) {
              id
              endedAt
            }
          }
        `,
        variables: { shiftInstanceId: instanceId },
        headers: {
          'x-organization-unit-id': organizationUnitId,
        },
      },
      'checkOut',
    );

    expect(checkOutData.checkOut.endedAt).not.toBeNull();
    expect(checkOutData.checkOut.id).toBe(checkInData.checkIn.id);

    setAuthMockUserId(testUserId);
  });

  it('rejects self check-in outside the shift window', async () => {
    const volunteer = await createUser(db);
    setAuthMockUserId(volunteer.id);

    await db.insert(schema.memberships).values({
      userId: volunteer.id,
      organizationUnitId,
    });

    // Default factory instance is dated 2026-06-18 — well outside the window.
    const { id: shiftId } = await createShift(db, { organizationUnitId });
    const instances = await db.query.shiftInstances.findMany({
      where: { masterId: shiftId },
    });
    const instanceId = instances[0]?.id;

    await db.insert(schema.shiftInstanceInvites).values({
      instanceId: instanceId ?? '',
      userId: volunteer.id,
      status: ShiftInviteStatus.ACCEPTED,
    });

    const response = await graphqlRequest<{ checkIn: { id: string } }>(app, {
      query: `
        mutation CheckIn($shiftInstanceId: ID!) {
          checkIn(shiftInstanceId: $shiftInstanceId) {
            id
          }
        }
      `,
      variables: { shiftInstanceId: instanceId },
      headers: { 'x-organization-unit-id': organizationUnitId },
    });

    expect(response.errors).toBeDefined();
    expect(response.errors?.[0]?.message).toMatch(/around the shift time/);

    setAuthMockUserId(testUserId);
  });

  it('lists my booked shift instances', async () => {
    await db.insert(schema.memberships).values({
      userId: testUserId,
      organizationUnitId,
    });

    const { id: shiftId } = await createShift(db, {
      organizationUnitId,
    });
    const instances = await db.query.shiftInstances.findMany({
      where: { masterId: shiftId },
      orderBy: { actualStartsAt: 'asc' },
    });
    const instanceId = instances[0]?.id;
    expect(instanceId).toBeDefined();

    await db.insert(schema.shiftInstanceInvites).values({
      instanceId: instanceId ?? '',
      userId: testUserId,
      status: ShiftInviteStatus.ACCEPTED,
    });

    const data = await graphqlRequestRequiringData<{
      myShiftInstances: Array<{ id: string }>;
    }>(
      app,
      {
        query: `
          query MyShiftInstances($includePast: Boolean!) {
            myShiftInstances(includePast: $includePast) {
              id
            }
          }
        `,
        variables: { includePast: true },
        headers: {
          'x-organization-unit-id': organizationUnitId,
        },
      },
      'myShiftInstances',
    );

    expect(data.myShiftInstances.map((i) => i.id)).toContain(instanceId);
  });

  it('lists available shift instances', async () => {
    await db.insert(schema.memberships).values({
      userId: testUserId,
      organizationUnitId,
    });

    const { id: shiftId } = await createShift(db, {
      organizationUnitId,
      visibility: ShiftVisibility.ALL_MEMBERS,
    });
    const instances = await db.query.shiftInstances.findMany({
      where: { masterId: shiftId },
    });
    const instanceId = instances[0]?.id;
    expect(instanceId).toBeDefined();

    const from = new Date('2026-06-01T00:00:00.000Z').toISOString();
    const to = new Date('2026-12-31T23:59:59.000Z').toISOString();

    const data = await graphqlRequestRequiringData<{
      availableShiftInstances: Array<{ id: string }>;
    }>(
      app,
      {
        query: `
          query AvailableShiftInstances($from: DateTime, $to: DateTime) {
            availableShiftInstances(from: $from, to: $to) {
              id
            }
          }
        `,
        variables: { from, to },
        headers: {
          'x-organization-unit-id': organizationUnitId,
        },
      },
      'availableShiftInstances',
    );

    expect(data.availableShiftInstances.map((i) => i.id)).toContain(instanceId);
  });

  it('excludes signed-up shifts from available instances', async () => {
    await db.insert(schema.memberships).values({
      userId: testUserId,
      organizationUnitId,
    });

    const { id: shiftId } = await createShift(db, {
      organizationUnitId,
      visibility: ShiftVisibility.ALL_MEMBERS,
    });
    const instances = await db.query.shiftInstances.findMany({
      where: { masterId: shiftId },
    });
    const instanceId = instances[0]?.id;
    expect(instanceId).toBeDefined();

    await db.insert(schema.shiftInstanceInvites).values({
      instanceId: instanceId ?? '',
      userId: testUserId,
      status: ShiftInviteStatus.ACCEPTED,
    });

    const from = new Date('2026-06-01T00:00:00.000Z').toISOString();
    const to = new Date('2026-12-31T23:59:59.000Z').toISOString();

    const data = await graphqlRequestRequiringData<{
      availableShiftInstances: Array<{ id: string }>;
    }>(
      app,
      {
        query: `
          query AvailableShiftInstances($from: DateTime, $to: DateTime) {
            availableShiftInstances(from: $from, to: $to) {
              id
            }
          }
        `,
        variables: { from, to },
        headers: {
          'x-organization-unit-id': organizationUnitId,
        },
      },
      'availableShiftInstances',
    );

    expect(data.availableShiftInstances.map((i) => i.id)).not.toContain(
      instanceId,
    );
  });
});

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
import { NotFoundGraphQLError } from '../src/graphql/errors';
import { ShiftInviteStatus, ShiftVisibility } from '../src/shift/enums';
import { ShiftService } from '../src/shift/shift.service';
import {
  cancelShiftInstance,
  createMembershipRequest,
  createShift,
  createShiftInstance,
  createUser,
} from './factories';
import {
  createOrganizationWithType,
  createUnit,
} from './factories/org.factory';
import { applyBunAuthMocks, setAuthMockUserId } from './helpers/auth-mocks';
import {
  graphqlRequest,
  graphqlRequestRequiringData,
} from './helpers/graphql-request';
import { getGraphqlTestContext } from './helpers/graphql-test-context';

applyBunAuthMocks(mock.module);
setDefaultTimeout(20_000);

describe('ShiftService.findById', () => {
  let app: INestApplication;
  let db: Database;
  let organizationUnitId: string;
  let shiftService: ShiftService;

  beforeAll(async () => {
    const context = await getGraphqlTestContext();
    app = context.app;
    db = context.db;
    organizationUnitId = context.organizationUnitId;
    shiftService = app.get(ShiftService);
  });

  it('does not return soft-deleted shifts', async () => {
    const deletedShift = await createShift(db, { organizationUnitId });
    await db
      .update(schema.shifts)
      .set({ isDeleted: true })
      .where(eq(schema.shifts.id, deletedShift.id));

    await expect(shiftService.findById(deletedShift.id)).rejects.toThrow(
      NotFoundGraphQLError,
    );
  });
});

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
      where: { userId: user.id },
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
        status: ShiftInviteStatus.INVITED,
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
      where: { userId, status: ShiftInviteStatus.INVITED },
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
        status: ShiftInviteStatus.INVITED,
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
      where: { userId, status: ShiftInviteStatus.INVITED },
    });
    const invitedInstanceIds = instanceInvites.map(
      (invite) => invite.instanceId,
    );
    expect(invitedInstanceIds).toContain(pastInstance.id);
    expect(invitedInstanceIds).not.toContain(futureInstance.id);

    const shiftInvites = await db.query.shiftInvites.findMany({
      where: { shiftId, userId },
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

  it('returns master for shift instances when master is not eager-loaded', async () => {
    const { id: shiftId, title } = await createShift(db, {
      organizationUnitId,
      title: 'Morning shift',
    });
    const instances = await db.query.shiftInstances.findMany({
      where: { masterId: shiftId },
    });
    const instanceId = instances[0]?.id;
    expect(instanceId).toBeDefined();

    const data = await graphqlRequestRequiringData<{
      shiftInstances: Array<{
        id: string;
        master: { id: string; title: string };
      }>;
    }>(
      app,
      {
        query: `
          query ShiftInstances($shiftId: ID!) {
            shiftInstances(shiftId: $shiftId) {
              id
              master {
                id
                title
              }
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
    expect(instance?.master).toEqual({ id: shiftId, title });
  });

  it('returns invites for the requested user', async () => {
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

    const [insertedInvite] = await db
      .insert(schema.shiftInstanceInvites)
      .values({
        instanceId: instanceId ?? '',
        userId: volunteer.id,
        status: ShiftInviteStatus.INVITED,
      })
      .returning();

    const data = await graphqlRequestRequiringData<{
      shiftInstances: Array<{
        id: string;
        invites: {
          id: string;
          status: ShiftInviteStatus;
          userId: string;
        } | null;
      }>;
    }>(
      app,
      {
        query: `
          query ShiftInstances($shiftId: ID!, $userId: String!) {
            shiftInstances(shiftId: $shiftId) {
              id
              invites(userId: $userId) {
                id
                status
                userId
              }
            }
          }
        `,
        variables: { shiftId, userId: volunteer.id },
        headers: {
          'x-organization-unit-id': organizationUnitId,
        },
      },
      'shiftInstances',
    );

    const instance = data.shiftInstances.find((i) => i.id === instanceId);
    expect(instance?.invites).toEqual({
      id: insertedInvite?.id,
      status: ShiftInviteStatus.INVITED,
      userId: volunteer.id,
    });
  });

  it('returns null invites when the user has no invite', async () => {
    const volunteer = await createUser(db);
    const otherUser = await createUser(db);
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
      shiftInstances: Array<{
        id: string;
        invites: { id: string } | null;
      }>;
    }>(
      app,
      {
        query: `
          query ShiftInstances($shiftId: ID!, $userId: String!) {
            shiftInstances(shiftId: $shiftId) {
              id
              invites(userId: $userId) {
                id
              }
            }
          }
        `,
        variables: { shiftId, userId: otherUser.id },
        headers: {
          'x-organization-unit-id': organizationUnitId,
        },
      },
      'shiftInstances',
    );

    const instance = data.shiftInstances.find((i) => i.id === instanceId);
    expect(instance?.invites).toBeNull();
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
            logoFileId: null,
            coverFileId: null,
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
      .update(schema.events)
      .set({ coverUrl: 'https://example.com/cover.jpg' })
      .where(eq(schema.events.id, eventData.createEvent.id));
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
    setAuthMockUserId(testUserId);

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

    // A shift ~10 days in the past, well outside the [start-3h, end+1h] window.
    const outsideWindowStart = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    const { id: shiftId } = await createShift(db, {
      organizationUnitId,
      startsAt: outsideWindowStart,
      endsAt: new Date(outsideWindowStart.getTime() + 2 * 60 * 60 * 1000),
    });
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

  it('includes an ongoing overnight shift when includePast is false', async () => {
    await db.insert(schema.memberships).values({
      userId: testUserId,
      organizationUnitId,
    });

    const now = Date.now();
    const { id: shiftId } = await createShift(db, {
      organizationUnitId,
      startsAt: new Date(now - 25 * 60 * 60 * 1000), // started yesterday
      endsAt: new Date(now + 60 * 60 * 1000), // ends in an hour
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
        variables: { includePast: false },
        headers: {
          'x-organization-unit-id': organizationUnitId,
        },
      },
      'myShiftInstances',
    );

    expect(data.myShiftInstances.map((i) => i.id)).toContain(instanceId);
  });

  it('excludes a finished shift when includePast is false', async () => {
    await db.insert(schema.memberships).values({
      userId: testUserId,
      organizationUnitId,
    });

    const now = Date.now();
    const { id: shiftId } = await createShift(db, {
      organizationUnitId,
      startsAt: new Date(now - 3 * 60 * 60 * 1000),
      endsAt: new Date(now - 60 * 60 * 1000),
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
        variables: { includePast: false },
        headers: {
          'x-organization-unit-id': organizationUnitId,
        },
      },
      'myShiftInstances',
    );

    expect(data.myShiftInstances.map((i) => i.id)).not.toContain(instanceId);
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

  it('lists available shift instances in descendant units for parent-unit members', async () => {
    const parentMember = await createUser(db);

    const rootUnit = await db.query.organizationUnits.findFirst({
      where: { id: organizationUnitId },
      columns: { organizationId: true, typeId: true },
    });
    if (!rootUnit?.organizationId || !rootUnit?.typeId) {
      throw new Error('Root unit missing organizationId or typeId');
    }

    const [childUnit] = await db
      .insert(schema.organizationUnits)
      .values({
        organizationId: rootUnit.organizationId,
        parentId: organizationUnitId,
        typeId: rootUnit.typeId,
        name: `Child Unit ${crypto.randomUUID()}`,
        slug: `child-unit-${crypto.randomUUID()}`,
      })
      .returning();
    expect(childUnit).toBeDefined();

    await db.insert(schema.memberships).values({
      userId: parentMember.id,
      organizationUnitId,
    });

    const { id: shiftId } = await createShift(db, {
      organizationUnitId: childUnit.id,
      visibility: ShiftVisibility.ALL_MEMBERS,
    });
    const instances = await db.query.shiftInstances.findMany({
      where: { masterId: shiftId },
    });
    const instanceId = instances[0]?.id;
    expect(instanceId).toBeDefined();

    setAuthMockUserId(parentMember.id);

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
      },
      'availableShiftInstances',
    );

    expect(data.availableShiftInstances.map((i) => i.id)).toContain(instanceId);

    setAuthMockUserId(testUserId);
  });

  it('lists my booked shift instances in descendant units for parent-unit members', async () => {
    const parentMember = await createUser(db);

    const rootUnit = await db.query.organizationUnits.findFirst({
      where: { id: organizationUnitId },
      columns: { organizationId: true, typeId: true },
    });
    if (!rootUnit?.organizationId || !rootUnit?.typeId) {
      throw new Error('Root unit missing organizationId or typeId');
    }

    const [childUnit] = await db
      .insert(schema.organizationUnits)
      .values({
        organizationId: rootUnit.organizationId,
        parentId: organizationUnitId,
        typeId: rootUnit.typeId,
        name: `Child Unit ${crypto.randomUUID()}`,
        slug: `child-unit-${crypto.randomUUID()}`,
      })
      .returning();
    expect(childUnit).toBeDefined();

    await db.insert(schema.memberships).values({
      userId: parentMember.id,
      organizationUnitId,
    });

    const { id: shiftId } = await createShift(db, {
      organizationUnitId: childUnit.id,
      visibility: ShiftVisibility.INVITED_MEMBERS,
    });
    const instances = await db.query.shiftInstances.findMany({
      where: { masterId: shiftId },
    });
    const instanceId = instances[0]?.id;
    expect(instanceId).toBeDefined();

    await db.insert(schema.shiftInstanceInvites).values({
      instanceId: instanceId ?? '',
      userId: parentMember.id,
      status: ShiftInviteStatus.ACCEPTED,
    });

    setAuthMockUserId(parentMember.id);

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
      },
      'myShiftInstances',
    );

    expect(data.myShiftInstances.map((i) => i.id)).toContain(instanceId);

    setAuthMockUserId(testUserId);
  });
});

describe('Shift invite status model', () => {
  let app: INestApplication;
  let db: Database;
  let organizationUnitId: string;

  beforeAll(async () => {
    const context = await getGraphqlTestContext();
    app = context.app;
    db = context.db;
    organizationUnitId = context.organizationUnitId;
  });

  it('does not count INVITED invites in filledCount', async () => {
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
      status: ShiftInviteStatus.INVITED,
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
    expect(instance?.filledCount).toBe(0);
  });

  it('propagates ShiftInvite status changes to future shift instance invites', async () => {
    const shiftService = app.get(ShiftService);

    const user = await createUser(db);
    const { id: shiftId } = await createShift(db, {
      organizationUnitId,
      visibility: ShiftVisibility.INVITED_MEMBERS,
    });

    const futureInstance = await createShiftInstance(db, shiftId, {
      actualStartsAt: new Date(Date.now() + 86_400_000),
      actualEndsAt: new Date(Date.now() + 90_000_000),
      occurrenceIndex: 1,
    });

    await db.insert(schema.shiftInvites).values({
      shiftId,
      userId: user.id,
      status: ShiftInviteStatus.INVITED,
    });
    await db.insert(schema.shiftInstanceInvites).values({
      instanceId: futureInstance.id,
      userId: user.id,
      status: ShiftInviteStatus.INVITED,
    });

    await shiftService.updateShiftInviteStatus(
      user.id,
      shiftId,
      ShiftInviteStatus.ACCEPTED,
    );

    const instanceInvite = await db.query.shiftInstanceInvites.findFirst({
      where: {
        instanceId: futureInstance.id,
        userId: user.id,
      },
    });

    expect(instanceInvite?.status).toBe(ShiftInviteStatus.ACCEPTED);
  });
});

describe('ShiftInstance.instanceInvites (VOLI-842)', () => {
  let app: INestApplication;
  let db: Database;
  let organizationUnitId: string;

  beforeAll(async () => {
    const context = await getGraphqlTestContext();
    app = context.app;
    db = context.db;
    organizationUnitId = context.organizationUnitId;
  });

  it('returns invitees with status including SELF_JOINED distinct from ACCEPTED', async () => {
    const { id: shiftId } = await createShift(db, { organizationUnitId });
    const instances = await db.query.shiftInstances.findMany({
      where: { masterId: shiftId },
    });
    const instanceId = instances[0]?.id;
    expect(instanceId).toBeDefined();

    const invited = await createUser(db);
    const accepted = await createUser(db);
    const signedUp = await createUser(db);
    const declined = await createUser(db);
    const cancelled = await createUser(db);
    const rejected = await createUser(db);

    await db.insert(schema.shiftInstanceInvites).values([
      {
        instanceId: instanceId!,
        userId: invited.id,
        status: ShiftInviteStatus.INVITED,
      },
      {
        instanceId: instanceId!,
        userId: accepted.id,
        status: ShiftInviteStatus.ACCEPTED,
      },
      {
        instanceId: instanceId!,
        userId: signedUp.id,
        status: ShiftInviteStatus.SELF_JOINED,
      },
      {
        instanceId: instanceId!,
        userId: declined.id,
        status: ShiftInviteStatus.VOLUNTEER_REJECTED,
      },
      {
        instanceId: instanceId!,
        userId: cancelled.id,
        status: ShiftInviteStatus.CANCELLED,
      },
      {
        instanceId: instanceId!,
        userId: rejected.id,
        status: ShiftInviteStatus.ADMIN_REJECTED,
      },
    ]);

    const data = await graphqlRequestRequiringData<{
      shiftInstances: Array<{
        id: string;
        instanceInvites: Array<{
          status: string;
          user: { id: string; name: string };
        }>;
      }>;
    }>(
      app,
      {
        query: `
          query ShiftInstanceInvites($shiftId: ID!) {
            shiftInstances(shiftId: $shiftId) {
              id
              instanceInvites {
                status
                user { id name }
              }
            }
          }
        `,
        variables: { shiftId },
        headers: { 'x-organization-unit-id': organizationUnitId },
      },
      'shiftInstances',
    );

    const instance = data.shiftInstances.find((row) => row.id === instanceId);
    expect(instance).toBeDefined();
    const byUser = new Map(
      instance!.instanceInvites.map((invite) => [
        invite.user.id,
        invite.status,
      ]),
    );
    expect(byUser.get(invited.id)).toBe(ShiftInviteStatus.INVITED);
    expect(byUser.get(accepted.id)).toBe(ShiftInviteStatus.ACCEPTED);
    expect(byUser.get(signedUp.id)).toBe(ShiftInviteStatus.SELF_JOINED);
    expect(byUser.get(declined.id)).toBe(ShiftInviteStatus.VOLUNTEER_REJECTED);
    expect(byUser.get(cancelled.id)).toBe(ShiftInviteStatus.CANCELLED);
    expect(byUser.get(rejected.id)).toBe(ShiftInviteStatus.ADMIN_REJECTED);
    expect(byUser.get(accepted.id)).not.toBe(byUser.get(signedUp.id));
  });

  it('updateShiftInstanceInviteStatus sets ADMIN_REJECTED to INVITED for admin', async () => {
    const { id: shiftId } = await createShift(db, { organizationUnitId });
    const instances = await db.query.shiftInstances.findMany({
      where: { masterId: shiftId },
    });
    const instanceId = instances[0]?.id;
    expect(instanceId).toBeDefined();

    const volunteer = await createUser(db);
    await db.insert(schema.shiftInstanceInvites).values({
      instanceId: instanceId!,
      userId: volunteer.id,
      status: ShiftInviteStatus.ADMIN_REJECTED,
    });

    const data = await graphqlRequestRequiringData<{
      updateShiftInstanceInviteStatus: { status: string; userId: string };
    }>(
      app,
      {
        query: `
          mutation UpdateInviteStatus(
            $instanceId: String!
            $userId: String!
            $status: ShiftInviteStatus!
          ) {
            updateShiftInstanceInviteStatus(
              instanceId: $instanceId
              userId: $userId
              status: $status
            ) {
              status
              userId
            }
          }
        `,
        variables: {
          instanceId,
          userId: volunteer.id,
          status: ShiftInviteStatus.INVITED,
        },
        headers: { 'x-organization-unit-id': organizationUnitId },
      },
      'updateShiftInstanceInviteStatus',
    );

    expect(data.updateShiftInstanceInviteStatus.status).toBe(
      ShiftInviteStatus.INVITED,
    );
    expect(data.updateShiftInstanceInviteStatus.userId).toBe(volunteer.id);

    const row = await db.query.shiftInstanceInvites.findFirst({
      where: { instanceId: instanceId!, userId: volunteer.id },
    });
    expect(row?.status).toBe(ShiftInviteStatus.INVITED);
  });

  it('updateShiftInstanceInviteStatus sets ACCEPTED to ADMIN_REJECTED for admin', async () => {
    const { id: shiftId } = await createShift(db, { organizationUnitId });
    const instances = await db.query.shiftInstances.findMany({
      where: { masterId: shiftId },
    });
    const instanceId = instances[0]?.id;
    expect(instanceId).toBeDefined();

    const volunteer = await createUser(db);
    await db.insert(schema.shiftInstanceInvites).values({
      instanceId: instanceId!,
      userId: volunteer.id,
      status: ShiftInviteStatus.ACCEPTED,
    });

    const data = await graphqlRequestRequiringData<{
      updateShiftInstanceInviteStatus: { status: string; userId: string };
    }>(
      app,
      {
        query: `
          mutation UpdateInviteStatus(
            $instanceId: String!
            $userId: String!
            $status: ShiftInviteStatus!
          ) {
            updateShiftInstanceInviteStatus(
              instanceId: $instanceId
              userId: $userId
              status: $status
            ) {
              status
              userId
            }
          }
        `,
        variables: {
          instanceId,
          userId: volunteer.id,
          status: ShiftInviteStatus.ADMIN_REJECTED,
        },
        headers: { 'x-organization-unit-id': organizationUnitId },
      },
      'updateShiftInstanceInviteStatus',
    );

    expect(data.updateShiftInstanceInviteStatus.status).toBe(
      ShiftInviteStatus.ADMIN_REJECTED,
    );
    expect(data.updateShiftInstanceInviteStatus.userId).toBe(volunteer.id);

    const row = await db.query.shiftInstanceInvites.findFirst({
      where: { instanceId: instanceId!, userId: volunteer.id },
    });
    expect(row?.status).toBe(ShiftInviteStatus.ADMIN_REJECTED);
  });

  it('updateShiftInstanceInviteStatus sets SELF_JOINED to ADMIN_REJECTED for admin', async () => {
    const { id: shiftId } = await createShift(db, { organizationUnitId });
    const instances = await db.query.shiftInstances.findMany({
      where: { masterId: shiftId },
    });
    const instanceId = instances[0]?.id;
    expect(instanceId).toBeDefined();

    const volunteer = await createUser(db);
    await db.insert(schema.shiftInstanceInvites).values({
      instanceId: instanceId!,
      userId: volunteer.id,
      status: ShiftInviteStatus.SELF_JOINED,
    });

    const data = await graphqlRequestRequiringData<{
      updateShiftInstanceInviteStatus: { status: string; userId: string };
    }>(
      app,
      {
        query: `
          mutation UpdateInviteStatus(
            $instanceId: String!
            $userId: String!
            $status: ShiftInviteStatus!
          ) {
            updateShiftInstanceInviteStatus(
              instanceId: $instanceId
              userId: $userId
              status: $status
            ) {
              status
              userId
            }
          }
        `,
        variables: {
          instanceId,
          userId: volunteer.id,
          status: ShiftInviteStatus.ADMIN_REJECTED,
        },
        headers: { 'x-organization-unit-id': organizationUnitId },
      },
      'updateShiftInstanceInviteStatus',
    );

    expect(data.updateShiftInstanceInviteStatus.status).toBe(
      ShiftInviteStatus.ADMIN_REJECTED,
    );
    expect(data.updateShiftInstanceInviteStatus.userId).toBe(volunteer.id);

    const row = await db.query.shiftInstanceInvites.findFirst({
      where: { instanceId: instanceId!, userId: volunteer.id },
    });
    expect(row?.status).toBe(ShiftInviteStatus.ADMIN_REJECTED);
  });

  it('keeps instanceInvites order stable after admin uninvite', async () => {
    const { id: shiftId } = await createShift(db, { organizationUnitId });
    const instances = await db.query.shiftInstances.findMany({
      where: { masterId: shiftId },
    });
    const instanceId = instances[0]?.id;
    expect(instanceId).toBeDefined();

    const first = await createUser(db);
    const second = await createUser(db);
    const third = await createUser(db);
    const sharedCreatedAt = new Date('2026-01-01T12:00:00.000Z');

    await db.insert(schema.shiftInstanceInvites).values([
      {
        instanceId: instanceId!,
        userId: first.id,
        status: ShiftInviteStatus.INVITED,
        createdAt: sharedCreatedAt,
        updatedAt: sharedCreatedAt,
      },
      {
        instanceId: instanceId!,
        userId: second.id,
        status: ShiftInviteStatus.INVITED,
        createdAt: sharedCreatedAt,
        updatedAt: sharedCreatedAt,
      },
      {
        instanceId: instanceId!,
        userId: third.id,
        status: ShiftInviteStatus.INVITED,
        createdAt: sharedCreatedAt,
        updatedAt: sharedCreatedAt,
      },
    ]);

    const queryInstanceInvites = () =>
      graphqlRequestRequiringData<{
        shiftInstances: Array<{
          id: string;
          instanceInvites: Array<{ user: { id: string } }>;
        }>;
      }>(
        app,
        {
          query: `
            query ShiftInstanceInvites($shiftId: ID!) {
              shiftInstances(shiftId: $shiftId) {
                id
                instanceInvites {
                  user { id }
                }
              }
            }
          `,
          variables: { shiftId },
          headers: { 'x-organization-unit-id': organizationUnitId },
        },
        'shiftInstances',
      );

    const before = await queryInstanceInvites();
    const orderBefore =
      before.shiftInstances
        .find((row) => row.id === instanceId)
        ?.instanceInvites.map((invite) => invite.user.id) ?? [];
    expect(orderBefore).toHaveLength(3);

    await graphqlRequestRequiringData(
      app,
      {
        query: `
          mutation UpdateInviteStatus(
            $instanceId: String!
            $userId: String!
            $status: ShiftInviteStatus!
          ) {
            updateShiftInstanceInviteStatus(
              instanceId: $instanceId
              userId: $userId
              status: $status
            ) {
              status
            }
          }
        `,
        variables: {
          instanceId,
          userId: second.id,
          status: ShiftInviteStatus.ADMIN_REJECTED,
        },
        headers: { 'x-organization-unit-id': organizationUnitId },
      },
      'updateShiftInstanceInviteStatus',
    );

    const after = await queryInstanceInvites();
    const orderAfter =
      after.shiftInstances
        .find((row) => row.id === instanceId)
        ?.instanceInvites.map((invite) => invite.user.id) ?? [];

    expect(orderAfter).toEqual(orderBefore);
  });

  it('does not leak instanceInvites across organizations', async () => {
    const { organization, type } = await createOrganizationWithType(
      db,
      `Other Org ${crypto.randomUUID()}`,
    );
    const otherUnit = await createUnit(db, {
      organizationId: organization.id,
      typeId: type.id,
      name: `Other Unit ${crypto.randomUUID()}`,
    });

    const { id: foreignShiftId } = await createShift(db, {
      organizationUnitId: otherUnit.id,
    });
    const foreignInstances = await db.query.shiftInstances.findMany({
      where: { masterId: foreignShiftId },
    });
    const foreignInstanceId = foreignInstances[0]?.id;
    expect(foreignInstanceId).toBeDefined();

    const foreignUser = await createUser(db);
    await db.insert(schema.shiftInstanceInvites).values({
      instanceId: foreignInstanceId!,
      userId: foreignUser.id,
      status: ShiftInviteStatus.INVITED,
    });

    const response = await graphqlRequest<{
      shiftInstances: Array<{
        id: string;
        instanceInvites: Array<{ user: { id: string } }>;
      }>;
    }>(app, {
      query: `
        query ShiftInstanceInvites($shiftId: ID!) {
          shiftInstances(shiftId: $shiftId) {
            id
            instanceInvites {
              user { id }
            }
          }
        }
      `,
      variables: { shiftId: foreignShiftId },
      headers: { 'x-organization-unit-id': organizationUnitId },
    });

    // Wrong-org shift must not return the foreign invitees (empty list or not found).
    if (response.errors?.length) {
      expect(response.errors[0]?.message).toMatch(
        /not found|Forbidden|denied/i,
      );
      return;
    }
    const invites =
      response.data?.shiftInstances.flatMap((row) => row.instanceInvites) ?? [];
    expect(invites.map((invite) => invite.user.id)).not.toContain(
      foreignUser.id,
    );
  });
});

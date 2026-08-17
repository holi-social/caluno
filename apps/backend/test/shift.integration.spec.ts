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
import { PERMISSIONS } from '../src/auth/constants';
import type { Database } from '../src/database/database.module';
import * as schema from '../src/database/schema';
import { NotFoundGraphQLError } from '../src/graphql/errors';
import { RequiredFormTargetType } from '../src/requirement-profile/enums';
import { RequiredFormService } from '../src/requirement-profile/services/required-form.service';
import { JoinStatus } from '../src/shared/enums/join-status.enum';
import { ShiftInviteStatus, ShiftVisibility } from '../src/shift/enums';
import { ShiftService } from '../src/shift/shift.service';
import {
  cancelShiftInstance,
  createFormSubmission,
  createMembershipRequest,
  createRequirementForm,
  createShift,
  createShiftInstance,
  createUser,
} from './factories';
import {
  addMembership,
  createOrganizationWithType,
  createUnit,
} from './factories/org.factory';
import {
  assignRoleToMembership,
  createRole,
  grantPermissionToRole,
} from './factories/role.factory';
import {
  applyBunAuthMocks,
  getAuthMockUserId,
  setAuthMockUserId,
} from './helpers/auth-mocks';
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

    const startsAfter = new Date('2026-06-15T00:00:00.000Z');
    const endsBefore = new Date('2026-06-22T00:00:00.000Z');

    const weekData = await graphqlRequestRequiringData<{
      weeklyShifts: Array<{ id: string }>;
    }>(
      app,
      {
        query: `
          query WeeklyShifts($startsAfter: DateTime!, $endsBefore: DateTime!) {
            weeklyShifts(startsAfter: $startsAfter, endsBefore: $endsBefore) {
              id
            }
          }
        `,
        variables: {
          startsAfter: startsAfter.toISOString(),
          endsBefore: endsBefore.toISOString(),
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
          query WeeklyShifts($startsAfter: DateTime!, $endsBefore: DateTime!) {
            weeklyShifts(startsAfter: $startsAfter, endsBefore: $endsBefore) {
              id
            }
          }
        `,
        variables: {
          startsAfter: startsAfter.toISOString(),
          endsBefore: endsBefore.toISOString(),
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

  it('returns invite for the requested user', async () => {
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
        invite: {
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
              invite(userId: $userId) {
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
    expect(instance?.invite).toEqual({
      id: insertedInvite?.id,
      status: ShiftInviteStatus.INVITED,
      userId: volunteer.id,
    });
  });

  it('returns null invite when the user has no invite', async () => {
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
        invite: { id: string } | null;
      }>;
    }>(
      app,
      {
        query: `
          query ShiftInstances($shiftId: ID!, $userId: String!) {
            shiftInstances(shiftId: $shiftId) {
              id
              invite(userId: $userId) {
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
    expect(instance?.invite).toBeNull();
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
      myShiftInstances: {
        items: Array<{ id: string }>;
        pagination: {
          total: number;
          limit: number;
          offset: number;
          hasMore: boolean;
        };
      };
    }>(
      app,
      {
        query: `
          query MyShiftInstances($includePast: Boolean!) {
            myShiftInstances(includePast: $includePast) {
              items { id }
              pagination { total limit offset hasMore }
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

    expect(data.myShiftInstances.items.map((i) => i.id)).toContain(instanceId);
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
      myShiftInstances: {
        items: Array<{ id: string }>;
        pagination: {
          total: number;
          limit: number;
          offset: number;
          hasMore: boolean;
        };
      };
    }>(
      app,
      {
        query: `
          query MyShiftInstances($includePast: Boolean!) {
            myShiftInstances(includePast: $includePast) {
              items { id }
              pagination { total limit offset hasMore }
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

    expect(data.myShiftInstances.items.map((i) => i.id)).toContain(instanceId);
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
      myShiftInstances: {
        items: Array<{ id: string }>;
        pagination: {
          total: number;
          limit: number;
          offset: number;
          hasMore: boolean;
        };
      };
    }>(
      app,
      {
        query: `
          query MyShiftInstances($includePast: Boolean!) {
            myShiftInstances(includePast: $includePast) {
              items { id }
              pagination { total limit offset hasMore }
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

    expect(data.myShiftInstances.items.map((i) => i.id)).not.toContain(
      instanceId,
    );
  });

  it('filters myShiftInstances by invite status', async () => {
    await db.insert(schema.memberships).values({
      userId: testUserId,
      organizationUnitId,
    });

    const { id: invitedShiftId } = await createShift(db, {
      organizationUnitId,
    });
    const invitedInstances = await db.query.shiftInstances.findMany({
      where: { masterId: invitedShiftId },
      orderBy: { actualStartsAt: 'asc' },
    });
    const invitedInstanceId = invitedInstances[0]?.id;
    expect(invitedInstanceId).toBeDefined();

    await db.insert(schema.shiftInstanceInvites).values({
      instanceId: invitedInstanceId ?? '',
      userId: testUserId,
      status: ShiftInviteStatus.INVITED,
    });

    const { id: acceptedShiftId } = await createShift(db, {
      organizationUnitId,
    });
    const acceptedInstances = await db.query.shiftInstances.findMany({
      where: { masterId: acceptedShiftId },
      orderBy: { actualStartsAt: 'asc' },
    });
    const acceptedInstanceId = acceptedInstances[0]?.id;
    expect(acceptedInstanceId).toBeDefined();

    await db.insert(schema.shiftInstanceInvites).values({
      instanceId: acceptedInstanceId ?? '',
      userId: testUserId,
      status: ShiftInviteStatus.ACCEPTED,
    });

    const query = `
      query MyShiftInstances($includePast: Boolean!, $statuses: [ShiftInviteStatus!]) {
        myShiftInstances(includePast: $includePast, statuses: $statuses) {
          items { id myInviteStatus }
          pagination { total limit offset hasMore }
        }
      }
    `;

    type MyInstanceItem = {
      id: string;
      myInviteStatus: string | null;
    };

    const invitedOnly = await graphqlRequestRequiringData<{
      myShiftInstances: { items: MyInstanceItem[] };
    }>(
      app,
      {
        query,
        variables: { includePast: true, statuses: ['INVITED'] },
        headers: { 'x-organization-unit-id': organizationUnitId },
      },
      'myShiftInstances',
    );
    const invitedOnlyIds = invitedOnly.myShiftInstances.items.map((i) => i.id);
    expect(invitedOnlyIds).toContain(invitedInstanceId);
    expect(invitedOnlyIds).not.toContain(acceptedInstanceId);

    // The raw myInviteStatus reflects the actual invite — the distinction the
    // volunteer accept/decline UI relies on (a coordinator invite vs a self-join
    // or org request).
    const invitedItem = invitedOnly.myShiftInstances.items.find(
      (i) => i.id === invitedInstanceId,
    );
    expect(invitedItem?.myInviteStatus).toBe('INVITED');

    const defaultStatuses = await graphqlRequestRequiringData<{
      myShiftInstances: { items: MyInstanceItem[] };
    }>(
      app,
      {
        query,
        variables: { includePast: true, statuses: null },
        headers: { 'x-organization-unit-id': organizationUnitId },
      },
      'myShiftInstances',
    );
    const defaultIds = defaultStatuses.myShiftInstances.items.map((i) => i.id);
    expect(defaultIds).toContain(acceptedInstanceId);
    expect(defaultIds).not.toContain(invitedInstanceId);

    const acceptedItem = defaultStatuses.myShiftInstances.items.find(
      (i) => i.id === acceptedInstanceId,
    );
    expect(acceptedItem?.myInviteStatus).toBe('ACCEPTED');
  });

  it('includes intended shift instances when includeIntended is true', async () => {
    // The user is not a member of the org unit; their signup is captured as a
    // pending membership request with an intended shift instance id.
    const { id: shiftId } = await createShift(db, {
      organizationUnitId,
      startsAt: new Date(Date.now() + 60 * 60 * 1000),
      endsAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
    });
    const instances = await db.query.shiftInstances.findMany({
      where: { masterId: shiftId },
      orderBy: { actualStartsAt: 'asc' },
    });
    const intendedInstanceId = instances[0]?.id;
    expect(intendedInstanceId).toBeDefined();

    await createMembershipRequest(db, {
      userId: testUserId,
      organizationUnitId,
      metadata: {
        intendedShiftInstanceIds: [intendedInstanceId ?? ''],
      },
    });

    const query = `
      query MyShiftInstances($includeIntended: Boolean!) {
        myShiftInstances(includePast: true, includeIntended: $includeIntended) {
          items { id myInviteStatus }
          pagination { total limit offset hasMore }
        }
      }
    `;

    type MyInstanceItem = {
      id: string;
      myInviteStatus: string | null;
    };

    const withIntended = await graphqlRequestRequiringData<{
      myShiftInstances: { items: MyInstanceItem[] };
    }>(
      app,
      {
        query,
        variables: { includeIntended: true },
        headers: { 'x-organization-unit-id': organizationUnitId },
      },
      'myShiftInstances',
    );
    const intendedItem = withIntended.myShiftInstances.items.find(
      (i) => i.id === intendedInstanceId,
    );
    expect(intendedItem).toBeDefined();
    expect(intendedItem?.myInviteStatus).toBeNull();

    const withoutIntended = await graphqlRequestRequiringData<{
      myShiftInstances: { items: MyInstanceItem[] };
    }>(
      app,
      {
        query,
        variables: { includeIntended: false },
        headers: { 'x-organization-unit-id': organizationUnitId },
      },
      'myShiftInstances',
    );
    expect(
      withoutIntended.myShiftInstances.items.map((i) => i.id),
    ).not.toContain(intendedInstanceId);
  });

  it('lists available shift instances', async () => {
    await db.insert(schema.memberships).values({
      userId: testUserId,
      organizationUnitId,
    });

    const { id: shiftId } = await createShift(db, {
      organizationUnitId,
      visibility: ShiftVisibility.ALL_MEMBERS,
      // Explicit, well-separated start time so this instance can't be
      // crowded out of the default 15-item page by the many other shifts
      // other tests in this file create around "now".
      startsAt: new Date('2027-03-01T09:00:00.000Z'),
      endsAt: new Date('2027-03-01T10:00:00.000Z'),
    });
    const instances = await db.query.shiftInstances.findMany({
      where: { masterId: shiftId },
    });
    const instanceId = instances[0]?.id;
    expect(instanceId).toBeDefined();

    const startsAfter = new Date('2027-03-01T08:00:00.000Z').toISOString();
    const endsBefore = new Date('2027-03-01T11:00:00.000Z').toISOString();

    const data = await graphqlRequestRequiringData<{
      availableShiftInstances: {
        items: Array<{ id: string }>;
        pagination: {
          total: number;
          limit: number;
          offset: number;
          hasMore: boolean;
        };
      };
    }>(
      app,
      {
        query: `
          query AvailableShiftInstances($startsAfter: DateTime, $endsBefore: DateTime) {
            availableShiftInstances(startsAfter: $startsAfter, endsBefore: $endsBefore) {
              items { id }
              pagination { total limit offset hasMore }
            }
          }
        `,
        variables: { startsAfter, endsBefore },
        headers: {
          'x-organization-unit-id': organizationUnitId,
        },
      },
      'availableShiftInstances',
    );

    expect(data.availableShiftInstances.items.map((i) => i.id)).toContain(
      instanceId,
    );
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

    const startsAfter = new Date('2026-06-01T00:00:00.000Z').toISOString();
    const endsBefore = new Date('2026-12-31T23:59:59.000Z').toISOString();

    const data = await graphqlRequestRequiringData<{
      availableShiftInstances: {
        items: Array<{ id: string }>;
        pagination: {
          total: number;
          limit: number;
          offset: number;
          hasMore: boolean;
        };
      };
    }>(
      app,
      {
        query: `
          query AvailableShiftInstances($startsAfter: DateTime, $endsBefore: DateTime) {
            availableShiftInstances(startsAfter: $startsAfter, endsBefore: $endsBefore) {
              items { id }
              pagination { total limit offset hasMore }
            }
          }
        `,
        variables: { startsAfter, endsBefore },
        headers: {
          'x-organization-unit-id': organizationUnitId,
        },
      },
      'availableShiftInstances',
    );

    expect(data.availableShiftInstances.items.map((i) => i.id)).not.toContain(
      instanceId,
    );
  });

  it('includes open shifts for pending membership requests', async () => {
    const pendingUser = await createUser(db);
    await createMembershipRequest(db, {
      userId: pendingUser.id,
      organizationUnitId,
    });

    const { id: shiftId } = await createShift(db, {
      organizationUnitId,
      visibility: ShiftVisibility.ALL_MEMBERS,
      // Explicit, well-separated start time so this instance can't be
      // crowded out of the default 15-item page by the many other shifts
      // other tests in this file create around "now" — the narrow query
      // window below isn't enough on its own since every default-timed
      // shift in this file lands within seconds of every other one.
      startsAt: new Date('2027-03-02T09:00:00.000Z'),
      endsAt: new Date('2027-03-02T10:00:00.000Z'),
    });
    const instances = await db.query.shiftInstances.findMany({
      where: { masterId: shiftId },
    });
    const instance = instances[0];
    if (!instance) {
      throw new Error('Expected shift instance');
    }

    setAuthMockUserId(pendingUser.id);

    const data = await graphqlRequestRequiringData<{
      availableShiftInstances: {
        items: Array<{ id: string }>;
        pagination: { total: number };
      };
    }>(
      app,
      {
        query: `
          query AvailableShiftInstances($startsAfter: DateTime, $endsBefore: DateTime) {
            availableShiftInstances(startsAfter: $startsAfter, endsBefore: $endsBefore) {
              items { id }
              pagination { total }
            }
          }
        `,
        variables: {
          // Scoped tightly around this instance's own start time — not a wide
          // fixed range — so it isn't crowded out of the default 15-item page
          // by unrelated shifts other tests in this file create around "now".
          startsAfter: new Date(
            instance.actualStartsAt.getTime() - 60000,
          ).toISOString(),
          endsBefore: new Date(
            instance.actualStartsAt.getTime() + 60000,
          ).toISOString(),
        },
        headers: {
          'x-organization-unit-id': organizationUnitId,
        },
      },
      'availableShiftInstances',
    );

    expect(data.availableShiftInstances.items.map((i) => i.id)).toContain(
      instance.id,
    );

    setAuthMockUserId(testUserId);
  });

  it('excludes invite-only shifts for pending membership requests', async () => {
    const pendingUser = await createUser(db);
    await createMembershipRequest(db, {
      userId: pendingUser.id,
      organizationUnitId,
    });

    const { id: shiftId } = await createShift(db, {
      organizationUnitId,
      visibility: ShiftVisibility.INVITED_MEMBERS,
    });
    const instances = await db.query.shiftInstances.findMany({
      where: { masterId: shiftId },
    });
    const instanceId = instances[0]?.id;
    expect(instanceId).toBeDefined();

    setAuthMockUserId(pendingUser.id);

    const data = await graphqlRequestRequiringData<{
      availableShiftInstances: {
        items: Array<{ id: string }>;
        pagination: { total: number };
      };
    }>(
      app,
      {
        query: `
          query AvailableShiftInstances($startsAfter: DateTime, $endsBefore: DateTime) {
            availableShiftInstances(startsAfter: $startsAfter, endsBefore: $endsBefore) {
              items { id }
              pagination { total }
            }
          }
        `,
        variables: {
          startsAfter: new Date('2026-06-01T00:00:00.000Z').toISOString(),
          endsBefore: new Date('2026-12-31T23:59:59.000Z').toISOString(),
        },
        headers: {
          'x-organization-unit-id': organizationUnitId,
        },
      },
      'availableShiftInstances',
    );

    expect(data.availableShiftInstances.items.map((i) => i.id)).not.toContain(
      instanceId,
    );

    setAuthMockUserId(testUserId);
  });

  it('excludes invite-only shifts from available instances for a pending member even when open shifts also exist', async () => {
    const pendingUser = await createUser(db);
    await createMembershipRequest(db, {
      userId: pendingUser.id,
      organizationUnitId,
    });

    const { id: inviteOnlyShiftId } = await createShift(db, {
      organizationUnitId,
      visibility: ShiftVisibility.INVITED_MEMBERS,
    });
    const inviteOnlyInstances = await db.query.shiftInstances.findMany({
      where: { masterId: inviteOnlyShiftId },
    });
    const inviteOnlyInstanceId = inviteOnlyInstances[0]?.id;
    expect(inviteOnlyInstanceId).toBeDefined();

    setAuthMockUserId(pendingUser.id);

    const data = await graphqlRequestRequiringData<{
      availableShiftInstances: {
        items: Array<{ id: string }>;
        pagination: { total: number };
      };
    }>(
      app,
      {
        query: `
          query AvailableShiftInstances($startsAfter: DateTime, $endsBefore: DateTime) {
            availableShiftInstances(startsAfter: $startsAfter, endsBefore: $endsBefore) {
              items { id }
              pagination { total }
            }
          }
        `,
        variables: {
          startsAfter: new Date('2026-06-01T00:00:00.000Z').toISOString(),
          endsBefore: new Date('2026-12-31T23:59:59.000Z').toISOString(),
        },
        headers: {
          'x-organization-unit-id': organizationUnitId,
        },
      },
      'availableShiftInstances',
    );

    expect(data.availableShiftInstances.items.map((i) => i.id)).not.toContain(
      inviteOnlyInstanceId,
    );

    setAuthMockUserId(testUserId);
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
      startsAt: new Date('2026-06-12T12:00:00.000Z'),
      endsAt: new Date('2026-06-12T13:00:00.000Z'),
    });
    const instances = await db.query.shiftInstances.findMany({
      where: { masterId: shiftId },
    });
    const instanceId = instances[0]?.id;
    expect(instanceId).toBeDefined();

    setAuthMockUserId(parentMember.id);

    const startsAfter = new Date('2026-06-01T00:00:00.000Z').toISOString();
    const endsBefore = new Date('2026-06-30T23:59:59.000Z').toISOString();

    const data = await graphqlRequestRequiringData<{
      availableShiftInstances: {
        items: Array<{ id: string }>;
        pagination: {
          total: number;
          limit: number;
          offset: number;
          hasMore: boolean;
        };
      };
    }>(
      app,
      {
        query: `
          query AvailableShiftInstances($startsAfter: DateTime, $endsBefore: DateTime) {
            availableShiftInstances(startsAfter: $startsAfter, endsBefore: $endsBefore) {
              items { id }
              pagination { total limit offset hasMore }
            }
          }
        `,
        variables: { startsAfter, endsBefore },
      },
      'availableShiftInstances',
    );

    expect(data.availableShiftInstances.items.map((i) => i.id)).toContain(
      instanceId,
    );

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
      myShiftInstances: {
        items: Array<{ id: string }>;
        pagination: {
          total: number;
          limit: number;
          offset: number;
          hasMore: boolean;
        };
      };
    }>(
      app,
      {
        query: `
          query MyShiftInstances($includePast: Boolean!) {
            myShiftInstances(includePast: $includePast) {
              items { id }
              pagination { total limit offset hasMore }
            }
          }
        `,
        variables: { includePast: true },
      },
      'myShiftInstances',
    );

    expect(data.myShiftInstances.items.map((i) => i.id)).toContain(instanceId);

    setAuthMockUserId(testUserId);
  });
});

describe('Volunteer shifts pagination', () => {
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

  it('caps myShiftInstances at the requested limit and reports pagination', async () => {
    const user = await createUser(db);
    await db.insert(schema.memberships).values({
      userId: user.id,
      organizationUnitId,
    });
    setAuthMockUserId(user.id);

    const capBaseDate = new Date();
    capBaseDate.setDate(capBaseDate.getDate() + 2);
    capBaseDate.setHours(8, 0, 0, 0);

    const shift = await createShift(db, {
      organizationUnitId,
      startsAt: capBaseDate,
      endsAt: new Date(capBaseDate.getTime() + 2 * 60 * 60 * 1000),
      rrule: 'FREQ=DAILY;COUNT=5',
    });

    const instances = await db.query.shiftInstances.findMany({
      where: { masterId: shift.id },
      orderBy: { actualStartsAt: 'asc' },
    });

    for (const instance of instances) {
      await db.insert(schema.shiftInstanceInvites).values({
        instanceId: instance.id,
        userId: user.id,
        status: ShiftInviteStatus.ACCEPTED,
      });
    }

    const data = await graphqlRequestRequiringData<{
      myShiftInstances: {
        items: Array<{ id: string }>;
        pagination: {
          total: number;
          limit: number;
          offset: number;
          hasMore: boolean;
        };
      };
    }>(
      app,
      {
        query: `
          query MyShiftInstances($limit: Int!, $offset: Int!) {
            myShiftInstances(limit: $limit, offset: $offset) {
              items { id }
              pagination { total limit offset hasMore }
            }
          }
        `,
        variables: { limit: 2, offset: 0 },
        headers: {
          'x-organization-unit-id': organizationUnitId,
        },
      },
      'myShiftInstances',
    );

    expect(data.myShiftInstances.items).toHaveLength(2);
    expect(data.myShiftInstances.pagination.total).toBe(5);
    expect(data.myShiftInstances.pagination.limit).toBe(2);
    expect(data.myShiftInstances.pagination.offset).toBe(0);
    expect(data.myShiftInstances.pagination.hasMore).toBe(true);

    setAuthMockUserId(testUserId);
  });

  it('returns myShiftInstances starting from the given date', async () => {
    const user = await createUser(db);
    await db.insert(schema.memberships).values({
      userId: user.id,
      organizationUnitId,
    });
    setAuthMockUserId(user.id);

    const fromBaseDate = new Date();
    fromBaseDate.setDate(fromBaseDate.getDate() - 2);
    fromBaseDate.setHours(8, 0, 0, 0);

    const shift = await createShift(db, {
      organizationUnitId,
      startsAt: fromBaseDate,
      endsAt: new Date(fromBaseDate.getTime() + 2 * 60 * 60 * 1000),
      rrule: 'FREQ=DAILY;COUNT=5',
    });

    const instances = await db.query.shiftInstances.findMany({
      where: { masterId: shift.id },
      orderBy: { actualStartsAt: 'asc' },
    });

    for (const instance of instances) {
      await db.insert(schema.shiftInstanceInvites).values({
        instanceId: instance.id,
        userId: user.id,
        status: ShiftInviteStatus.ACCEPTED,
      });
    }

    const startsAfter = new Date();
    startsAfter.setDate(startsAfter.getDate() + 1);
    startsAfter.setHours(0, 0, 0, 0);

    const data = await graphqlRequestRequiringData<{
      myShiftInstances: {
        items: Array<{ id: string; actualStartsAt: string }>;
        pagination: { total: number; hasMore: boolean };
      };
    }>(
      app,
      {
        query: `
          query MyShiftInstances($startsAfter: DateTime!) {
            myShiftInstances(startsAfter: $startsAfter) {
              items { id actualStartsAt }
              pagination { total hasMore }
            }
          }
        `,
        variables: { startsAfter: startsAfter.toISOString() },
        headers: {
          'x-organization-unit-id': organizationUnitId,
        },
      },
      'myShiftInstances',
    );

    expect(data.myShiftInstances.items.length).toBeGreaterThan(0);
    expect(
      data.myShiftInstances.items.every(
        (item) =>
          new Date(item.actualStartsAt).getTime() >= startsAfter.getTime(),
      ),
    ).toBe(true);

    setAuthMockUserId(testUserId);
  });

  it('returns past myShiftInstances in descending order when requested', async () => {
    const user = await createUser(db);
    await db.insert(schema.memberships).values({
      userId: user.id,
      organizationUnitId,
    });
    setAuthMockUserId(user.id);

    const pastBaseDate = new Date();
    pastBaseDate.setDate(pastBaseDate.getDate() - 10);
    pastBaseDate.setHours(8, 0, 0, 0);

    const shift = await createShift(db, {
      organizationUnitId,
      startsAt: pastBaseDate,
      endsAt: new Date(pastBaseDate.getTime() + 2 * 60 * 60 * 1000),
      rrule: 'FREQ=DAILY;COUNT=5',
    });

    const instances = await db.query.shiftInstances.findMany({
      where: { masterId: shift.id },
      orderBy: { actualStartsAt: 'asc' },
    });

    for (const instance of instances) {
      await db.insert(schema.shiftInstanceInvites).values({
        instanceId: instance.id,
        userId: user.id,
        status: ShiftInviteStatus.ACCEPTED,
      });
    }

    const endsBefore = new Date();
    endsBefore.setDate(endsBefore.getDate() - 7);
    endsBefore.setHours(0, 0, 0, 0);

    const data = await graphqlRequestRequiringData<{
      myShiftInstances: {
        items: Array<{
          id: string;
          actualStartsAt: string;
          actualEndsAt: string;
        }>;
        pagination: { total: number; hasMore: boolean };
      };
    }>(
      app,
      {
        query: `
          query MyShiftInstances($endsBefore: DateTime!, $order: SortOrder!) {
            myShiftInstances(endsBefore: $endsBefore, order: $order) {
              items { id actualStartsAt actualEndsAt }
              pagination { total hasMore }
            }
          }
        `,
        variables: { endsBefore: endsBefore.toISOString(), order: 'DESC' },
        headers: {
          'x-organization-unit-id': organizationUnitId,
        },
      },
      'myShiftInstances',
    );

    expect(data.myShiftInstances.items.length).toBeGreaterThan(0);
    const startsAtTimes = data.myShiftInstances.items.map((item) =>
      new Date(item.actualStartsAt).getTime(),
    );
    for (let i = 1; i < startsAtTimes.length; i++) {
      expect(startsAtTimes[i]).toBeLessThanOrEqual(startsAtTimes[i - 1]);
    }
    expect(
      data.myShiftInstances.items.every(
        (item) => new Date(item.actualEndsAt).getTime() < endsBefore.getTime(),
      ),
    ).toBe(true);

    setAuthMockUserId(testUserId);
  });

  it('caps availableShiftInstances at the requested limit and reports pagination', async () => {
    const user = await createUser(db);
    await db.insert(schema.memberships).values({
      userId: user.id,
      organizationUnitId,
    });
    setAuthMockUserId(user.id);

    const availBaseDate = new Date();
    availBaseDate.setDate(availBaseDate.getDate() + 20);
    availBaseDate.setHours(8, 0, 0, 0);

    await createShift(db, {
      organizationUnitId,
      startsAt: availBaseDate,
      endsAt: new Date(availBaseDate.getTime() + 2 * 60 * 60 * 1000),
      rrule: 'FREQ=DAILY;COUNT=5',
    });

    const startsAfter = new Date(availBaseDate);
    startsAfter.setHours(0, 0, 0, 0);
    const endsBefore = new Date(availBaseDate);
    endsBefore.setDate(endsBefore.getDate() + 7);

    const data = await graphqlRequestRequiringData<{
      availableShiftInstances: {
        items: Array<{ id: string }>;
        pagination: {
          total: number;
          limit: number;
          offset: number;
          hasMore: boolean;
        };
      };
    }>(
      app,
      {
        query: `
          query AvailableShiftInstances($startsAfter: DateTime, $endsBefore: DateTime, $limit: Int!, $offset: Int!) {
            availableShiftInstances(startsAfter: $startsAfter, endsBefore: $endsBefore, limit: $limit, offset: $offset) {
              items { id }
              pagination { total limit offset hasMore }
            }
          }
        `,
        variables: {
          startsAfter: startsAfter.toISOString(),
          endsBefore: endsBefore.toISOString(),
          limit: 2,
          offset: 0,
        },
        headers: {
          'x-organization-unit-id': organizationUnitId,
        },
      },
      'availableShiftInstances',
    );

    expect(data.availableShiftInstances.items).toHaveLength(2);
    expect(data.availableShiftInstances.pagination.total).toBe(5);
    expect(data.availableShiftInstances.pagination.limit).toBe(2);
    expect(data.availableShiftInstances.pagination.offset).toBe(0);
    expect(data.availableShiftInstances.pagination.hasMore).toBe(true);

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

describe('ShiftInstance.invites (VOLI-842)', () => {
  let app: INestApplication;
  let db: Database;
  let organizationUnitId: string;
  let organizationId: string;

  beforeAll(async () => {
    const context = await getGraphqlTestContext();
    app = context.app;
    db = context.db;
    organizationUnitId = context.organizationUnitId;
    organizationId = context.organizationId;
  });

  it('returns invitees with status including SELF_JOINED distinct from ACCEPTED', async () => {
    const { id: shiftId } = await createShift(db, { organizationUnitId });
    const instances = await db.query.shiftInstances.findMany({
      where: { masterId: shiftId },
    });
    const instanceId = instances[0]?.id;
    expect(instanceId).toBeDefined();
    if (!instanceId) {
      throw new Error('Expected shift instance');
    }

    const invited = await createUser(db);
    const accepted = await createUser(db);
    const signedUp = await createUser(db);
    const declined = await createUser(db);
    const cancelled = await createUser(db);
    const rejected = await createUser(db);

    await db.insert(schema.shiftInstanceInvites).values([
      {
        instanceId,
        userId: invited.id,
        status: ShiftInviteStatus.INVITED,
      },
      {
        instanceId,
        userId: accepted.id,
        status: ShiftInviteStatus.ACCEPTED,
      },
      {
        instanceId,
        userId: signedUp.id,
        status: ShiftInviteStatus.SELF_JOINED,
      },
      {
        instanceId,
        userId: declined.id,
        status: ShiftInviteStatus.VOLUNTEER_REJECTED,
      },
      {
        instanceId,
        userId: cancelled.id,
        status: ShiftInviteStatus.CANCELLED,
      },
      {
        instanceId,
        userId: rejected.id,
        status: ShiftInviteStatus.ADMIN_REJECTED,
      },
    ]);

    const data = await graphqlRequestRequiringData<{
      shiftInstances: Array<{
        id: string;
        invites: Array<{
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
              invites {
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
    if (!instance) {
      throw new Error('Expected shift instance in GraphQL response');
    }
    const byUser = new Map(
      instance.invites.map((invite) => [invite.user.id, invite.status]),
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
    if (!instanceId) {
      throw new Error('Expected shift instance');
    }

    const volunteer = await createUser(db);
    await db.insert(schema.shiftInstanceInvites).values({
      instanceId,
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
      where: { instanceId, userId: volunteer.id },
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
    if (!instanceId) {
      throw new Error('Expected shift instance');
    }

    const volunteer = await createUser(db);
    await db.insert(schema.shiftInstanceInvites).values({
      instanceId,
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
      where: { instanceId, userId: volunteer.id },
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
    if (!instanceId) {
      throw new Error('Expected shift instance');
    }

    const volunteer = await createUser(db);
    await db.insert(schema.shiftInstanceInvites).values({
      instanceId,
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
      where: { instanceId, userId: volunteer.id },
    });
    expect(row?.status).toBe(ShiftInviteStatus.ADMIN_REJECTED);
  });

  it('forbids volunteer from self-setting ADMIN_REJECTED without SHIFT_EDIT', async () => {
    const { id: shiftId } = await createShift(db, { organizationUnitId });
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
      status: ShiftInviteStatus.ACCEPTED,
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
          userId: volunteer.id,
          status: ShiftInviteStatus.ADMIN_REJECTED,
        },
        headers: { 'x-organization-unit-id': organizationUnitId },
      });

      expect(response.errors?.[0]?.message).toMatch(/permission|Forbidden/i);

      const row = await db.query.shiftInstanceInvites.findFirst({
        where: { instanceId, userId: volunteer.id },
      });
      expect(row?.status).toBe(ShiftInviteStatus.ACCEPTED);
    } finally {
      setAuthMockUserId(originalUserId);
    }
  });

  it('forbids member without SHIFT_EDIT from uninviting another user', async () => {
    const { id: shiftId } = await createShift(db, { organizationUnitId });
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
      status: ShiftInviteStatus.ACCEPTED,
    });

    const actor = await createUser(db);
    const membership = await addMembership(db, actor.id, organizationUnitId);
    const role = await createRole(db, { organizationId });
    const shiftViewPermission = await db.query.permissions.findFirst({
      where: { key: PERMISSIONS.SHIFT_VIEW },
    });
    if (!shiftViewPermission) {
      throw new Error('SHIFT_VIEW permission not seeded in test database');
    }
    await grantPermissionToRole(db, {
      roleId: role.id,
      permissionId: shiftViewPermission.id,
    });
    await assignRoleToMembership(db, {
      membershipId: membership.id,
      roleId: role.id,
    });

    const originalUserId = getAuthMockUserId();
    setAuthMockUserId(actor.id);
    try {
      const response = await graphqlRequest<{
        updateShiftInstanceInviteStatus: { status: string };
      }>(app, {
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
          userId: volunteer.id,
          status: ShiftInviteStatus.ADMIN_REJECTED,
        },
        headers: { 'x-organization-unit-id': organizationUnitId },
      });

      expect(response.errors?.[0]?.message).toMatch(/permission|Forbidden/i);

      const row = await db.query.shiftInstanceInvites.findFirst({
        where: { instanceId, userId: volunteer.id },
      });
      expect(row?.status).toBe(ShiftInviteStatus.ACCEPTED);
    } finally {
      setAuthMockUserId(originalUserId);
    }
  });

  it('forbids self-setting shift-level invite to INVITED without SHIFT_EDIT', async () => {
    const { id: shiftId } = await createShift(db, { organizationUnitId });
    const volunteer = await createUser(db);
    await db.insert(schema.shiftInvites).values({
      shiftId,
      userId: volunteer.id,
      status: ShiftInviteStatus.ADMIN_REJECTED,
    });

    const originalUserId = getAuthMockUserId();
    setAuthMockUserId(volunteer.id);
    try {
      const response = await graphqlRequest<{
        updateShiftInviteStatus: { status: string };
      }>(app, {
        query: `
          mutation UpdateShiftInviteStatus(
            $shiftId: String!
            $status: ShiftInviteStatus!
          ) {
            updateShiftInviteStatus(shiftId: $shiftId, status: $status) {
              status
            }
          }
        `,
        variables: { shiftId, status: ShiftInviteStatus.INVITED },
        headers: { 'x-organization-unit-id': organizationUnitId },
      });

      expect(response.errors?.[0]?.message).toMatch(/permission|Forbidden/i);

      const row = await db.query.shiftInvites.findFirst({
        where: { shiftId, userId: volunteer.id },
      });
      expect(row?.status).toBe(ShiftInviteStatus.ADMIN_REJECTED);
    } finally {
      setAuthMockUserId(originalUserId);
    }
  });

  it('allows self-setting shift-level invite to ACCEPTED without SHIFT_EDIT', async () => {
    const { id: shiftId } = await createShift(db, { organizationUnitId });
    const volunteer = await createUser(db);
    await db.insert(schema.shiftInvites).values({
      shiftId,
      userId: volunteer.id,
      status: ShiftInviteStatus.INVITED,
    });

    const originalUserId = getAuthMockUserId();
    setAuthMockUserId(volunteer.id);
    try {
      const data = await graphqlRequestRequiringData<{
        updateShiftInviteStatus: { status: string };
      }>(
        app,
        {
          query: `
            mutation UpdateShiftInviteStatus(
              $shiftId: String!
              $status: ShiftInviteStatus!
            ) {
              updateShiftInviteStatus(shiftId: $shiftId, status: $status) {
                status
              }
            }
          `,
          variables: { shiftId, status: ShiftInviteStatus.ACCEPTED },
          headers: { 'x-organization-unit-id': organizationUnitId },
        },
        'updateShiftInviteStatus',
      );

      expect(data.updateShiftInviteStatus.status).toBe(
        ShiftInviteStatus.ACCEPTED,
      );
    } finally {
      setAuthMockUserId(originalUserId);
    }
  });

  it('keeps invites order stable after admin uninvite', async () => {
    const { id: shiftId } = await createShift(db, { organizationUnitId });
    const instances = await db.query.shiftInstances.findMany({
      where: { masterId: shiftId },
    });
    const instanceId = instances[0]?.id;
    expect(instanceId).toBeDefined();
    if (!instanceId) {
      throw new Error('Expected shift instance');
    }

    const first = await createUser(db);
    const second = await createUser(db);
    const third = await createUser(db);
    const sharedCreatedAt = new Date('2026-01-01T12:00:00.000Z');

    await db.insert(schema.shiftInstanceInvites).values([
      {
        instanceId,
        userId: first.id,
        status: ShiftInviteStatus.INVITED,
        createdAt: sharedCreatedAt,
        updatedAt: sharedCreatedAt,
      },
      {
        instanceId,
        userId: second.id,
        status: ShiftInviteStatus.INVITED,
        createdAt: sharedCreatedAt,
        updatedAt: sharedCreatedAt,
      },
      {
        instanceId,
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
          invites: Array<{ user: { id: string } }>;
        }>;
      }>(
        app,
        {
          query: `
            query ShiftInstanceInvites($shiftId: ID!) {
              shiftInstances(shiftId: $shiftId) {
                id
                invites {
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
        ?.invites.map((invite) => invite.user.id) ?? [];
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
        ?.invites.map((invite) => invite.user.id) ?? [];

    expect(orderAfter).toEqual(orderBefore);
  });

  it('cancelling an ACCEPTED invite-only instance frees the spot and allows re-accept', async () => {
    const volunteer = await createUser(db);
    const other = await createUser(db);
    const { id: shiftId } = await createShift(db, {
      organizationUnitId,
      visibility: ShiftVisibility.INVITED_MEMBERS,
      maxVolunteers: 2,
    });
    const instances = await db.query.shiftInstances.findMany({
      where: { masterId: shiftId },
    });
    const instanceId = instances[0]?.id;
    expect(instanceId).toBeDefined();
    if (!instanceId) {
      throw new Error('Expected shift instance');
    }

    await db.insert(schema.shiftInstanceInvites).values([
      {
        instanceId,
        userId: volunteer.id,
        status: ShiftInviteStatus.ACCEPTED,
      },
      {
        instanceId,
        userId: other.id,
        status: ShiftInviteStatus.ACCEPTED,
      },
    ]);

    const queryCapacity = () =>
      graphqlRequestRequiringData<{
        publicShiftInstances: Array<{
          id: string;
          filledCount: number;
          spotsLeft: number | null;
          myInviteStatus: string | null;
        }>;
      }>(
        app,
        {
          query: `
            query Capacity($shiftId: ID!) {
              publicShiftInstances(shiftId: $shiftId) {
                id
                filledCount
                spotsLeft
                myInviteStatus
              }
            }
          `,
          variables: { shiftId },
          headers: { 'x-organization-unit-id': organizationUnitId },
        },
        'publicShiftInstances',
      );

    setAuthMockUserId(volunteer.id);

    const before = await queryCapacity();
    const beforeInstance = before.publicShiftInstances.find(
      (row) => row.id === instanceId,
    );
    expect(beforeInstance?.filledCount).toBe(2);
    expect(beforeInstance?.spotsLeft).toBe(0);
    expect(beforeInstance?.myInviteStatus).toBe(ShiftInviteStatus.ACCEPTED);

    await graphqlRequestRequiringData<{
      updateShiftInstanceInviteStatus: { status: string };
    }>(
      app,
      {
        query: `
          mutation Cancel($instanceId: String!) {
            updateShiftInstanceInviteStatus(
              instanceId: $instanceId
              status: CANCELLED
            ) {
              status
            }
          }
        `,
        variables: { instanceId },
        headers: { 'x-organization-unit-id': organizationUnitId },
      },
      'updateShiftInstanceInviteStatus',
    );

    const afterCancel = await queryCapacity();
    const cancelledInstance = afterCancel.publicShiftInstances.find(
      (row) => row.id === instanceId,
    );
    expect(cancelledInstance?.filledCount).toBe(1);
    expect(cancelledInstance?.spotsLeft).toBe(1);
    expect(cancelledInstance?.myInviteStatus).toBe(ShiftInviteStatus.CANCELLED);

    await graphqlRequestRequiringData<{
      updateShiftInstanceInviteStatus: { status: string };
    }>(
      app,
      {
        query: `
          mutation Reaccept($instanceId: String!) {
            updateShiftInstanceInviteStatus(
              instanceId: $instanceId
              status: ACCEPTED
            ) {
              status
            }
          }
        `,
        variables: { instanceId },
        headers: { 'x-organization-unit-id': organizationUnitId },
      },
      'updateShiftInstanceInviteStatus',
    );

    const afterReaccept = await queryCapacity();
    const reacceptedInstance = afterReaccept.publicShiftInstances.find(
      (row) => row.id === instanceId,
    );
    expect(reacceptedInstance?.filledCount).toBe(2);
    expect(reacceptedInstance?.spotsLeft).toBe(0);
    expect(reacceptedInstance?.myInviteStatus).toBe(ShiftInviteStatus.ACCEPTED);
  });

  it('does not leak invites across organizations', async () => {
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
    if (!foreignInstanceId) {
      throw new Error('Expected foreign shift instance');
    }

    const foreignUser = await createUser(db);
    await db.insert(schema.shiftInstanceInvites).values({
      instanceId: foreignInstanceId,
      userId: foreignUser.id,
      status: ShiftInviteStatus.INVITED,
    });

    const response = await graphqlRequest<{
      shiftInstances: Array<{
        id: string;
        invites: Array<{ user: { id: string } }>;
      }>;
    }>(app, {
      query: `
        query ShiftInstanceInvites($shiftId: ID!) {
          shiftInstances(shiftId: $shiftId) {
            id
            invites {
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
      response.data?.shiftInstances.flatMap((row) => row.invites) ?? [];
    expect(invites.map((invite) => invite.user.id)).not.toContain(
      foreignUser.id,
    );
  });
});

describe('ShiftService.requestJoinShiftInstance — required forms', () => {
  let app: INestApplication;
  let db: Database;
  let organizationId: string;
  let organizationUnitId: string;
  let shiftService: ShiftService;
  let requiredFormService: RequiredFormService;

  beforeAll(async () => {
    const context = await getGraphqlTestContext();
    app = context.app;
    db = context.db;
    organizationId = context.organizationId;
    organizationUnitId = context.organizationUnitId;
    shiftService = app.get(ShiftService);
    requiredFormService = app.get(RequiredFormService);
  });

  const setupJoinableShift = async () => {
    const user = await createUser(db);
    await addMembership(db, user.id, organizationUnitId);

    const { id: shiftId } = await createShift(db, {
      organizationUnitId,
      visibility: ShiftVisibility.ALL_MEMBERS,
    });
    const instance = await db.query.shiftInstances.findFirst({
      where: { masterId: shiftId },
    });
    if (!instance) throw new Error('Failed to create test shift instance');

    const { form } = await createRequirementForm(db, {
      organizationId,
      organizationUnitId,
      createdById: user.id,
    });
    await requiredFormService.setRequiredForms(
      { targetType: RequiredFormTargetType.SHIFT, targetId: shiftId },
      [form.id],
    );

    return { user, shiftId, instance, form };
  };

  it('returns REQUIREMENTS_NEEDED when the shift has an unsubmitted required form', async () => {
    const { user, instance, form } = await setupJoinableShift();

    const result = await shiftService.requestJoinShiftInstance(
      user.id,
      instance.id,
    );

    expect(result.status).toBe(JoinStatus.REQUIREMENTS_NEEDED);
    expect(result.requiredForms).toHaveLength(1);
    expect(result.requiredForms?.[0]?.form.id).toBe(form.id);
    expect(result.requiredForms?.[0]?.submitted).toBe(false);

    const invite = await db.query.shiftInstanceInvites.findFirst({
      where: { instanceId: instance.id, userId: user.id },
    });
    expect(invite).toBeUndefined();
  });

  it('joins the shift once the required form is submitted', async () => {
    const { user, instance, form } = await setupJoinableShift();
    await createFormSubmission(db, { formId: form.id, userId: user.id });

    const result = await shiftService.requestJoinShiftInstance(
      user.id,
      instance.id,
    );

    expect(result.status).toBe(JoinStatus.JOINED);

    const invite = await db.query.shiftInstanceInvites.findFirst({
      where: { instanceId: instance.id, userId: user.id },
    });
    expect(invite?.status).toBe(ShiftInviteStatus.SELF_JOINED);
  });

  it('joins normally when the shift has no required forms', async () => {
    const user = await createUser(db);
    await addMembership(db, user.id, organizationUnitId);
    const { id: shiftId } = await createShift(db, {
      organizationUnitId,
      visibility: ShiftVisibility.ALL_MEMBERS,
    });
    const instance = await db.query.shiftInstances.findFirst({
      where: { masterId: shiftId },
    });
    if (!instance) throw new Error('Failed to create test shift instance');

    const result = await shiftService.requestJoinShiftInstance(
      user.id,
      instance.id,
    );

    expect(result.status).toBe(JoinStatus.JOINED);
  });

  it('returns REQUIREMENTS_NEEDED for a non-member before the membership request is pending', async () => {
    const user = await createUser(db);
    const { id: shiftId } = await createShift(db, {
      organizationUnitId,
      visibility: ShiftVisibility.ALL_MEMBERS,
    });
    const instance = await db.query.shiftInstances.findFirst({
      where: { masterId: shiftId },
    });
    if (!instance) throw new Error('Failed to create test shift instance');

    const { form } = await createRequirementForm(db, {
      organizationId,
      organizationUnitId,
      createdById: user.id,
    });
    await requiredFormService.setRequiredForms(
      { targetType: RequiredFormTargetType.SHIFT, targetId: shiftId },
      [form.id],
    );

    const result = await shiftService.requestJoinShiftInstance(
      user.id,
      instance.id,
    );

    expect(result.status).toBe(JoinStatus.REQUIREMENTS_NEEDED);
    expect(result.requiredForms).toHaveLength(1);
    expect(result.requiredForms?.[0]?.form.id).toBe(form.id);
    expect(result.requiredForms?.[0]?.submitted).toBe(false);

    const invite = await db.query.shiftInstanceInvites.findFirst({
      where: { instanceId: instance.id, userId: user.id },
    });
    expect(invite).toBeUndefined();
  });

  it('does not auto-join an intended shift instance when required forms are missing', async () => {
    const user = await createUser(db);
    const { id: shiftId } = await createShift(db, {
      organizationUnitId,
      visibility: ShiftVisibility.ALL_MEMBERS,
    });
    const instance = await db.query.shiftInstances.findFirst({
      where: { masterId: shiftId },
    });
    if (!instance) throw new Error('Failed to create test shift instance');

    const { form } = await createRequirementForm(db, {
      organizationId,
      organizationUnitId,
      createdById: user.id,
    });
    await requiredFormService.setRequiredForms(
      { targetType: RequiredFormTargetType.SHIFT, targetId: shiftId },
      [form.id],
    );

    const membershipRequest = await createMembershipRequest(db, {
      userId: user.id,
      organizationUnitId,
      metadata: {
        intendedShiftInstanceIds: [instance.id],
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

    const invite = await db.query.shiftInstanceInvites.findFirst({
      where: { instanceId: instance.id, userId: user.id },
    });
    expect(invite).toBeUndefined();
  });

  it('auto-joins an intended shift instance once the required form is submitted', async () => {
    const user = await createUser(db);
    const { id: shiftId } = await createShift(db, {
      organizationUnitId,
      visibility: ShiftVisibility.ALL_MEMBERS,
    });
    const instance = await db.query.shiftInstances.findFirst({
      where: { masterId: shiftId },
    });
    if (!instance) throw new Error('Failed to create test shift instance');

    const { form } = await createRequirementForm(db, {
      organizationId,
      organizationUnitId,
      createdById: user.id,
    });
    await requiredFormService.setRequiredForms(
      { targetType: RequiredFormTargetType.SHIFT, targetId: shiftId },
      [form.id],
    );
    await createFormSubmission(db, { formId: form.id, userId: user.id });

    const membershipRequest = await createMembershipRequest(db, {
      userId: user.id,
      organizationUnitId,
      metadata: {
        intendedShiftInstanceIds: [instance.id],
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

    const invite = await db.query.shiftInstanceInvites.findFirst({
      where: { instanceId: instance.id, userId: user.id },
    });
    expect(invite?.status).toBe(ShiftInviteStatus.ACCEPTED);
  });
});

describe('ShiftService.requestJoinShiftInstance — shift-instance required forms', () => {
  let app: INestApplication;
  let db: Database;
  let organizationId: string;
  let organizationUnitId: string;
  let shiftService: ShiftService;
  let requiredFormService: RequiredFormService;

  beforeAll(async () => {
    const context = await getGraphqlTestContext();
    app = context.app;
    db = context.db;
    organizationId = context.organizationId;
    organizationUnitId = context.organizationUnitId;
    shiftService = app.get(ShiftService);
    requiredFormService = app.get(RequiredFormService);
  });

  it('returns REQUIREMENTS_NEEDED when the instance has an unsubmitted required form', async () => {
    const user = await createUser(db);
    await addMembership(db, user.id, organizationUnitId);

    const { id: shiftId } = await createShift(db, {
      organizationUnitId,
      visibility: ShiftVisibility.ALL_MEMBERS,
    });
    const instance = await db.query.shiftInstances.findFirst({
      where: { masterId: shiftId },
    });
    if (!instance) throw new Error('Failed to create test shift instance');

    const { form } = await createRequirementForm(db, {
      organizationId,
      organizationUnitId,
      createdById: user.id,
    });
    await requiredFormService.setRequiredForms(
      {
        targetType: RequiredFormTargetType.SHIFT_INSTANCE,
        targetId: instance.id,
      },
      [form.id],
    );

    const result = await shiftService.requestJoinShiftInstance(
      user.id,
      instance.id,
    );

    expect(result.status).toBe(JoinStatus.REQUIREMENTS_NEEDED);
    expect(result.requiredForms).toHaveLength(1);
    expect(result.requiredForms?.[0]?.form.id).toBe(form.id);
    expect(result.requiredForms?.[0]?.targetType).toBe(
      RequiredFormTargetType.SHIFT_INSTANCE,
    );
    expect(result.requiredForms?.[0]?.submitted).toBe(false);

    const invite = await db.query.shiftInstanceInvites.findFirst({
      where: { instanceId: instance.id, userId: user.id },
    });
    expect(invite).toBeUndefined();
  });

  it('joins the instance once the instance-specific required form is submitted', async () => {
    const user = await createUser(db);
    await addMembership(db, user.id, organizationUnitId);

    const { id: shiftId } = await createShift(db, {
      organizationUnitId,
      visibility: ShiftVisibility.ALL_MEMBERS,
    });
    const instance = await db.query.shiftInstances.findFirst({
      where: { masterId: shiftId },
    });
    if (!instance) throw new Error('Failed to create test shift instance');

    const { form } = await createRequirementForm(db, {
      organizationId,
      organizationUnitId,
      createdById: user.id,
    });
    await requiredFormService.setRequiredForms(
      {
        targetType: RequiredFormTargetType.SHIFT_INSTANCE,
        targetId: instance.id,
      },
      [form.id],
    );
    await createFormSubmission(db, { formId: form.id, userId: user.id });

    const result = await shiftService.requestJoinShiftInstance(
      user.id,
      instance.id,
    );

    expect(result.status).toBe(JoinStatus.JOINED);

    const invite = await db.query.shiftInstanceInvites.findFirst({
      where: { instanceId: instance.id, userId: user.id },
    });
    expect(invite?.status).toBe(ShiftInviteStatus.SELF_JOINED);
  });

  it('returns REQUIREMENTS_NEEDED for a non-member when instance required forms are missing', async () => {
    const user = await createUser(db);
    const { id: shiftId } = await createShift(db, {
      organizationUnitId,
      visibility: ShiftVisibility.ALL_MEMBERS,
    });
    const instance = await db.query.shiftInstances.findFirst({
      where: { masterId: shiftId },
    });
    if (!instance) throw new Error('Failed to create test shift instance');

    const { form } = await createRequirementForm(db, {
      organizationId,
      organizationUnitId,
      createdById: user.id,
    });
    await requiredFormService.setRequiredForms(
      {
        targetType: RequiredFormTargetType.SHIFT_INSTANCE,
        targetId: instance.id,
      },
      [form.id],
    );

    const result = await shiftService.requestJoinShiftInstance(
      user.id,
      instance.id,
    );

    expect(result.status).toBe(JoinStatus.REQUIREMENTS_NEEDED);
    expect(
      result.requiredForms?.some(
        (item) =>
          item.form.id === form.id &&
          item.targetType === RequiredFormTargetType.SHIFT_INSTANCE,
      ),
    ).toBe(true);
  });

  it('returns combined shift and instance required forms', async () => {
    const user = await createUser(db);
    await addMembership(db, user.id, organizationUnitId);

    const { id: shiftId } = await createShift(db, {
      organizationUnitId,
      visibility: ShiftVisibility.ALL_MEMBERS,
    });
    const instance = await db.query.shiftInstances.findFirst({
      where: { masterId: shiftId },
    });
    if (!instance) throw new Error('Failed to create test shift instance');

    const { form: shiftForm } = await createRequirementForm(db, {
      organizationId,
      organizationUnitId,
      createdById: user.id,
    });
    const { form: instanceForm } = await createRequirementForm(db, {
      organizationId,
      organizationUnitId,
      createdById: user.id,
    });

    await requiredFormService.setRequiredForms(
      { targetType: RequiredFormTargetType.SHIFT, targetId: shiftId },
      [shiftForm.id],
    );
    await requiredFormService.setRequiredForms(
      {
        targetType: RequiredFormTargetType.SHIFT_INSTANCE,
        targetId: instance.id,
      },
      [instanceForm.id],
    );

    const result = await shiftService.requestJoinShiftInstance(
      user.id,
      instance.id,
    );

    expect(result.status).toBe(JoinStatus.REQUIREMENTS_NEEDED);
    expect(result.requiredForms).toHaveLength(2);
    expect(
      result.requiredForms?.some(
        (item) =>
          item.form.id === shiftForm.id &&
          item.targetType === RequiredFormTargetType.SHIFT,
      ),
    ).toBe(true);
    expect(
      result.requiredForms?.some(
        (item) =>
          item.form.id === instanceForm.id &&
          item.targetType === RequiredFormTargetType.SHIFT_INSTANCE,
      ),
    ).toBe(true);
  });
});

describe('ShiftService.updateShiftInstance — single instance required forms', () => {
  let app: INestApplication;
  let db: Database;
  let organizationId: string;
  let organizationUnitId: string;
  let shiftService: ShiftService;
  let requiredFormService: RequiredFormService;

  beforeAll(async () => {
    const context = await getGraphqlTestContext();
    app = context.app;
    db = context.db;
    organizationId = context.organizationId;
    organizationUnitId = context.organizationUnitId;
    shiftService = app.get(ShiftService);
    requiredFormService = app.get(RequiredFormService);
  });

  it('attaches required forms to a single shift instance', async () => {
    const user = await createUser(db);
    await addMembership(db, user.id, organizationUnitId);

    const { id: shiftId } = await createShift(db, {
      organizationUnitId,
      visibility: ShiftVisibility.ALL_MEMBERS,
    });
    const instance = await db.query.shiftInstances.findFirst({
      where: { masterId: shiftId },
    });
    if (!instance) throw new Error('Failed to create test shift instance');

    const { form } = await createRequirementForm(db, {
      organizationId,
      organizationUnitId,
      createdById: user.id,
    });

    await shiftService.updateShiftInstance(
      instance.id,
      {
        title: instance.overrideTitle ?? 'Updated',
        startsAt: instance.actualStartsAt,
        endsAt: instance.actualEndsAt,
        requiredFormIds: [form.id],
      },
      organizationUnitId,
    );

    const requiredForms = await requiredFormService.getRequiredForms({
      targetType: RequiredFormTargetType.SHIFT_INSTANCE,
      targetId: instance.id,
    });

    expect(requiredForms).toHaveLength(1);
    expect(requiredForms[0]?.form.id).toBe(form.id);
  });
});

describe('ShiftService.updateShiftInstance applyToAllFuture', () => {
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

  it('moves surviving instances in place when weekdays and time change together', async () => {
    // Weekly Wed+Thu at 09:00, starting on a Wednesday well in the future so
    // nothing is filtered out as past.
    const seriesStart = new Date(2026, 8, 2, 9, 0, 0, 0); // Wed 2026-09-02
    const shift = await createShift(db, {
      organizationUnitId,
      startsAt: seriesStart,
      endsAt: new Date(2026, 8, 2, 11, 0, 0, 0),
      rrule: 'FREQ=WEEKLY;BYDAY=WE,TH;UNTIL=20261001T000000Z',
    });

    const instancesBefore = await db.query.shiftInstances.findMany({
      where: { masterId: shift.id },
    });
    const firstWednesday = instancesBefore
      .slice()
      .sort(
        (a, b) => a.actualStartsAt.getTime() - b.actualStartsAt.getTime(),
      )[0];
    if (!firstWednesday) throw new Error('expected an expanded instance');

    // A volunteer is signed up for a Wednesday that survives the edit.
    const volunteer = await createUser(db);
    await db.insert(schema.shiftInstanceInvites).values({
      instanceId: firstWednesday.id,
      userId: volunteer.id,
      status: ShiftInviteStatus.ACCEPTED,
    });

    // Change BOTH: drop Thursday for Friday, and move 09:00 -> 14:00.
    const newStart = new Date(2026, 8, 2, 14, 0, 0, 0);
    const newEnd = new Date(2026, 8, 2, 16, 0, 0, 0);

    const updated = await shiftService.updateShiftInstance(
      firstWednesday.id,
      {
        title: shift.title,
        startsAt: newStart,
        endsAt: newEnd,
        rrule: 'FREQ=WEEKLY;BYDAY=WE,FR;UNTIL=20261001T000000Z',
      },
      organizationUnitId,
      { applyToAllFuture: true },
    );

    // The edited row is returned with the NEW times, not stale pre-edit data.
    expect(updated.id).toBe(firstWednesday.id);
    expect(updated.actualStartsAt).toEqual(newStart);
    expect(updated.actualEndsAt).toEqual(newEnd);
    expect(updated.isCancelled).toBe(false);

    // The volunteer's invite is still attached to a live instance.
    const [invite] = await db
      .select()
      .from(schema.shiftInstanceInvites)
      .where(eq(schema.shiftInstanceInvites.userId, volunteer.id));
    expect(invite?.instanceId).toBe(firstWednesday.id);

    // No Thursdays survive; the Wednesdays kept their identity.
    const instancesAfter = await db.query.shiftInstances.findMany({
      where: { masterId: shift.id, isCancelled: false },
    });
    const survivingIds = new Set(instancesAfter.map((i) => i.id));
    expect(survivingIds.has(firstWednesday.id)).toBe(true);
    for (const instance of instancesAfter) {
      expect(instance.actualStartsAt.getHours()).toBe(14);
      expect(instance.actualStartsAt.getDay()).not.toBe(4); // no Thursdays
    }
    expect(instancesAfter.some((i) => i.actualStartsAt.getDay() === 5)).toBe(
      true,
    ); // new Fridays were actually inserted
  });
});

describe('deleteShiftInstance mutation', () => {
  let app: INestApplication;
  let db: Database;
  let organizationUnitId: string;

  beforeAll(async () => {
    const context = await getGraphqlTestContext();
    app = context.app;
    db = context.db;
    organizationUnitId = context.organizationUnitId;
  });

  const DELETE_SHIFT_INSTANCE_MUTATION = `
    mutation DeleteShiftInstance($id: String!) {
      deleteShiftInstance(id: $id) {
        id
        isCancelled
      }
    }
  `;

  const futureWindow = () => ({
    startsAt: new Date(Date.now() + 3600_000),
    endsAt: new Date(Date.now() + 7200_000),
  });

  it('cancels a future shift instance', async () => {
    const { startsAt, endsAt } = futureWindow();
    const shift = await createShift(db, {
      organizationUnitId,
      startsAt,
      endsAt,
      rrule: null,
    });
    const instances = await db.query.shiftInstances.findMany({
      where: { masterId: shift.id },
    });
    const instanceId = instances[0]?.id;
    expect(instanceId).toBeDefined();

    const data = await graphqlRequestRequiringData<{
      deleteShiftInstance: { id: string; isCancelled: boolean };
    }>(
      app,
      {
        query: DELETE_SHIFT_INSTANCE_MUTATION,
        variables: { id: instanceId },
        headers: { 'x-organization-unit-id': organizationUnitId },
      },
      'deleteShiftInstance',
    );

    expect(data.deleteShiftInstance).toEqual({
      id: instanceId,
      isCancelled: true,
    });

    const [reloaded] = await db
      .select()
      .from(schema.shiftInstances)
      .where(eq(schema.shiftInstances.id, instanceId));
    expect(reloaded.isCancelled).toBe(true);
  });

  it('returns a conflict error when the instance is already cancelled', async () => {
    const { startsAt, endsAt } = futureWindow();
    const shift = await createShift(db, {
      organizationUnitId,
      startsAt,
      endsAt,
      rrule: null,
    });
    const instances = await db.query.shiftInstances.findMany({
      where: { masterId: shift.id },
    });
    const instanceId = instances[0]?.id;
    expect(instanceId).toBeDefined();
    await cancelShiftInstance(db, instanceId);

    const response = await graphqlRequest(app, {
      query: DELETE_SHIFT_INSTANCE_MUTATION,
      variables: { id: instanceId },
      headers: { 'x-organization-unit-id': organizationUnitId },
    });

    expect(response.errors).toBeDefined();
    expect(response.errors?.[0]?.message).toMatch(/already cancelled/);
  });

  const DELETE_SHIFT_INSTANCE_SERIES_MUTATION = `
    mutation DeleteShiftInstance($id: String!, $applyToAllFuture: Boolean) {
      deleteShiftInstance(id: $id, applyToAllFuture: $applyToAllFuture) {
        id
        isCancelled
      }
    }
  `;

  it('cancels this and all future instances when applyToAllFuture is true', async () => {
    const { startsAt, endsAt } = futureWindow();
    const shift = await createShift(db, {
      organizationUnitId,
      startsAt,
      endsAt,
      rrule: null,
    });
    const [anchor] = await db.query.shiftInstances.findMany({
      where: { masterId: shift.id },
    });
    const sibling = await createShiftInstance(db, shift.id, {
      actualStartsAt: new Date(startsAt.getTime() + 86_400_000),
      actualEndsAt: new Date(endsAt.getTime() + 86_400_000),
      occurrenceIndex: 1,
    });

    const data = await graphqlRequestRequiringData<{
      deleteShiftInstance: { id: string; isCancelled: boolean };
    }>(
      app,
      {
        query: DELETE_SHIFT_INSTANCE_SERIES_MUTATION,
        variables: { id: anchor.id, applyToAllFuture: true },
        headers: { 'x-organization-unit-id': organizationUnitId },
      },
      'deleteShiftInstance',
    );

    expect(data.deleteShiftInstance).toEqual({
      id: anchor.id,
      isCancelled: true,
    });

    const [reloadedSibling] = await db
      .select()
      .from(schema.shiftInstances)
      .where(eq(schema.shiftInstances.id, sibling.id));
    expect(reloadedSibling.isCancelled).toBe(true);
  });
});

describe('ShiftService.updateShiftInstance — one-off syncs to master', () => {
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

  it('Updates master when updating a one-off instance', async () => {
    // One-off shift (no rrule) has a single instance that IS the shift, so
    // editing it must keep the series-level master in sync.
    const startsAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
    const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000);
    const shift = await createShift(db, {
      organizationUnitId,
      startsAt,
      endsAt,
      rrule: null,
      minVolunteers: 2,
      maxVolunteers: 5,
      title: 'Litre pack',
      instructions: 'Do this',
      location: 'London',
    });

    const [instance] = await db.query.shiftInstances.findMany({
      where: { masterId: shift.id },
    });
    if (!instance)
      throw new Error('expected one instance for the one-off shift');

    await shiftService.updateShiftInstance(
      instance.id,
      {
        title: 'Litter pick',
        instructions: 'Do that',
        location: 'Berlin',
        startsAt,
        endsAt,
        minVolunteers: 3,
        maxVolunteers: 10,
      },
      organizationUnitId,
    );

    const [master] = await db
      .select()
      .from(schema.shifts)
      .where(eq(schema.shifts.id, shift.id));

    expect(master.title).toBe('Litter pick');
    expect(master.instructions).toBe('Do that');
    expect(master.location).toBe('Berlin');
    expect(master.minVolunteers).toBe(3);
    expect(master.maxVolunteers).toBe(10);
  });

  it('leaves the master unchanged when editing one instance of a recurring shift', async () => {
    const startsAt = new Date(2026, 8, 2, 9, 0, 0, 0); // Wed 2026-09-02, future
    const endsAt = new Date(2026, 8, 2, 11, 0, 0, 0);
    const shift = await createShift(db, {
      organizationUnitId,
      startsAt,
      endsAt,
      rrule: 'FREQ=WEEKLY;BYDAY=WE,TH;UNTIL=20261001T000000Z',
      minVolunteers: 2,
      maxVolunteers: 5,
      title: 'Litre pack',
      instructions: 'Do this',
      location: 'London',
    });

    const instances = await db.query.shiftInstances.findMany({
      where: { masterId: shift.id },
    });
    const target = instances[0];
    if (!target) throw new Error('expected expanded instances');

    await shiftService.updateShiftInstance(
      target.id,
      {
        startsAt: target.actualStartsAt,
        endsAt: target.actualEndsAt,
        minVolunteers: 9,
        maxVolunteers: 12,
        title: 'Litter pick',
        instructions: 'Do that',
        location: 'Berlin',
      },
      organizationUnitId,
    );

    const [master] = await db
      .select()
      .from(schema.shifts)
      .where(eq(schema.shifts.id, shift.id));
    // Only the per-instance override changes; the master stays as authored.
    expect(master.title).toBe('Litre pack');
    expect(master.instructions).toBe('Do this');
    expect(master.location).toBe('London');
    expect(master.minVolunteers).toBe(2);
    expect(master.maxVolunteers).toBe(5);
  });
});

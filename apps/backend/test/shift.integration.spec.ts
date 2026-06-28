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
import { MembershipRequestStatus } from '../src/membership/enums';
import { ShiftInviteStatus } from '../src/shift/enums';
import { applyBunAuthMocks } from './helpers/auth-mocks';
import { graphqlRequestRequiringData } from './helpers/graphql-request';
import { getGraphqlTestContext } from './helpers/graphql-test-context';

applyBunAuthMocks(mock.module);
setDefaultTimeout(20_000);

describe('ShiftService.findShiftsForWeek', () => {
  let app: INestApplication;
  let db: Database;
  let organizationId: string;
  let organizationUnitId: string;

  beforeAll(async () => {
    const context = await getGraphqlTestContext();
    app = context.app;
    db = context.db;
    organizationId = context.organizationId;

    const rootUnit = await db.query.organizationUnits.findFirst({
      where: {
        organizationId,
        parentId: {
          isNull: true,
        },
      },
      columns: { id: true },
    });

    if (!rootUnit) {
      throw new Error('Root organization unit not found');
    }

    organizationUnitId = rootUnit.id;
  });

  it('returns instances within the week and excludes cancelled instances', async () => {
    const startsAt = new Date('2026-06-15T08:00:00.000Z');
    const endsAt = new Date('2026-06-15T10:00:00.000Z');

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
            title: `Test Weekly Shift ${crypto.randomUUID()}`,
            instructions: null,
            location: null,
            startsAt: startsAt.toISOString(),
            endsAt: endsAt.toISOString(),
            visibility: 'ALL_MEMBERS',
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

    const instancesData = await graphqlRequestRequiringData<{
      shiftInstances: Array<{ id: string }>;
    }>(
      app,
      {
        query: `
          query GetShiftInstances($shiftId: ID!) {
            shiftInstances(shiftId: $shiftId) {
              id
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

    const instanceId = instancesData.shiftInstances[0]?.id;
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

    await db
      .update(schema.shiftInstances)
      .set({ isCancelled: true })
      .where(eq(schema.shiftInstances.id, instanceId));

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
    const userId = `shift-wide-invite-user-${crypto.randomUUID()}`;
    await db.insert(schema.users).values({
      id: userId,
      name: 'Shift Wide Invite User',
      email: `shift-wide-invite-${crypto.randomUUID()}@example.com`,
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
            title: `All Instances Invite Shift ${crypto.randomUUID()}`,
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
    const [secondInstance, thirdInstance] = await db
      .insert(schema.shiftInstances)
      .values([
        {
          masterId: shiftId,
          actualStartsAt: new Date('2026-06-19T08:00:00.000Z'),
          actualEndsAt: new Date('2026-06-19T10:00:00.000Z'),
          occurrenceIndex: 1,
        },
        {
          masterId: shiftId,
          actualStartsAt: new Date('2026-06-20T08:00:00.000Z'),
          actualEndsAt: new Date('2026-06-20T10:00:00.000Z'),
          occurrenceIndex: 2,
        },
      ])
      .returning();

    if (!secondInstance || !thirdInstance) {
      throw new Error('Expected additional shift instances to be created');
    }

    const instances = await db.query.shiftInstances.findMany({
      where: { masterId: shiftId },
      orderBy: { actualStartsAt: 'asc' },
    });
    expect(instances).toHaveLength(3);

    const cancelledInstanceId = instances[1]?.id;
    if (!cancelledInstanceId) {
      throw new Error('Expected a shift instance to cancel');
    }

    await db
      .update(schema.shiftInstances)
      .set({ isCancelled: true })
      .where(eq(schema.shiftInstances.id, cancelledInstanceId));

    await graphqlRequestRequiringData<{
      inviteMembersToShift: { id: string };
    }>(
      app,
      {
        query: `
          mutation InviteMembersToShift($shiftId: String!, $memberIds: [String!]!) {
            inviteMembersToShift(shiftId: $shiftId, memberIds: $memberIds) {
              id
            }
          }
        `,
        variables: {
          shiftId,
          memberIds: [userId],
        },
        headers: {
          'x-organization-unit-id': organizationUnitId,
        },
      },
      'inviteMembersToShift',
    );

    const invites = await db.query.shiftInstanceInvites.findMany({
      where: { userId, status: ShiftInviteStatus.ACCEPTED },
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
  });

  it('invites members to past instances as well as future instances', async () => {
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
      inviteMembersToShift: { id: string };
    }>(
      app,
      {
        query: `
          mutation InviteMembersToShift($shiftId: String!, $memberIds: [String!]!) {
            inviteMembersToShift(shiftId: $shiftId, memberIds: $memberIds) {
              id
            }
          }
        `,
        variables: {
          shiftId,
          memberIds: [userId],
        },
        headers: {
          'x-organization-unit-id': organizationUnitId,
        },
      },
      'inviteMembersToShift',
    );

    const invites = await db.query.shiftInstanceInvites.findMany({
      where: { userId, status: ShiftInviteStatus.ACCEPTED },
    });

    const invitedInstanceIds = invites
      .map((invite) => invite.instanceId)
      .sort();
    expect(invitedInstanceIds).toContain(pastInstance.id);
    expect(invitedInstanceIds).toContain(futureInstance.id);
  });

  it('approves a shift membership request into only the intended shift instance', async () => {
    const userId = `shift-join-user-${crypto.randomUUID()}`;
    await db.insert(schema.users).values({
      id: userId,
      name: 'Shift Join User',
      email: `shift-join-${crypto.randomUUID()}@example.com`,
    });

    const startsAt = new Date('2026-06-16T08:00:00.000Z');
    const endsAt = new Date('2026-06-16T10:00:00.000Z');

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
            title: `Approval Instance Shift ${crypto.randomUUID()}`,
            instructions: null,
            location: null,
            startsAt: startsAt.toISOString(),
            endsAt: endsAt.toISOString(),
            visibility: 'ALL_MEMBERS',
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
    const existingInstances = await db.query.shiftInstances.findMany({
      where: { masterId: shiftId },
    });
    const intendedInstanceId = existingInstances[0]?.id;
    if (!intendedInstanceId) {
      throw new Error('Expected created shift to have an instance');
    }

    const [otherInstance] = await db
      .insert(schema.shiftInstances)
      .values({
        masterId: shiftId,
        actualStartsAt: new Date('2026-06-17T08:00:00.000Z'),
        actualEndsAt: new Date('2026-06-17T10:00:00.000Z'),
        occurrenceIndex: 1,
      })
      .returning();

    if (!otherInstance) {
      throw new Error('Expected second shift instance to be created');
    }

    const [membershipRequest] = await db
      .insert(schema.membershipRequests)
      .values({
        userId,
        organizationUnitId,
        status: MembershipRequestStatus.PENDING,
        metadata: {
          intendedShiftInstanceIds: [intendedInstanceId],
        },
      })
      .returning();

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
      where: { userId, status: ShiftInviteStatus.ACCEPTED },
    });

    expect(invites.map((invite) => invite.instanceId).sort()).toEqual([
      intendedInstanceId,
    ]);
    expect(invites.map((invite) => invite.instanceId)).not.toContain(
      otherInstance.id,
    );
  });

  it('approves a shift membership request into all intended shift instances', async () => {
    const userId = `shift-all-instances-user-${crypto.randomUUID()}`;
    await db.insert(schema.users).values({
      id: userId,
      name: 'Shift All Instances User',
      email: `shift-all-instances-${crypto.randomUUID()}@example.com`,
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
            title: `Approval Whole Shift ${crypto.randomUUID()}`,
            instructions: null,
            location: null,
            startsAt: '2026-06-21T08:00:00.000Z',
            endsAt: '2026-06-21T10:00:00.000Z',
            visibility: 'ALL_MEMBERS',
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
    const [secondInstance, cancelledInstance] = await db
      .insert(schema.shiftInstances)
      .values([
        {
          masterId: shiftId,
          actualStartsAt: new Date('2026-06-22T08:00:00.000Z'),
          actualEndsAt: new Date('2026-06-22T10:00:00.000Z'),
          occurrenceIndex: 1,
        },
        {
          masterId: shiftId,
          actualStartsAt: new Date('2026-06-23T08:00:00.000Z'),
          actualEndsAt: new Date('2026-06-23T10:00:00.000Z'),
          isCancelled: true,
          occurrenceIndex: 2,
        },
      ])
      .returning();

    if (!secondInstance || !cancelledInstance) {
      throw new Error('Expected additional shift instances to be created');
    }

    const instances = await db.query.shiftInstances.findMany({
      where: { masterId: shiftId },
      orderBy: { actualStartsAt: 'asc' },
    });
    expect(instances).toHaveLength(3);

    const [membershipRequest] = await db
      .insert(schema.membershipRequests)
      .values({
        userId,
        organizationUnitId,
        status: MembershipRequestStatus.PENDING,
        metadata: {
          intendedShiftIds: [shiftId],
        },
      })
      .returning();

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
      where: { userId, status: ShiftInviteStatus.ACCEPTED },
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
});

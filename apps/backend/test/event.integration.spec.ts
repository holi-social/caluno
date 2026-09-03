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
import { EventInviteStatus } from '../src/event/enums';
import { EventService } from '../src/event/event.service';
import { MembershipRequestStatus } from '../src/membership/enums';
import { JoinStatus } from '../src/shared/enums/join-status.enum';
import { ShiftInviteStatus, ShiftVisibility } from '../src/shift/enums';
import {
  createEvent,
  createMembershipRequest,
  createRequirementForm,
  createShift,
  createShiftInstance,
  createUser,
  setEventRequiredForms,
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

describe('publicEvent', () => {
  let app: INestApplication;
  let db: Database;
  let organizationId: string;
  let organizationUnitId: string;

  beforeAll(async () => {
    const context = await getGraphqlTestContext();
    app = context.app;
    db = context.db;
    organizationId = context.organizationId;
    organizationUnitId = context.organizationUnitId;
  });

  it('returns event details for anonymous users', async () => {
    const event = await createEvent(db, {
      organizationUnitId,
      title: 'Public Test Event',
      description: 'A public event',
      startsAt: new Date('2026-08-01T08:00:00.000Z'),
      endsAt: new Date('2026-08-03T18:00:00.000Z'),
    });

    const data = await graphqlRequestRequiringData<{
      publicEvent: {
        id: string;
        title: string;
        description: string;
        organizationUnit: { id: string; name: string };
      };
    }>(
      app,
      {
        query: `
          query PublicEvent($id: ID!) {
            publicEvent(id: $id) {
              id
              title
              description
              organizationUnit { id name }
            }
          }
        `,
        variables: { id: event.id },
      },
      'publicEvent',
    );

    expect(data.publicEvent.id).toBe(event.id);
    expect(data.publicEvent.title).toBe('Public Test Event');
    expect(data.publicEvent.description).toBe('A public event');
    expect(data.publicEvent.organizationUnit.id).toBe(organizationUnitId);
  });

  it('returns NOT_FOUND for missing events', async () => {
    const response = await graphqlRequest(app, {
      query: `
          query PublicEvent($id: ID!) {
            publicEvent(id: $id) { id }
          }
        `,
      variables: { id: '00000000-0000-0000-0000-000000000000' },
    });

    expect(response.errors?.[0]?.extensions?.code).toBe('NOT_FOUND');
  });

  it('computes spotsLeft for shift instances', async () => {
    const event = await createEvent(db, { organizationUnitId });
    const shift = await createShift(db, {
      organizationUnitId,
      eventId: event.id,
      maxVolunteers: 5,
    });
    const instance = await createShiftInstance(db, shift.id, {
      actualStartsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      actualEndsAt: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000,
      ),
      occurrenceIndex: 1,
    });

    const user = await createUser(db);
    await db.insert(schema.shiftInstanceInvites).values({
      instanceId: instance.id,
      userId: user.id,
      status: ShiftInviteStatus.JOINED,
    });

    const data = await graphqlRequestRequiringData<{
      publicEvent: {
        shifts: Array<{
          instances: Array<{ id: string; spotsLeft: number | null }>;
        }>;
      };
    }>(
      app,
      {
        query: `
          query PublicEvent($id: ID!) {
            publicEvent(id: $id) {
              shifts {
                instances { 
                  id 
                  spotsLeft
                }
              }
            }
          }
        `,
        variables: { id: event.id },
      },
      'publicEvent',
    );

    const instanceResult = data.publicEvent.shifts
      .flatMap((shift) => shift.instances)
      .find((i) => i.id === instance.id);

    expect(instanceResult).toBeDefined();
    expect(instanceResult?.spotsLeft).toBe(4);
  });

  it('hides members-only shifts from non-members', async () => {
    const originalUserId = getAuthMockUserId();
    const user = await createUser(db);
    setAuthMockUserId(user.id);

    const event = await createEvent(db, { organizationUnitId });
    const publicShift = await createShift(db, {
      organizationUnitId,
      eventId: event.id,
      visibility: ShiftVisibility.ALL_MEMBERS,
    });
    await createShift(db, {
      organizationUnitId,
      eventId: event.id,
      visibility: ShiftVisibility.INVITED_MEMBERS,
    });

    const data = await graphqlRequestRequiringData<{
      publicEvent: { shifts: Array<{ id: string }> };
    }>(
      app,
      {
        query: `
          query PublicEvent($id: ID!) {
            publicEvent(id: $id) {
              shifts { id }
            }
          }
        `,
        variables: { id: event.id },
      },
      'publicEvent',
    );

    expect(data.publicEvent.shifts).toHaveLength(1);
    expect(data.publicEvent.shifts[0]?.id).toBe(publicShift.id);

    setAuthMockUserId(originalUserId);
  });

  it('shows members-only shifts to members', async () => {
    const originalUserId = getAuthMockUserId();
    const user = await createUser(db);
    await addMembership(db, user.id, organizationUnitId);
    setAuthMockUserId(user.id);

    const event = await createEvent(db, { organizationUnitId });
    const publicShift = await createShift(db, {
      organizationUnitId,
      eventId: event.id,
      visibility: ShiftVisibility.ALL_MEMBERS,
    });
    const privateShift = await createShift(db, {
      organizationUnitId,
      eventId: event.id,
      visibility: ShiftVisibility.INVITED_MEMBERS,
    });

    const data = await graphqlRequestRequiringData<{
      publicEvent: { shifts: Array<{ id: string }> };
    }>(
      app,
      {
        query: `
          query PublicEvent($id: ID!) {
            publicEvent(id: $id) {
              shifts { id }
            }
          }
        `,
        variables: { id: event.id },
      },
      'publicEvent',
    );

    const shiftIds = data.publicEvent.shifts.map((shift) => shift.id).sort();
    expect(shiftIds).toEqual([publicShift.id, privateShift.id].sort());

    setAuthMockUserId(originalUserId);
  });

  it('looks up a public event by slug', async () => {
    const slug = `slug-lookup-event-${crypto.randomUUID()}`;
    const event = await createEvent(db, {
      organizationUnitId,
      title: 'Slug Lookup Event',
      slug,
    });

    const data = await graphqlRequestRequiringData<{
      publicEvent: { id: string; title: string };
    }>(
      app,
      {
        query: `
          query PublicEvent($id: ID!) {
            publicEvent(id: $id) {
              id
              title
            }
          }
        `,
        variables: { id: event.slug },
      },
      'publicEvent',
    );

    expect(data.publicEvent.id).toBe(event.id);
    expect(data.publicEvent.title).toBe('Slug Lookup Event');
  });

  it('keeps the existing slug when the event title is updated', async () => {
    const slug = `original-event-title-${crypto.randomUUID()}`;
    const event = await createEvent(db, {
      organizationUnitId,
      title: 'Original Event Title',
      slug,
    });

    const data = await graphqlRequestRequiringData<{
      updateEvent: { id: string; slug: string; title: string };
    }>(
      app,
      {
        query: `
          mutation UpdateEvent($id: ID!, $input: UpdateEventInput!) {
            updateEvent(id: $id, input: $input) {
              id
              slug
              title
            }
          }
        `,
        variables: {
          id: event.id,
          input: { title: 'Updated Event Title' },
        },
        headers: { 'x-organization-unit-id': organizationUnitId },
      },
      'updateEvent',
    );

    expect(data.updateEvent.id).toBe(event.id);
    expect(data.updateEvent.slug).toBe(event.slug);
    expect(data.updateEvent.title).toBe('Updated Event Title');
  });

  it('returns myJoinStatus NONE for a pending membership that has not started joining this event', async () => {
    const originalUserId = getAuthMockUserId();
    const user = await createUser(db);
    setAuthMockUserId(user.id);

    const event = await createEvent(db, { organizationUnitId });
    await createMembershipRequest(db, {
      userId: user.id,
      organizationUnitId,
      status: MembershipRequestStatus.PENDING,
    });

    const data = await graphqlRequestRequiringData<{
      publicEvent: { myJoinStatus: JoinStatus };
    }>(
      app,
      {
        query: `
          query PublicEvent($id: ID!) {
            publicEvent(id: $id) { myJoinStatus }
          }
        `,
        variables: { id: event.id },
      },
      'publicEvent',
    );

    expect(data.publicEvent.myJoinStatus).toBe(JoinStatus.NONE);

    setAuthMockUserId(originalUserId);
  });

  it('returns myJoinStatus PENDING for a pending membership after starting to join this event', async () => {
    const originalUserId = getAuthMockUserId();
    const user = await createUser(db);
    setAuthMockUserId(user.id);

    const event = await createEvent(db, { organizationUnitId });
    await createMembershipRequest(db, {
      userId: user.id,
      organizationUnitId,
      status: MembershipRequestStatus.PENDING,
      metadata: { intendedEventIds: [event.id] },
    });

    const data = await graphqlRequestRequiringData<{
      publicEvent: { myJoinStatus: JoinStatus };
    }>(
      app,
      {
        query: `
          query PublicEvent($id: ID!) {
            publicEvent(id: $id) { myJoinStatus }
          }
        `,
        variables: { id: event.id },
      },
      'publicEvent',
    );

    expect(data.publicEvent.myJoinStatus).toBe(JoinStatus.PENDING);

    setAuthMockUserId(originalUserId);
  });

  it('returns myJoinStatus REJECTED for a rejected membership', async () => {
    const originalUserId = getAuthMockUserId();
    const user = await createUser(db);
    setAuthMockUserId(user.id);

    const event = await createEvent(db, { organizationUnitId });
    await createMembershipRequest(db, {
      userId: user.id,
      organizationUnitId,
      status: MembershipRequestStatus.REJECTED,
    });

    const data = await graphqlRequestRequiringData<{
      publicEvent: { myJoinStatus: JoinStatus };
    }>(
      app,
      {
        query: `
          query PublicEvent($id: ID!) {
            publicEvent(id: $id) { myJoinStatus }
          }
        `,
        variables: { id: event.id },
      },
      'publicEvent',
    );

    expect(data.publicEvent.myJoinStatus).toBe(JoinStatus.REJECTED);

    setAuthMockUserId(originalUserId);
  });

  it('returns myJoinStatus REJECTED after admin uninvite (ADMIN_REJECTED invite)', async () => {
    const originalUserId = getAuthMockUserId();
    const user = await createUser(db);
    setAuthMockUserId(user.id);

    const event = await createEvent(db, { organizationUnitId });
    await db.insert(schema.eventInvites).values({
      eventId: event.id,
      userId: user.id,
      status: EventInviteStatus.ADMIN_REJECTED,
    });

    const data = await graphqlRequestRequiringData<{
      publicEvent: { myJoinStatus: JoinStatus };
    }>(
      app,
      {
        query: `
          query PublicEvent($id: ID!) {
            publicEvent(id: $id) { myJoinStatus }
          }
        `,
        variables: { id: event.id },
      },
      'publicEvent',
    );

    expect(data.publicEvent.myJoinStatus).toBe(JoinStatus.REJECTED);

    setAuthMockUserId(originalUserId);
  });

  it('joinEvent returns REQUIREMENTS_NEEDED for pending members with missing event forms', async () => {
    const originalUserId = getAuthMockUserId();
    const user = await createUser(db);
    setAuthMockUserId(user.id);

    const event = await createEvent(db, { organizationUnitId });
    await createMembershipRequest(db, {
      userId: user.id,
      organizationUnitId,
      status: MembershipRequestStatus.PENDING,
    });

    const { form } = await createRequirementForm(db, {
      organizationId,
      organizationUnitId,
      createdById: user.id,
    });
    await setEventRequiredForms(db, { eventId: event.id, formIds: [form.id] });

    const data = await graphqlRequestRequiringData<{
      joinEvent: {
        status: JoinStatus;
        requiredForms: Array<{ submitted: boolean }> | null;
      };
    }>(
      app,
      {
        query: `
          mutation JoinEvent($eventId: ID!) {
            joinEvent(eventId: $eventId) {
              status
              requiredForms { submitted }
            }
          }
        `,
        variables: { eventId: event.id },
      },
      'joinEvent',
    );

    expect(data.joinEvent.status).toBe(JoinStatus.REQUIREMENTS_NEEDED);
    expect(data.joinEvent.requiredForms?.some((f) => !f.submitted)).toBe(true);

    setAuthMockUserId(originalUserId);
  });

  it('joinEvent returns PENDING for pending members with satisfied event forms', async () => {
    const originalUserId = getAuthMockUserId();
    const user = await createUser(db);
    setAuthMockUserId(user.id);

    const event = await createEvent(db, { organizationUnitId });
    await createMembershipRequest(db, {
      userId: user.id,
      organizationUnitId,
      status: MembershipRequestStatus.PENDING,
    });

    const data = await graphqlRequestRequiringData<{
      joinEvent: { status: JoinStatus };
    }>(
      app,
      {
        query: `
          mutation JoinEvent($eventId: ID!) {
            joinEvent(eventId: $eventId) { status }
          }
        `,
        variables: { eventId: event.id },
      },
      'joinEvent',
    );

    expect(data.joinEvent.status).toBe(JoinStatus.PENDING);

    setAuthMockUserId(originalUserId);
  });

  it('joinEvent returns JOINED for members with satisfied event forms', async () => {
    const originalUserId = getAuthMockUserId();
    const user = await createUser(db);
    await addMembership(db, user.id, organizationUnitId);
    setAuthMockUserId(user.id);

    const event = await createEvent(db, { organizationUnitId });

    const data = await graphqlRequestRequiringData<{
      joinEvent: { status: JoinStatus };
    }>(
      app,
      {
        query: `
          mutation JoinEvent($eventId: ID!) {
            joinEvent(eventId: $eventId) { status }
          }
        `,
        variables: { eventId: event.id },
      },
      'joinEvent',
    );

    expect(data.joinEvent.status).toBe(JoinStatus.JOINED);

    setAuthMockUserId(originalUserId);
  });

  it('joinEvent returns REJECTED for rejected memberships', async () => {
    const originalUserId = getAuthMockUserId();
    const user = await createUser(db);
    setAuthMockUserId(user.id);

    const event = await createEvent(db, { organizationUnitId });
    await createMembershipRequest(db, {
      userId: user.id,
      organizationUnitId,
      status: MembershipRequestStatus.REJECTED,
    });

    const data = await graphqlRequestRequiringData<{
      joinEvent: { status: JoinStatus };
    }>(
      app,
      {
        query: `
          mutation JoinEvent($eventId: ID!) {
            joinEvent(eventId: $eventId) { status }
          }
        `,
        variables: { eventId: event.id },
      },
      'joinEvent',
    );

    expect(data.joinEvent.status).toBe(JoinStatus.REJECTED);

    setAuthMockUserId(originalUserId);
  });
});

describe('myEvents', () => {
  let app: INestApplication;
  let db: Database;
  let organizationUnitId: string;

  beforeAll(async () => {
    const context = await getGraphqlTestContext();
    app = context.app;
    db = context.db;
    organizationUnitId = context.organizationUnitId;
  });

  it('filters myEvents by invite status', async () => {
    const originalUserId = getAuthMockUserId();
    const user = await createUser(db);
    await addMembership(db, user.id, organizationUnitId);
    setAuthMockUserId(user.id);

    const invitedEvent = await createEvent(db, { organizationUnitId });
    const acceptedEvent = await createEvent(db, { organizationUnitId });

    await db.insert(schema.eventInvites).values([
      {
        eventId: invitedEvent.id,
        userId: user.id,
        status: EventInviteStatus.ADMIN_INVITED,
      },
      {
        eventId: acceptedEvent.id,
        userId: user.id,
        status: EventInviteStatus.JOINED,
      },
    ]);

    const query = `
      query MyEvents($includePast: Boolean!, $statuses: [EventInviteStatus!]) {
        myEvents(includePast: $includePast, statuses: $statuses) {
          items { id }
        }
      }
    `;

    const invitedOnly = await graphqlRequestRequiringData<{
      myEvents: { items: Array<{ id: string }> };
    }>(
      app,
      {
        query,
        variables: { includePast: true, statuses: ['ADMIN_INVITED'] },
      },
      'myEvents',
    );
    const invitedIds = invitedOnly.myEvents.items.map((item) => item.id);
    expect(invitedIds).toContain(invitedEvent.id);
    expect(invitedIds).not.toContain(acceptedEvent.id);

    const defaultStatuses = await graphqlRequestRequiringData<{
      myEvents: { items: Array<{ id: string }> };
    }>(
      app,
      {
        query,
        variables: { includePast: true, statuses: null },
      },
      'myEvents',
    );
    const defaultIds = defaultStatuses.myEvents.items.map((item) => item.id);
    expect(defaultIds).toContain(acceptedEvent.id);
    expect(defaultIds).not.toContain(invitedEvent.id);

    setAuthMockUserId(originalUserId);
  });

  it("does not leak another user's invites", async () => {
    const originalUserId = getAuthMockUserId();

    const userA = await createUser(db);
    const userB = await createUser(db);
    await addMembership(db, userA.id, organizationUnitId);
    await addMembership(db, userB.id, organizationUnitId);

    const eventForA = await createEvent(db, { organizationUnitId });
    const eventForB = await createEvent(db, { organizationUnitId });

    await db.insert(schema.eventInvites).values([
      {
        eventId: eventForA.id,
        userId: userA.id,
        status: EventInviteStatus.ADMIN_INVITED,
      },
      {
        eventId: eventForB.id,
        userId: userB.id,
        status: EventInviteStatus.ADMIN_INVITED,
      },
    ]);

    const query = `
      query MyEvents($includePast: Boolean!, $statuses: [EventInviteStatus!]) {
        myEvents(includePast: $includePast, statuses: $statuses) {
          items { id }
        }
      }
    `;

    setAuthMockUserId(userA.id);
    const asUserA = await graphqlRequestRequiringData<{
      myEvents: { items: Array<{ id: string }> };
    }>(
      app,
      { query, variables: { includePast: true, statuses: ['ADMIN_INVITED'] } },
      'myEvents',
    );
    const idsForA = asUserA.myEvents.items.map((item) => item.id);
    expect(idsForA).toContain(eventForA.id);
    expect(idsForA).not.toContain(eventForB.id);

    setAuthMockUserId(userB.id);
    const asUserB = await graphqlRequestRequiringData<{
      myEvents: { items: Array<{ id: string }> };
    }>(
      app,
      { query, variables: { includePast: true, statuses: ['ADMIN_INVITED'] } },
      'myEvents',
    );
    const idsForB = asUserB.myEvents.items.map((item) => item.id);
    expect(idsForB).toContain(eventForB.id);
    expect(idsForB).not.toContain(eventForA.id);

    setAuthMockUserId(originalUserId);
  });
});

describe('availableEvents', () => {
  let app: INestApplication;
  let db: Database;
  let testUserId: string;
  let organizationUnitId: string;

  beforeAll(async () => {
    const context = await getGraphqlTestContext();
    app = context.app;
    db = context.db;
    testUserId = context.testUserId;
    organizationUnitId = context.organizationUnitId;
  });

  const availableEventsQuery = `
    query AvailableEvents(
      $startsAfter: DateTime
      $endsBefore: DateTime
      $organizationUnitIds: [ID!]
    ) {
      availableEvents(
        startsAfter: $startsAfter
        endsBefore: $endsBefore
        organizationUnitIds: $organizationUnitIds
      ) {
        items { id }
        pagination { total limit offset hasMore }
      }
    }
  `;

  it('returns events from the accepted org unit, ordered by startsAt ascending', async () => {
    const later = await createEvent(db, {
      organizationUnitId,
      startsAt: new Date('2027-04-02T09:00:00.000Z'),
      endsAt: new Date('2027-04-02T11:00:00.000Z'),
    });
    const sooner = await createEvent(db, {
      organizationUnitId,
      startsAt: new Date('2027-04-01T09:00:00.000Z'),
      endsAt: new Date('2027-04-01T11:00:00.000Z'),
    });

    const data = await graphqlRequestRequiringData<{
      availableEvents: { items: Array<{ id: string }> };
    }>(
      app,
      {
        query: availableEventsQuery,
        variables: {
          // startsAfter only — buildMyEventDateCondition lets endsBefore win
          // outright and drop the lower bound entirely, which would let in
          // every near-"now" event this file's other tests create and crowd
          // these 2027-dated ones off the default 15-item page.
          startsAfter: new Date('2027-04-01T00:00:00.000Z').toISOString(),
        },
      },
      'availableEvents',
    );

    const ids = data.availableEvents.items.map((item) => item.id);
    expect(ids.indexOf(sooner.id)).toBeGreaterThanOrEqual(0);
    expect(ids.indexOf(later.id)).toBeGreaterThan(ids.indexOf(sooner.id));
  });

  it('includes events from a pending membership request org unit', async () => {
    const pendingUser = await createUser(db);
    await createMembershipRequest(db, {
      userId: pendingUser.id,
      organizationUnitId,
    });

    const event = await createEvent(db, {
      organizationUnitId,
      startsAt: new Date('2027-04-05T09:00:00.000Z'),
      endsAt: new Date('2027-04-05T11:00:00.000Z'),
    });

    const originalUserId = getAuthMockUserId();
    setAuthMockUserId(pendingUser.id);
    try {
      const data = await graphqlRequestRequiringData<{
        availableEvents: { items: Array<{ id: string }> };
      }>(
        app,
        {
          query: availableEventsQuery,
          // startsAfter only — see the note in the "ordered by startsAt"
          // test above on why endsBefore can't be combined with it here.
          variables: {
            startsAfter: new Date(
              event.startsAt.getTime() - 60000,
            ).toISOString(),
          },
        },
        'availableEvents',
      );

      expect(data.availableEvents.items.map((item) => item.id)).toContain(
        event.id,
      );
    } finally {
      setAuthMockUserId(originalUserId);
    }
  });

  it('excludes events with a participating invite but keeps merely-invited events', async () => {
    const acceptedEvent = await createEvent(db, {
      organizationUnitId,
      startsAt: new Date('2027-04-06T09:00:00.000Z'),
      endsAt: new Date('2027-04-06T11:00:00.000Z'),
    });
    const invitedEvent = await createEvent(db, {
      organizationUnitId,
      startsAt: new Date('2027-04-06T09:00:00.000Z'),
      endsAt: new Date('2027-04-06T11:00:00.000Z'),
    });
    await db.insert(schema.eventInvites).values([
      {
        eventId: acceptedEvent.id,
        userId: testUserId,
        status: EventInviteStatus.JOINED,
      },
      {
        eventId: invitedEvent.id,
        userId: testUserId,
        status: EventInviteStatus.ADMIN_INVITED,
      },
    ]);

    const data = await graphqlRequestRequiringData<{
      availableEvents: { items: Array<{ id: string }> };
    }>(
      app,
      {
        query: availableEventsQuery,
        // startsAfter only — see the note above on endsBefore's precedence quirk.
        variables: {
          startsAfter: new Date('2027-04-06T00:00:00.000Z').toISOString(),
        },
      },
      'availableEvents',
    );

    const ids = data.availableEvents.items.map((item) => item.id);
    expect(ids).not.toContain(acceptedEvent.id);
    expect(ids).toContain(invitedEvent.id);
  });

  it('includes a currently-active event (started, not yet ended)', async () => {
    const activeEvent = await createEvent(db, {
      organizationUnitId,
      startsAt: new Date(Date.now() - 60 * 60 * 1000),
      endsAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    const data = await graphqlRequestRequiringData<{
      availableEvents: { items: Array<{ id: string }> };
    }>(
      app,
      {
        query: availableEventsQuery,
        variables: {},
      },
      'availableEvents',
    );

    expect(data.availableEvents.items.map((item) => item.id)).toContain(
      activeEvent.id,
    );
  });

  it('excludes an event that has already ended', async () => {
    const endedEvent = await createEvent(db, {
      organizationUnitId,
      startsAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      endsAt: new Date(Date.now() - 60 * 60 * 1000),
    });

    const data = await graphqlRequestRequiringData<{
      availableEvents: { items: Array<{ id: string }> };
    }>(
      app,
      {
        query: availableEventsQuery,
        variables: {},
      },
      'availableEvents',
    );

    expect(data.availableEvents.items.map((item) => item.id)).not.toContain(
      endedEvent.id,
    );
  });

  it('returns an empty page for a user with no accessible org units', async () => {
    const isolatedUser = await createUser(db);

    const originalUserId = getAuthMockUserId();
    setAuthMockUserId(isolatedUser.id);
    try {
      const data = await graphqlRequestRequiringData<{
        availableEvents: {
          items: Array<{ id: string }>;
          pagination: { total: number };
        };
      }>(
        app,
        { query: availableEventsQuery, variables: {} },
        'availableEvents',
      );

      expect(data.availableEvents.items).toEqual([]);
      expect(data.availableEvents.pagination.total).toBe(0);
    } finally {
      setAuthMockUserId(originalUserId);
    }
  });

  it('narrows results by organizationUnitIds, ignoring ids outside the accessible set', async () => {
    const { organization: otherOrganization, type: otherType } =
      await createOrganizationWithType(db, `Other Org ${crypto.randomUUID()}`);
    const otherUnit = await createUnit(db, {
      organizationId: otherOrganization.id,
      typeId: otherType.id,
      name: 'root',
    });

    const memberUser = await createUser(db);
    await addMembership(db, memberUser.id, organizationUnitId);

    const inUnitEvent = await createEvent(db, {
      organizationUnitId,
      startsAt: new Date('2027-04-08T09:00:00.000Z'),
      endsAt: new Date('2027-04-08T11:00:00.000Z'),
    });

    const originalUserId = getAuthMockUserId();
    setAuthMockUserId(memberUser.id);
    try {
      const outsideOnly = await graphqlRequestRequiringData<{
        availableEvents: { items: Array<{ id: string }> };
      }>(
        app,
        {
          query: availableEventsQuery,
          variables: { organizationUnitIds: [otherUnit.id] },
        },
        'availableEvents',
      );
      expect(outsideOnly.availableEvents.items).toEqual([]);

      const withBoth = await graphqlRequestRequiringData<{
        availableEvents: { items: Array<{ id: string }> };
      }>(
        app,
        {
          query: availableEventsQuery,
          // startsAfter only — see the note above on endsBefore's precedence quirk.
          variables: {
            organizationUnitIds: [organizationUnitId, otherUnit.id],
            startsAfter: new Date('2027-04-08T00:00:00.000Z').toISOString(),
          },
        },
        'availableEvents',
      );
      expect(withBoth.availableEvents.items.map((item) => item.id)).toContain(
        inUnitEvent.id,
      );
    } finally {
      setAuthMockUserId(originalUserId);
    }
  });

  it('requires only a session, no admin permission', async () => {
    const plainMember = await createUser(db);
    await addMembership(db, plainMember.id, organizationUnitId);

    const originalUserId = getAuthMockUserId();
    setAuthMockUserId(plainMember.id);
    try {
      const response = await graphqlRequest<{
        availableEvents: { items: Array<{ id: string }> };
      }>(app, { query: availableEventsQuery, variables: {} });

      expect(response.errors).toBeUndefined();
    } finally {
      setAuthMockUserId(originalUserId);
    }
  });
});

describe('eventInvites', () => {
  let app: INestApplication;
  let db: Database;
  let organizationUnitId: string;

  beforeAll(async () => {
    const context = await getGraphqlTestContext();
    app = context.app;
    db = context.db;
    organizationUnitId = context.organizationUnitId;
  });

  it('does not leak invites when queried from another organization', async () => {
    const testUserId = getAuthMockUserId();

    const event = await createEvent(db, { organizationUnitId });
    const invitedUser = await createUser(db);
    await db.insert(schema.eventInvites).values({
      eventId: event.id,
      userId: invitedUser.id,
      status: EventInviteStatus.ADMIN_INVITED,
    });

    const { organization: otherOrganization, type: otherType } =
      await createOrganizationWithType(db, `Other Org ${crypto.randomUUID()}`);
    const otherUnit = await createUnit(db, {
      organizationId: otherOrganization.id,
      typeId: otherType.id,
      name: 'root',
    });

    const membership = await addMembership(db, testUserId, otherUnit.id);
    const role = await createRole(db, {
      organizationId: otherOrganization.id,
    });
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

    const query = `
      query EventInvites($eventId: ID!) {
        eventInvites(eventId: $eventId) {
          id
        }
      }
    `;

    const response = await graphqlRequest<{
      eventInvites: Array<{ id: string }>;
    }>(app, {
      query,
      variables: { eventId: event.id },
      headers: { 'x-organization-unit-id': otherUnit.id },
    });

    expect(response.data).toBeNull();
    expect(response.errors?.[0]?.message).toContain('not found');
  });

  it('resolves the invited user via the field resolver/loader', async () => {
    const event = await createEvent(db, { organizationUnitId });
    const invitedUser = await createUser(db);
    const invite = await db
      .insert(schema.eventInvites)
      .values({
        eventId: event.id,
        userId: invitedUser.id,
        status: EventInviteStatus.ADMIN_INVITED,
      })
      .returning();

    const query = `
      query EventInvites($eventId: ID!) {
        eventInvites(eventId: $eventId) {
          id
          user {
            id
            name
            email
          }
        }
      }
    `;

    const data = await graphqlRequestRequiringData<{
      eventInvites: Array<{
        id: string;
        user: { id: string; name: string; email: string };
      }>;
    }>(
      app,
      {
        query,
        variables: { eventId: event.id },
        headers: { 'x-organization-unit-id': organizationUnitId },
      },
      'eventInvites',
    );

    expect(data.eventInvites).toHaveLength(1);
    expect(data.eventInvites[0]?.id).toBe(invite[0]?.id);
    expect(data.eventInvites[0]?.user).toEqual({
      id: invitedUser.id,
      name: invitedUser.name,
      email: invitedUser.email,
    });
  });
});

describe('events (admin list)', () => {
  let app: INestApplication;
  let db: Database;
  let organizationUnitId: string;

  beforeAll(async () => {
    const context = await getGraphqlTestContext();
    app = context.app;
    db = context.db;
    organizationUnitId = context.organizationUnitId;
  });

  const eventsQuery = `
    query Events($limit: Int!, $offset: Int!) {
      events(limit: $limit, offset: $offset) {
        items {
          id
          signedUpCount
        }
      }
    }
  `;

  it('counts only active invites toward signedUpCount', async () => {
    const event = await createEvent(db, { organizationUnitId });
    const statuses = [
      EventInviteStatus.ADMIN_INVITED,
      EventInviteStatus.JOINED,
      EventInviteStatus.JOINED,
      EventInviteStatus.VOLUNTEER_REJECTED,
      EventInviteStatus.ADMIN_REJECTED,
      EventInviteStatus.VOLUNTEER_CANCELLED,
    ];
    for (const status of statuses) {
      const user = await createUser(db);
      await db.insert(schema.eventInvites).values({
        eventId: event.id,
        userId: user.id,
        status,
      });
    }

    const data = await graphqlRequestRequiringData<{
      events: { items: Array<{ id: string; signedUpCount: number }> };
    }>(
      app,
      {
        query: eventsQuery,
        // Large limit: this org unit accumulates events from other describe
        // blocks in this file, so we can't rely on the default page size.
        variables: { limit: 500, offset: 0 },
        headers: { 'x-organization-unit-id': organizationUnitId },
      },
      'events',
    );

    const found = data.events.items.find((item) => item.id === event.id);
    expect(found?.signedUpCount).toBe(3);
  });

  it('returns zero when an event has no invites', async () => {
    const event = await createEvent(db, { organizationUnitId });

    const data = await graphqlRequestRequiringData<{
      events: { items: Array<{ id: string; signedUpCount: number }> };
    }>(
      app,
      {
        query: eventsQuery,
        variables: { limit: 500, offset: 0 },
        headers: { 'x-organization-unit-id': organizationUnitId },
      },
      'events',
    );

    const found = data.events.items.find((item) => item.id === event.id);
    expect(found?.signedUpCount).toBe(0);
  });
});

describe('updateEventInviteStatus (admin uninvite)', () => {
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

  const updateInviteMutation = `
    mutation UpdateEventInviteStatus(
      $eventId: ID!
      $userId: String!
      $status: EventInviteStatus!
    ) {
      updateEventInviteStatus(
        eventId: $eventId
        userId: $userId
        status: $status
      ) {
        status
        userId
      }
    }
  `;

  it('sets ACCEPTED to ADMIN_REJECTED for admin', async () => {
    const event = await createEvent(db, { organizationUnitId });
    const volunteer = await createUser(db);
    await db.insert(schema.eventInvites).values({
      eventId: event.id,
      userId: volunteer.id,
      status: EventInviteStatus.JOINED,
    });

    const data = await graphqlRequestRequiringData<{
      updateEventInviteStatus: { status: string; userId: string };
    }>(
      app,
      {
        query: updateInviteMutation,
        variables: {
          eventId: event.id,
          userId: volunteer.id,
          status: EventInviteStatus.ADMIN_REJECTED,
        },
        headers: { 'x-organization-unit-id': organizationUnitId },
      },
      'updateEventInviteStatus',
    );

    expect(data.updateEventInviteStatus.status).toBe(
      EventInviteStatus.ADMIN_REJECTED,
    );
    expect(data.updateEventInviteStatus.userId).toBe(volunteer.id);

    const row = await db.query.eventInvites.findFirst({
      where: { eventId: event.id, userId: volunteer.id },
    });
    expect(row?.status).toBe(EventInviteStatus.ADMIN_REJECTED);
  });

  it('cascades ADMIN_REJECTED to event-linked shift invites', async () => {
    const event = await createEvent(db, { organizationUnitId });
    const { id: shiftId } = await createShift(db, {
      organizationUnitId,
      eventId: event.id,
    });
    const instances = await db.query.shiftInstances.findMany({
      where: { masterId: shiftId },
    });
    const instanceId = instances[0]?.id;
    expect(instanceId).toBeDefined();
    if (!instanceId) {
      throw new Error('Expected shift instance');
    }

    const volunteer = await createUser(db);
    await db.insert(schema.eventInvites).values({
      eventId: event.id,
      userId: volunteer.id,
      status: EventInviteStatus.ADMIN_INVITED,
    });
    await db.insert(schema.shiftInvites).values({
      shiftId,
      userId: volunteer.id,
      status: ShiftInviteStatus.ADMIN_INVITED,
    });
    await db.insert(schema.shiftInstanceInvites).values({
      instanceId,
      userId: volunteer.id,
      status: ShiftInviteStatus.JOINED,
    });

    await graphqlRequestRequiringData(
      app,
      {
        query: updateInviteMutation,
        variables: {
          eventId: event.id,
          userId: volunteer.id,
          status: EventInviteStatus.ADMIN_REJECTED,
        },
        headers: { 'x-organization-unit-id': organizationUnitId },
      },
      'updateEventInviteStatus',
    );

    const eventInvite = await db.query.eventInvites.findFirst({
      where: { eventId: event.id, userId: volunteer.id },
    });
    const shiftInvite = await db.query.shiftInvites.findFirst({
      where: { shiftId, userId: volunteer.id },
    });
    const instanceInvite = await db.query.shiftInstanceInvites.findFirst({
      where: { instanceId, userId: volunteer.id },
    });

    expect(eventInvite?.status).toBe(EventInviteStatus.ADMIN_REJECTED);
    expect(shiftInvite?.status).toBe(ShiftInviteStatus.ADMIN_REJECTED);
    expect(instanceInvite?.status).toBe(ShiftInviteStatus.ADMIN_REJECTED);
  });

  it('sets ADMIN_REJECTED to INVITED for admin re-invite', async () => {
    const event = await createEvent(db, { organizationUnitId });
    const volunteer = await createUser(db);
    await db.insert(schema.eventInvites).values({
      eventId: event.id,
      userId: volunteer.id,
      status: EventInviteStatus.ADMIN_REJECTED,
    });

    const data = await graphqlRequestRequiringData<{
      updateEventInviteStatus: { status: string; userId: string };
    }>(
      app,
      {
        query: updateInviteMutation,
        variables: {
          eventId: event.id,
          userId: volunteer.id,
          status: EventInviteStatus.ADMIN_INVITED,
        },
        headers: { 'x-organization-unit-id': organizationUnitId },
      },
      'updateEventInviteStatus',
    );

    expect(data.updateEventInviteStatus.status).toBe(
      EventInviteStatus.ADMIN_INVITED,
    );
    expect(data.updateEventInviteStatus.userId).toBe(volunteer.id);

    const row = await db.query.eventInvites.findFirst({
      where: { eventId: event.id, userId: volunteer.id },
    });
    expect(row?.status).toBe(EventInviteStatus.ADMIN_INVITED);
  });

  it('cascades INVITED to event-linked shift invites left ADMIN_REJECTED by a prior uninvite', async () => {
    const event = await createEvent(db, { organizationUnitId });
    const { id: shiftId } = await createShift(db, {
      organizationUnitId,
      eventId: event.id,
    });
    const instances = await db.query.shiftInstances.findMany({
      where: { masterId: shiftId },
    });
    const instanceId = instances[0]?.id;
    expect(instanceId).toBeDefined();
    if (!instanceId) {
      throw new Error('Expected shift instance');
    }

    const volunteer = await createUser(db);
    await db.insert(schema.eventInvites).values({
      eventId: event.id,
      userId: volunteer.id,
      status: EventInviteStatus.ADMIN_REJECTED,
    });
    await db.insert(schema.shiftInvites).values({
      shiftId,
      userId: volunteer.id,
      status: ShiftInviteStatus.ADMIN_REJECTED,
    });
    await db.insert(schema.shiftInstanceInvites).values({
      instanceId,
      userId: volunteer.id,
      status: ShiftInviteStatus.ADMIN_REJECTED,
    });

    await graphqlRequestRequiringData(
      app,
      {
        query: updateInviteMutation,
        variables: {
          eventId: event.id,
          userId: volunteer.id,
          status: EventInviteStatus.ADMIN_INVITED,
        },
        headers: { 'x-organization-unit-id': organizationUnitId },
      },
      'updateEventInviteStatus',
    );

    const eventInvite = await db.query.eventInvites.findFirst({
      where: { eventId: event.id, userId: volunteer.id },
    });
    const shiftInvite = await db.query.shiftInvites.findFirst({
      where: { shiftId, userId: volunteer.id },
    });
    const instanceInvite = await db.query.shiftInstanceInvites.findFirst({
      where: { instanceId, userId: volunteer.id },
    });

    expect(eventInvite?.status).toBe(EventInviteStatus.ADMIN_INVITED);
    expect(shiftInvite?.status).toBe(ShiftInviteStatus.ADMIN_INVITED);
    expect(instanceInvite?.status).toBe(ShiftInviteStatus.ADMIN_INVITED);
  });

  it('does not restore shift invites that were not ADMIN_REJECTED by the event cascade', async () => {
    const event = await createEvent(db, { organizationUnitId });
    const { id: shiftId } = await createShift(db, {
      organizationUnitId,
      eventId: event.id,
    });

    const volunteer = await createUser(db);
    await db.insert(schema.eventInvites).values({
      eventId: event.id,
      userId: volunteer.id,
      status: EventInviteStatus.ADMIN_REJECTED,
    });
    await db.insert(schema.shiftInvites).values({
      shiftId,
      userId: volunteer.id,
      status: ShiftInviteStatus.VOLUNTEER_REJECTED,
    });

    await graphqlRequestRequiringData(
      app,
      {
        query: updateInviteMutation,
        variables: {
          eventId: event.id,
          userId: volunteer.id,
          status: EventInviteStatus.ADMIN_INVITED,
        },
        headers: { 'x-organization-unit-id': organizationUnitId },
      },
      'updateEventInviteStatus',
    );

    const shiftInvite = await db.query.shiftInvites.findFirst({
      where: { shiftId, userId: volunteer.id },
    });
    expect(shiftInvite?.status).toBe(ShiftInviteStatus.VOLUNTEER_REJECTED);
  });

  it('re-invites ADMIN_REJECTED when explicitly included in inviteMembersToEvent', async () => {
    const event = await createEvent(db, { organizationUnitId });
    const volunteer = await createUser(db);
    await db.insert(schema.eventInvites).values({
      eventId: event.id,
      userId: volunteer.id,
      status: EventInviteStatus.ADMIN_REJECTED,
    });

    await graphqlRequestRequiringData<{
      inviteMembersToEvent: { id: string };
    }>(
      app,
      {
        query: `
          mutation InviteMembers($eventId: ID!, $memberIds: [String!]!) {
            inviteMembersToEvent(eventId: $eventId, memberIds: $memberIds) {
              id
            }
          }
        `,
        variables: {
          eventId: event.id,
          memberIds: [volunteer.id],
        },
        headers: { 'x-organization-unit-id': organizationUnitId },
      },
      'inviteMembersToEvent',
    );

    const row = await db.query.eventInvites.findFirst({
      where: { eventId: event.id, userId: volunteer.id },
    });
    expect(row?.status).toBe(EventInviteStatus.ADMIN_INVITED);
  });

  it('does not re-invite ADMIN_REJECTED omitted from inviteMembersToEvent memberIds', async () => {
    const event = await createEvent(db, { organizationUnitId });
    const rejected = await createUser(db);
    const fresh = await createUser(db);
    await db.insert(schema.eventInvites).values({
      eventId: event.id,
      userId: rejected.id,
      status: EventInviteStatus.ADMIN_REJECTED,
    });

    await graphqlRequestRequiringData<{
      inviteMembersToEvent: { id: string };
    }>(
      app,
      {
        query: `
          mutation InviteMembers($eventId: ID!, $memberIds: [String!]!) {
            inviteMembersToEvent(eventId: $eventId, memberIds: $memberIds) {
              id
            }
          }
        `,
        variables: {
          eventId: event.id,
          memberIds: [fresh.id],
        },
        headers: { 'x-organization-unit-id': organizationUnitId },
      },
      'inviteMembersToEvent',
    );

    const rejectedRow = await db.query.eventInvites.findFirst({
      where: { eventId: event.id, userId: rejected.id },
    });
    const freshRow = await db.query.eventInvites.findFirst({
      where: { eventId: event.id, userId: fresh.id },
    });
    expect(rejectedRow?.status).toBe(EventInviteStatus.ADMIN_REJECTED);
    expect(freshRow?.status).toBe(EventInviteStatus.ADMIN_INVITED);
  });

  it('writes ACCEPTED directly when the inviter adds themselves via inviteMembersToEvent', async () => {
    const event = await createEvent(db, { organizationUnitId });
    const selfUserId = getAuthMockUserId();

    await graphqlRequestRequiringData<{
      inviteMembersToEvent: { id: string };
    }>(
      app,
      {
        query: `
          mutation InviteMembers($eventId: ID!, $memberIds: [String!]!) {
            inviteMembersToEvent(eventId: $eventId, memberIds: $memberIds) {
              id
            }
          }
        `,
        variables: {
          eventId: event.id,
          memberIds: [selfUserId],
        },
        headers: { 'x-organization-unit-id': organizationUnitId },
      },
      'inviteMembersToEvent',
    );

    const row = await db.query.eventInvites.findFirst({
      where: { eventId: event.id, userId: selfUserId },
    });
    expect(row?.status).toBe(EventInviteStatus.JOINED);
  });

  it('writes ACCEPTED for the self-adding inviter but INVITED for others in the same batch', async () => {
    const event = await createEvent(db, { organizationUnitId });
    const selfUserId = getAuthMockUserId();
    const otherUser = await createUser(db);

    await graphqlRequestRequiringData<{
      inviteMembersToEvent: { id: string };
    }>(
      app,
      {
        query: `
          mutation InviteMembers($eventId: ID!, $memberIds: [String!]!) {
            inviteMembersToEvent(eventId: $eventId, memberIds: $memberIds) {
              id
            }
          }
        `,
        variables: {
          eventId: event.id,
          memberIds: [selfUserId, otherUser.id],
        },
        headers: { 'x-organization-unit-id': organizationUnitId },
      },
      'inviteMembersToEvent',
    );

    const selfRow = await db.query.eventInvites.findFirst({
      where: { eventId: event.id, userId: selfUserId },
    });
    const otherRow = await db.query.eventInvites.findFirst({
      where: { eventId: event.id, userId: otherUser.id },
    });
    expect(selfRow?.status).toBe(EventInviteStatus.JOINED);
    expect(otherRow?.status).toBe(EventInviteStatus.ADMIN_INVITED);
  });

  it('resurrects a self-invite from ADMIN_REJECTED straight to ACCEPTED', async () => {
    const event = await createEvent(db, { organizationUnitId });
    const selfUserId = getAuthMockUserId();
    await db.insert(schema.eventInvites).values({
      eventId: event.id,
      userId: selfUserId,
      status: EventInviteStatus.ADMIN_REJECTED,
    });

    await graphqlRequestRequiringData<{
      inviteMembersToEvent: { id: string };
    }>(
      app,
      {
        query: `
          mutation InviteMembers($eventId: ID!, $memberIds: [String!]!) {
            inviteMembersToEvent(eventId: $eventId, memberIds: $memberIds) {
              id
            }
          }
        `,
        variables: {
          eventId: event.id,
          memberIds: [selfUserId],
        },
        headers: { 'x-organization-unit-id': organizationUnitId },
      },
      'inviteMembersToEvent',
    );

    const row = await db.query.eventInvites.findFirst({
      where: { eventId: event.id, userId: selfUserId },
    });
    expect(row?.status).toBe(EventInviteStatus.JOINED);
  });

  it('lists ADMIN_REJECTED invites for admin re-invite', async () => {
    const event = await createEvent(db, { organizationUnitId });
    const volunteer = await createUser(db);
    await db.insert(schema.eventInvites).values({
      eventId: event.id,
      userId: volunteer.id,
      status: EventInviteStatus.ADMIN_REJECTED,
    });

    const data = await graphqlRequestRequiringData<{
      eventInvites: Array<{ id: string; status: string; userId: string }>;
    }>(
      app,
      {
        query: `
          query EventInvites($eventId: ID!) {
            eventInvites(eventId: $eventId) {
              id
              status
              userId
            }
          }
        `,
        variables: { eventId: event.id },
        headers: { 'x-organization-unit-id': organizationUnitId },
      },
      'eventInvites',
    );

    expect(data.eventInvites).toHaveLength(1);
    expect(data.eventInvites[0]?.status).toBe(EventInviteStatus.ADMIN_REJECTED);
    expect(data.eventInvites[0]?.userId).toBe(volunteer.id);
  });

  it('does not cascade to shifts of a different event', async () => {
    const event = await createEvent(db, { organizationUnitId });
    const otherEvent = await createEvent(db, { organizationUnitId });
    const { id: otherShiftId } = await createShift(db, {
      organizationUnitId,
      eventId: otherEvent.id,
    });
    const instances = await db.query.shiftInstances.findMany({
      where: { masterId: otherShiftId },
    });
    const otherInstanceId = instances[0]?.id;
    expect(otherInstanceId).toBeDefined();
    if (!otherInstanceId) {
      throw new Error('Expected shift instance');
    }

    const volunteer = await createUser(db);
    await db.insert(schema.eventInvites).values({
      eventId: event.id,
      userId: volunteer.id,
      status: EventInviteStatus.ADMIN_INVITED,
    });
    await db.insert(schema.shiftInstanceInvites).values({
      instanceId: otherInstanceId,
      userId: volunteer.id,
      status: ShiftInviteStatus.JOINED,
    });

    await graphqlRequestRequiringData(
      app,
      {
        query: updateInviteMutation,
        variables: {
          eventId: event.id,
          userId: volunteer.id,
          status: EventInviteStatus.ADMIN_REJECTED,
        },
        headers: { 'x-organization-unit-id': organizationUnitId },
      },
      'updateEventInviteStatus',
    );

    const otherInstanceInvite = await db.query.shiftInstanceInvites.findFirst({
      where: { instanceId: otherInstanceId, userId: volunteer.id },
    });
    expect(otherInstanceInvite?.status).toBe(ShiftInviteStatus.JOINED);
  });

  it('forbids volunteer from self-setting ADMIN_REJECTED', async () => {
    const originalUserId = getAuthMockUserId();
    const event = await createEvent(db, { organizationUnitId });
    const volunteer = await createUser(db);
    await db.insert(schema.eventInvites).values({
      eventId: event.id,
      userId: volunteer.id,
      status: EventInviteStatus.JOINED,
    });

    setAuthMockUserId(volunteer.id);
    try {
      const response = await graphqlRequest<{
        updateEventInviteStatus: { status: string };
      }>(app, {
        query: updateInviteMutation,
        variables: {
          eventId: event.id,
          userId: volunteer.id,
          status: EventInviteStatus.ADMIN_REJECTED,
        },
        headers: { 'x-organization-unit-id': organizationUnitId },
      });

      expect(response.errors?.[0]?.message).toMatch(/permission|Forbidden/i);

      const row = await db.query.eventInvites.findFirst({
        where: { eventId: event.id, userId: volunteer.id },
      });
      expect(row?.status).toBe(EventInviteStatus.JOINED);
    } finally {
      setAuthMockUserId(originalUserId);
    }
  });

  it('forbids member without SHIFT_EDIT from uninviting another user', async () => {
    const event = await createEvent(db, { organizationUnitId });
    const volunteer = await createUser(db);
    await db.insert(schema.eventInvites).values({
      eventId: event.id,
      userId: volunteer.id,
      status: EventInviteStatus.JOINED,
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
        updateEventInviteStatus: { status: string };
      }>(app, {
        query: updateInviteMutation,
        variables: {
          eventId: event.id,
          userId: volunteer.id,
          status: EventInviteStatus.ADMIN_REJECTED,
        },
        headers: { 'x-organization-unit-id': organizationUnitId },
      });

      expect(response.errors?.[0]?.message).toMatch(/permission|Forbidden/i);

      const row = await db.query.eventInvites.findFirst({
        where: { eventId: event.id, userId: volunteer.id },
      });
      expect(row?.status).toBe(EventInviteStatus.JOINED);
    } finally {
      setAuthMockUserId(originalUserId);
    }
  });

  it('joinEvent returns REJECTED when invite is ADMIN_REJECTED', async () => {
    const originalUserId = getAuthMockUserId();
    const event = await createEvent(db, { organizationUnitId });
    const volunteer = await createUser(db);
    await addMembership(db, volunteer.id, organizationUnitId);
    await db.insert(schema.eventInvites).values({
      eventId: event.id,
      userId: volunteer.id,
      status: EventInviteStatus.ADMIN_REJECTED,
    });

    setAuthMockUserId(volunteer.id);
    try {
      const data = await graphqlRequestRequiringData<{
        joinEvent: { status: JoinStatus };
      }>(
        app,
        {
          query: `
            mutation JoinEvent($eventId: ID!) {
              joinEvent(eventId: $eventId) {
                status
              }
            }
          `,
          variables: { eventId: event.id },
        },
        'joinEvent',
      );

      expect(data.joinEvent.status).toBe(JoinStatus.REJECTED);
    } finally {
      setAuthMockUserId(originalUserId);
    }
  });
});

describe('EventService.joinEvent — existing invite statuses', () => {
  let app: INestApplication;
  let db: Database;
  let organizationUnitId: string;
  let eventService: EventService;

  beforeAll(async () => {
    const context = await getGraphqlTestContext();
    app = context.app;
    db = context.db;
    organizationUnitId = context.organizationUnitId;
    eventService = app.get(EventService);
  });

  async function seedJoinScenario(
    initialStatus: EventInviteStatus,
    joinRequiresApproval = false,
  ) {
    const user = await createUser(db);
    await addMembership(db, user.id, organizationUnitId);
    const event = await createEvent(db, { organizationUnitId });
    if (joinRequiresApproval) {
      await db
        .update(schema.events)
        .set({ joinRequiresApproval: true })
        .where(eq(schema.events.id, event.id));
    }
    await db.insert(schema.eventInvites).values({
      eventId: event.id,
      userId: user.id,
      status: initialStatus,
    });
    return { user, event };
  }

  async function getInviteStatus(
    eventId: string,
    userId: string,
  ): Promise<EventInviteStatus | undefined> {
    const invite = await db.query.eventInvites.findFirst({
      where: { eventId, userId },
    });
    return invite?.status;
  }

  function registerJoinEventStatusCases(
    cases: ReadonlyArray<readonly [EventInviteStatus, EventInviteStatus]>,
    joinRequiresApproval: boolean,
  ) {
    for (const [initialStatus, expectedStatus] of cases) {
      it(`from ${initialStatus} resolves to ${expectedStatus} after joinEvent`, async () => {
        const { user, event } = await seedJoinScenario(
          initialStatus,
          joinRequiresApproval,
        );

        await eventService.joinEvent(user.id, event.id, {
          formsAlreadySatisfied: true,
        });

        expect(await getInviteStatus(event.id, user.id)).toBe(expectedStatus);
      });
    }
  }

  describe('when joinRequiresApproval is false', () => {
    registerJoinEventStatusCases(
      [
        [EventInviteStatus.ADMIN_INVITED, EventInviteStatus.JOINED],
        [EventInviteStatus.VOLUNTEER_REJECTED, EventInviteStatus.JOINED],
        [EventInviteStatus.VOLUNTEER_CANCELLED, EventInviteStatus.JOINED],
        [EventInviteStatus.JOINED, EventInviteStatus.JOINED],
        [
          EventInviteStatus.AWAITING_ADMIN_APPROVAL,
          EventInviteStatus.AWAITING_ADMIN_APPROVAL,
        ],
        [EventInviteStatus.WAITLIST_JOINED, EventInviteStatus.WAITLIST_JOINED],
        [EventInviteStatus.ADMIN_REJECTED, EventInviteStatus.ADMIN_REJECTED],
      ],
      false,
    );
  });

  describe('when joinRequiresApproval is true', () => {
    registerJoinEventStatusCases(
      [
        [
          EventInviteStatus.ADMIN_INVITED,
          EventInviteStatus.AWAITING_ADMIN_APPROVAL,
        ],
        [
          EventInviteStatus.VOLUNTEER_REJECTED,
          EventInviteStatus.AWAITING_ADMIN_APPROVAL,
        ],
        [EventInviteStatus.VOLUNTEER_CANCELLED, EventInviteStatus.JOINED],
        [EventInviteStatus.JOINED, EventInviteStatus.JOINED],
        [
          EventInviteStatus.AWAITING_ADMIN_APPROVAL,
          EventInviteStatus.AWAITING_ADMIN_APPROVAL,
        ],
        [EventInviteStatus.WAITLIST_JOINED, EventInviteStatus.WAITLIST_JOINED],
        [EventInviteStatus.ADMIN_REJECTED, EventInviteStatus.ADMIN_REJECTED],
      ],
      true,
    );
  });
});

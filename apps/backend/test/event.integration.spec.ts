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
import { ShiftInviteStatus, ShiftVisibility } from '../src/shift/enums';
import {
  createEvent,
  createShift,
  createShiftInstance,
  createUser,
} from './factories';
import { addMembership } from './factories/org.factory';
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
  let organizationUnitId: string;

  beforeAll(async () => {
    const context = await getGraphqlTestContext();
    app = context.app;
    db = context.db;
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
      actualStartsAt: new Date('3026-08-01T08:00:00.000Z'),
      actualEndsAt: new Date('3026-08-01T10:00:00.000Z'),
      occurrenceIndex: 1,
    });

    const user = await createUser(db);
    await db.insert(schema.shiftInstanceInvites).values({
      instanceId: instance.id,
      userId: user.id,
      status: ShiftInviteStatus.ACCEPTED,
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
    const event = await createEvent(db, {
      organizationUnitId,
      title: 'Slug Lookup Event',
      slug: 'slug-lookup-event',
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
});

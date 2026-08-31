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
import { PERMISSIONS } from '../src/auth/constants';
import type { Database } from '../src/database/database.module';
import * as schema from '../src/database/schema';
import { TimeTrackingService } from '../src/time-tracking/time-tracking.service';
import { createUser } from './factories';
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
import { applyBunAuthMocks, setAuthMockUserId } from './helpers/auth-mocks';
import { graphqlRequestRequiringData } from './helpers/graphql-request';
import { getGraphqlTestContext } from './helpers/graphql-test-context';

applyBunAuthMocks(mock.module);
setDefaultTimeout(20_000);

describe('TimeTrackingService.getCheckInContext', () => {
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

  const insertOpenEntry = async (volunteerId: string, unitId: string) => {
    const [entry] = await db
      .insert(schema.timeEntries)
      .values({
        volunteerId,
        organizationUnitId: unitId,
        startedAt: new Date(),
        endedAt: null,
      })
      .returning();
    return entry;
  };

  it('returns null for an unknown check-in id', async () => {
    const result = await service.getCheckInContext(testUserId, 'doesnotexist');
    expect(result).toBeNull();
  });

  it('returns open entries only from units where the caller has check-in:manage and the volunteer is a member', async () => {
    const volunteer = await createUser(db);
    // Member of the context org unit (caller manages it via owner role).
    await addMembership(db, volunteer.id, organizationUnitId);
    const visibleEntry = await insertOpenEntry(
      volunteer.id,
      organizationUnitId,
    );

    // Foreign org: the caller has no membership there at all.
    const foreign = await createOrganizationWithType(
      db,
      `Foreign ${crypto.randomUUID()}`,
    );
    const foreignUnit = await createUnit(db, {
      organizationId: foreign.organization.id,
      typeId: foreign.type.id,
      name: 'Foreign Unit',
    });
    await addMembership(db, volunteer.id, foreignUnit.id);
    await insertOpenEntry(volunteer.id, foreignUnit.id);

    const result = await service.getCheckInContext(
      testUserId,
      volunteer.checkInId,
    );

    expect(result?.volunteer.id).toBe(volunteer.id);
    expect(result?.openTimeEntries.map((e) => e.id)).toEqual([visibleEntry.id]);
    expect(result?.eligibleOrganizationUnits.map((u) => u.id)).toEqual([
      organizationUnitId,
    ]);
  });

  it('excludes units where the caller has check-in:manage but the volunteer is not a member', async () => {
    // Second org where the CALLER has check-in:manage but the volunteer is
    // NOT a member.
    const other = await createOrganizationWithType(
      db,
      `Other ${crypto.randomUUID()}`,
    );
    const otherUnit = await createUnit(db, {
      organizationId: other.organization.id,
      typeId: other.type.id,
      name: 'Other Unit',
    });
    const permission = await db.query.permissions.findFirst({
      where: { key: PERMISSIONS.CHECK_IN_MANAGE },
    });
    if (!permission) {
      throw new Error('CHECK_IN_MANAGE permission not seeded');
    }
    const role = await createRole(db, {
      organizationId: other.organization.id,
    });
    await grantPermissionToRole(db, {
      roleId: role.id,
      permissionId: permission.id,
    });
    const callerMembership = await addMembership(db, testUserId, otherUnit.id);
    await assignRoleToMembership(db, {
      membershipId: callerMembership.id,
      roleId: role.id,
    });

    // Volunteer has an open entry there but no membership.
    const volunteer = await createUser(db);
    await insertOpenEntry(volunteer.id, otherUnit.id);

    const result = await service.getCheckInContext(
      testUserId,
      volunteer.checkInId,
    );

    expect(result?.openTimeEntries).toEqual([]);
    expect(result?.eligibleOrganizationUnits).toEqual([]);
  });

  it('returns empty lists for a caller without any check-in:manage permission', async () => {
    const volunteer = await createUser(db);
    await addMembership(db, volunteer.id, organizationUnitId);
    await insertOpenEntry(volunteer.id, organizationUnitId);

    const outsider = await createUser(db); // no memberships anywhere

    const result = await service.getCheckInContext(
      outsider.id,
      volunteer.checkInId,
    );

    expect(result?.volunteer.id).toBe(volunteer.id);
    expect(result?.eligibleOrganizationUnits).toEqual([]);
    expect(result?.openTimeEntries).toEqual([]);
  });
});

describe('checkInContext query', () => {
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

  afterEach(() => {
    setAuthMockUserId(testUserId);
  });

  it('returns volunteer, eligible units and open entries', async () => {
    const volunteer = await createUser(db);
    await addMembership(db, volunteer.id, organizationUnitId);
    await db.insert(schema.timeEntries).values({
      volunteerId: volunteer.id,
      organizationUnitId,
      startedAt: new Date(),
      endedAt: null,
    });

    const data = await graphqlRequestRequiringData<{
      checkInContext: {
        volunteer: { id: string; name: string };
        eligibleOrganizationUnits: Array<{ id: string; name: string }>;
        openTimeEntries: Array<{
          id: string;
          startedAt: string;
          organizationUnit: { id: string; name: string };
        }>;
      };
    }>(
      app,
      {
        query: `
          query CheckInContext($checkInId: String!) {
            checkInContext(checkInId: $checkInId) {
              volunteer { id name }
              eligibleOrganizationUnits { id name }
              openTimeEntries {
                id
                startedAt
                organizationUnit { id name }
              }
            }
          }
        `,
        variables: { checkInId: volunteer.checkInId },
      },
      'checkInContext',
    );

    expect(data.checkInContext.volunteer.id).toBe(volunteer.id);
    expect(
      data.checkInContext.eligibleOrganizationUnits.map((u) => u.id),
    ).toContain(organizationUnitId);
    expect(data.checkInContext.openTimeEntries).toHaveLength(1);
    expect(data.checkInContext.openTimeEntries[0]?.organizationUnit.id).toBe(
      organizationUnitId,
    );
  });

  it('returns null for an unknown check-in id', async () => {
    const data = await graphqlRequestRequiringData<{
      checkInContext: null;
    }>(
      app,
      {
        query: `
          query CheckInContext($checkInId: String!) {
            checkInContext(checkInId: $checkInId) {
              volunteer { id }
            }
          }
        `,
        variables: { checkInId: 'doesnotexist' },
      },
      'checkInContext',
    );

    expect(data.checkInContext).toBeNull();
  });
});

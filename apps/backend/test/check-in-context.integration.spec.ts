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
import { MembershipService } from '../src/membership/membership.service';
import { TimeTrackingService } from '../src/time-tracking/time-tracking.service';
import { createShift, createUser } from './factories';
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

    // No overlap between the caller's check-in:manage units and the
    // volunteer's memberships: null, not empty lists.
    expect(result).toBeNull();
  });

  it('returns null for a caller without any check-in:manage permission', async () => {
    const volunteer = await createUser(db);
    await addMembership(db, volunteer.id, organizationUnitId);
    await insertOpenEntry(volunteer.id, organizationUnitId);

    const outsider = await createUser(db); // no memberships anywhere

    const result = await service.getCheckInContext(
      outsider.id,
      volunteer.checkInId,
    );

    expect(result).toBeNull();
  });

  it('checks eligibility across multiple manageable units, ancestor-inclusive', async () => {
    const org = await createOrganizationWithType(
      db,
      `Batch ${crypto.randomUUID()}`,
    );
    const parentUnit = await createUnit(db, {
      organizationId: org.organization.id,
      typeId: org.type.id,
      name: 'Parent Unit',
    });
    const childUnit = await createUnit(db, {
      organizationId: org.organization.id,
      typeId: org.type.id,
      name: 'Child Unit',
      parentId: parentUnit.id,
    });
    // Volunteer is a member of the PARENT only — eligibility on the child
    // comes from the ancestor walk.
    const volunteer = await createUser(db);
    await addMembership(db, volunteer.id, parentUnit.id);

    // Caller needs check-in:manage on the Batch org to manage its units.
    const batchPermission = await db.query.permissions.findFirst({
      where: { key: PERMISSIONS.CHECK_IN_MANAGE },
    });
    if (!batchPermission) {
      throw new Error('CHECK_IN_MANAGE permission not seeded');
    }
    const batchRole = await createRole(db, {
      organizationId: org.organization.id,
    });
    await grantPermissionToRole(db, {
      roleId: batchRole.id,
      permissionId: batchPermission.id,
    });
    const batchMembership = await addMembership(db, testUserId, parentUnit.id);
    await assignRoleToMembership(db, {
      membershipId: batchMembership.id,
      roleId: batchRole.id,
    });

    // A second org (only one root per org is allowed, so the "stranger"
    // unit lives here): caller manages it, volunteer is not a member.
    const otherOrg = await createOrganizationWithType(
      db,
      `BatchOther ${crypto.randomUUID()}`,
    );
    const strangerUnit = await createUnit(db, {
      organizationId: otherOrg.organization.id,
      typeId: otherOrg.type.id,
      name: 'Stranger Unit',
    });
    const permission = await db.query.permissions.findFirst({
      where: { key: PERMISSIONS.CHECK_IN_MANAGE },
    });
    if (!permission) {
      throw new Error('CHECK_IN_MANAGE permission not seeded');
    }
    const strangerRole = await createRole(db, {
      organizationId: otherOrg.organization.id,
    });
    await grantPermissionToRole(db, {
      roleId: strangerRole.id,
      permissionId: permission.id,
    });
    const strangerMembership = await addMembership(
      db,
      testUserId,
      strangerUnit.id,
    );
    await assignRoleToMembership(db, {
      membershipId: strangerMembership.id,
      roleId: strangerRole.id,
    });

    const result = await service.getCheckInContext(
      testUserId,
      volunteer.checkInId,
    );

    const eligibleIds = result?.eligibleOrganizationUnits.map((u) => u.id);
    expect(eligibleIds).toContain(childUnit.id);
    expect(eligibleIds).not.toContain(strangerUnit.id);
  });

  it('filterUnitsWhereMemberOrAncestor returns only member-or-descendant units', async () => {
    const membershipService = app.get(MembershipService);
    const org = await createOrganizationWithType(
      db,
      `Filter ${crypto.randomUUID()}`,
    );
    const parentUnit = await createUnit(db, {
      organizationId: org.organization.id,
      typeId: org.type.id,
      name: 'Filter Parent',
    });
    const childUnit = await createUnit(db, {
      organizationId: org.organization.id,
      typeId: org.type.id,
      name: 'Filter Child',
      parentId: parentUnit.id,
    });
    // Second org: only one root per org is allowed, and a sibling under
    // parentUnit would be eligible via the ancestor walk — so the
    // ineligible unit lives in its own org.
    const otherOrg = await createOrganizationWithType(
      db,
      `FilterOther ${crypto.randomUUID()}`,
    );
    const otherUnit = await createUnit(db, {
      organizationId: otherOrg.organization.id,
      typeId: otherOrg.type.id,
      name: 'Filter Other',
    });

    const user = await createUser(db);
    await addMembership(db, user.id, parentUnit.id);

    const result = await membershipService.filterUnitsWhereMemberOrAncestor(
      user.id,
      [parentUnit.id, childUnit.id, otherUnit.id, 'does-not-exist'],
    );

    expect([...result].sort()).toEqual([childUnit.id, parentUnit.id].sort());
    expect(
      await membershipService.filterUnitsWhereMemberOrAncestor(user.id, []),
    ).toEqual(new Set());
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

  it('resolves shiftInstance details without an org unit header', async () => {
    const volunteer = await createUser(db);
    await addMembership(db, volunteer.id, organizationUnitId);

    const shift = await createShift(db, { organizationUnitId });
    const instance = await db.query.shiftInstances.findFirst({
      where: { masterId: shift.id },
    });
    expect(instance).toBeDefined();

    await db.insert(schema.timeEntries).values({
      volunteerId: volunteer.id,
      organizationUnitId,
      shiftInstanceId: instance?.id,
      startedAt: new Date(),
      endedAt: null,
    });

    const data = await graphqlRequestRequiringData<{
      checkInContext: {
        openTimeEntries: Array<{
          id: string;
          shiftInstance: {
            id: string;
            overrideTitle: string | null;
            master: { id: string; title: string };
          } | null;
        }>;
      };
    }>(
      app,
      {
        query: `
          query CheckInContext($checkInId: String!) {
            checkInContext(checkInId: $checkInId) {
              openTimeEntries {
                id
                shiftInstance {
                  id
                  overrideTitle
                  master { id title }
                }
              }
            }
          }
        `,
        variables: { checkInId: volunteer.checkInId },
      },
      'checkInContext',
    );

    expect(data.checkInContext.openTimeEntries).toHaveLength(1);
    expect(data.checkInContext.openTimeEntries[0]?.shiftInstance?.id).toBe(
      instance?.id,
    );
    expect(
      data.checkInContext.openTimeEntries[0]?.shiftInstance?.master.title,
    ).toBeTruthy();
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

  it('returns null for a caller with no check-in:manage overlap', async () => {
    const volunteer = await createUser(db);
    await addMembership(db, volunteer.id, organizationUnitId);

    const outsider = await createUser(db); // no memberships anywhere
    setAuthMockUserId(outsider.id);

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
        variables: { checkInId: volunteer.checkInId },
      },
      'checkInContext',
    );

    expect(data.checkInContext).toBeNull();
  });
});

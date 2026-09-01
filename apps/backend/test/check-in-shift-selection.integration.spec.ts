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
import { PERMISSIONS_KEY } from '../src/auth/decorators/permissions.decorator';
import type { Database } from '../src/database/database.module';
import { ShiftQueryResolver } from '../src/shift/resolvers/shift-query.resolver';
import { createShift } from './factories';
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

const CHECK_IN_SHIFT_INSTANCES = `
  query CheckInShiftInstances($startsAfter: DateTime!, $endsBefore: DateTime!) {
    checkInShiftInstances(startsAfter: $startsAfter, endsBefore: $endsBefore) {
      id
      actualStartsAt
      master { id title }
    }
  }
`;

describe('checkInShiftInstances query', () => {
  let app: INestApplication;
  let db: Database;
  let testUserId: string;
  /** A unit where the caller holds check-in:manage and nothing else. */
  let checkInOnlyUnitId: string;

  beforeAll(async () => {
    const context = await getGraphqlTestContext();
    app = context.app;
    db = context.db;
    testUserId = context.testUserId;

    const org = await createOrganizationWithType(
      db,
      `CheckInOnly ${crypto.randomUUID()}`,
    );
    const unit = await createUnit(db, {
      organizationId: org.organization.id,
      typeId: org.type.id,
      name: 'Check-in only unit',
    });
    checkInOnlyUnitId = unit.id;

    const permission = await db.query.permissions.findFirst({
      where: { key: PERMISSIONS.CHECK_IN_MANAGE },
    });
    if (!permission) throw new Error('CHECK_IN_MANAGE permission not seeded');

    const role = await createRole(db, {
      organizationId: org.organization.id,
    });
    await grantPermissionToRole(db, {
      roleId: role.id,
      permissionId: permission.id,
    });
    const membership = await addMembership(db, testUserId, unit.id);
    await assignRoleToMembership(db, {
      membershipId: membership.id,
      roleId: role.id,
    });
  });

  afterEach(() => {
    setAuthMockUserId(testUserId);
  });

  it('returns instances for a caller holding only check-in:manage', async () => {
    const startsAt = new Date(Date.now() + 60 * 60 * 1000);
    const endsAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const shift = await createShift(db, {
      organizationUnitId: checkInOnlyUnitId,
      title: `Soup kitchen ${crypto.randomUUID()}`,
      startsAt,
      endsAt,
    });

    const data = await graphqlRequestRequiringData<{
      checkInShiftInstances: Array<{ master: { id: string; title: string } }>;
    }>(
      app,
      {
        query: CHECK_IN_SHIFT_INSTANCES,
        variables: {
          startsAfter: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          endsBefore: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        headers: { 'x-organization-unit-id': checkInOnlyUnitId },
      },
      'checkInShiftInstances',
    );

    expect(data.checkInShiftInstances.map((i) => i.master.id)).toContain(
      shift.id,
    );
  });

  it('does not return instances from another org unit', async () => {
    const other = await createOrganizationWithType(
      db,
      `Other ${crypto.randomUUID()}`,
    );
    const otherUnit = await createUnit(db, {
      organizationId: other.organization.id,
      typeId: other.type.id,
      name: 'Other unit',
    });
    const foreignShift = await createShift(db, {
      organizationUnitId: otherUnit.id,
      startsAt: new Date(Date.now() + 60 * 60 * 1000),
      endsAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
    });

    const data = await graphqlRequestRequiringData<{
      checkInShiftInstances: Array<{ master: { id: string } }>;
    }>(
      app,
      {
        query: CHECK_IN_SHIFT_INSTANCES,
        variables: {
          startsAfter: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          endsBefore: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        headers: { 'x-organization-unit-id': checkInOnlyUnitId },
      },
      'checkInShiftInstances',
    );

    expect(data.checkInShiftInstances.map((i) => i.master.id)).not.toContain(
      foreignShift.id,
    );
  });
});

/**
 * The integration harness stubs `PermissionGuard.prototype.canActivate` to
 * always-true (`test/helpers/create-graphql-full-app.ts:20`), so a rejection
 * cannot be provoked through a GraphQL request. Assert the decorator instead:
 * this fails if anyone drops or weakens the guard on these queries.
 */
describe('check-in query permissions', () => {
  it('gates checkInShiftInstances on check-in:manage', () => {
    expect(
      Reflect.getMetadata(
        PERMISSIONS_KEY,
        ShiftQueryResolver.prototype.checkInShiftInstances,
      ),
    ).toEqual([PERMISSIONS.CHECK_IN_MANAGE]);
  });
});

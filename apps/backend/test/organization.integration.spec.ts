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
import { eq } from 'drizzle-orm';
import { PERMISSIONS } from '../src/auth/constants';
import type { Database } from '../src/database/database.module';
import * as schema from '../src/database/schema';
import { OrganizationService } from '../src/organization/organization.service';
import { createUser } from './factories';
import { addMembership } from './factories/org.factory';
import {
  assignRoleToMembership,
  createRole,
  grantPermissionToRole,
} from './factories/role.factory';
import { applyBunAuthMocks, setAuthMockUserId } from './helpers/auth-mocks';
import { getGraphqlTestContext } from './helpers/graphql-test-context';

applyBunAuthMocks(mock.module);
setDefaultTimeout(20_000);

describe('OrganizationService.findUnitsWithPermission', () => {
  let app: INestApplication;
  let db: Database;
  let organizationId: string;
  let organizationUnitId: string;
  let testUserId: string;
  let service: OrganizationService;

  beforeAll(async () => {
    const context = await getGraphqlTestContext();
    app = context.app;
    db = context.db;
    organizationId = context.organizationId;
    organizationUnitId = context.organizationUnitId;
    testUserId = context.testUserId;
    service = app.get(OrganizationService);
  });

  // Restore the shared context user so the mock user never leaks into other
  // spec files running in the same process.
  afterEach(() => {
    setAuthMockUserId(testUserId);
  });

  const findCheckInPermissionId = async (): Promise<string> => {
    const [permission] = await db
      .select({ id: schema.permissions.id })
      .from(schema.permissions)
      .where(eq(schema.permissions.key, PERMISSIONS.CHECK_IN_MANAGE));
    if (!permission) {
      throw new Error('check-in:manage permission not seeded in test DB');
    }
    return permission.id;
  };

  it('returns the unit for a user whose role grants check-in:manage', async () => {
    const user = await createUser(db);
    setAuthMockUserId(user.id);

    const membership = await addMembership(db, user.id, organizationUnitId);
    const role = await createRole(db, {
      organizationId,
      name: `check-in-manager-${crypto.randomUUID()}`,
    });
    await grantPermissionToRole(db, {
      roleId: role.id,
      permissionId: await findCheckInPermissionId(),
    });
    await assignRoleToMembership(db, {
      membershipId: membership.id,
      roleId: role.id,
    });

    const units = await service.findUnitsWithPermission(
      user.id,
      PERMISSIONS.CHECK_IN_MANAGE,
    );

    expect(units.map((unit) => unit.id)).toContain(organizationUnitId);
  });

  it('does not return the unit for a user whose role lacks check-in:manage', async () => {
    const user = await createUser(db);
    setAuthMockUserId(user.id);

    const membership = await addMembership(db, user.id, organizationUnitId);
    const role = await createRole(db, {
      organizationId,
      name: `member-${crypto.randomUUID()}`,
    });
    await assignRoleToMembership(db, {
      membershipId: membership.id,
      roleId: role.id,
    });

    const units = await service.findUnitsWithPermission(
      user.id,
      PERMISSIONS.CHECK_IN_MANAGE,
    );

    expect(units.map((unit) => unit.id)).not.toContain(organizationUnitId);
  });
});

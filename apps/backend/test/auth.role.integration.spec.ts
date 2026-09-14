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
import { AuthService } from '../src/auth/auth.service';
import type { Database } from '../src/database/database.module';
import { ConflictGraphQLError } from '../src/graphql/errors';
import { createRole } from './factories/role.factory';
import { applyBunAuthMocks, setAuthMockUserId } from './helpers/auth-mocks';
import { getGraphqlTestContext } from './helpers/graphql-test-context';

applyBunAuthMocks(mock.module);
setDefaultTimeout(20_000);

describe('AuthService role mutations', () => {
  let app: INestApplication;
  let db: Database;
  let organizationId: string;
  let organizationUnitId: string;
  let testUserId: string;
  let service: AuthService;

  beforeAll(async () => {
    const context = await getGraphqlTestContext();
    app = context.app;
    db = context.db;
    organizationId = context.organizationId;
    organizationUnitId = context.organizationUnitId;
    testUserId = context.testUserId;
    service = app.get(AuthService);
  });

  afterEach(() => {
    setAuthMockUserId(testUserId);
  });

  it('throws ConflictGraphQLError when creating a role with a duplicate name', async () => {
    const roleName = `Ehrenamtskoordination-${crypto.randomUUID()}`;

    await createRole(db, { organizationId, name: roleName });

    await expect(
      service.createRole(
        organizationUnitId,
        {
          name: roleName,
          description: 'Fr N2',
          permissionIds: [],
        },
        testUserId,
      ),
    ).rejects.toThrow(ConflictGraphQLError);
  });

  it('throws ConflictGraphQLError when renaming a role to an existing name', async () => {
    const existingName = `existing-role-${crypto.randomUUID()}`;
    const otherName = `other-role-${crypto.randomUUID()}`;

    await createRole(db, { organizationId, name: existingName });
    const roleToRename = await createRole(db, {
      organizationId,
      name: otherName,
    });

    await expect(
      service.updateRole(
        roleToRename.id,
        {
          name: existingName,
          permissionIds: [],
        },
        testUserId,
      ),
    ).rejects.toThrow(ConflictGraphQLError);
  });
});

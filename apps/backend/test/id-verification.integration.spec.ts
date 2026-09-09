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
import { MembershipMutationResolver } from '../src/membership/resolvers/membership-mutation.resolver';
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
import {
  graphqlRequest,
  graphqlRequestRequiringData,
} from './helpers/graphql-request';
import { getGraphqlTestContext } from './helpers/graphql-test-context';

applyBunAuthMocks(mock.module);
setDefaultTimeout(20_000);

const SET_ID_VERIFIED = `
  mutation SetMembershipIdVerified($membershipId: ID!, $verified: Boolean!) {
    setMembershipIdVerified(membershipId: $membershipId, verified: $verified) {
      id
      idVerifiedAt
    }
  }
`;

// NOTE: mutation documents must NOT select `idVerifiedBy` — the service
// returns the bare updated row, and there is no Membership field resolver
// for it (relations are only loaded by the `memberships` query). The
// verifier identity is asserted directly against the database instead.

const CHECK_IN_SET_ID_VERIFIED = `
  mutation CheckInSetMembershipIdVerified($membershipId: ID!, $verified: Boolean!) {
    checkInSetMembershipIdVerified(membershipId: $membershipId, verified: $verified) {
      id
      idVerifiedAt
    }
  }
`;

async function grantCallerPermission(
  db: Database,
  callerUserId: string,
  unitId: string,
  organizationId: string,
  permissionKey: string,
) {
  const permission = await db.query.permissions.findFirst({
    where: { key: permissionKey },
  });
  if (!permission) throw new Error(`${permissionKey} permission not seeded`);
  const role = await createRole(db, { organizationId });
  await grantPermissionToRole(db, {
    roleId: role.id,
    permissionId: permission.id,
  });
  const membership = await addMembership(db, callerUserId, unitId);
  await assignRoleToMembership(db, {
    membershipId: membership.id,
    roleId: role.id,
  });
}

describe('id verification mutations', () => {
  let app: INestApplication;
  let db: Database;
  let callerUserId: string;
  let unitId: string;

  beforeAll(async () => {
    const context = await getGraphqlTestContext();
    app = context.app;
    db = context.db;
    callerUserId = context.testUserId;

    const org = await createOrganizationWithType(
      db,
      `IdVerification ${crypto.randomUUID()}`,
    );
    const unit = await createUnit(db, {
      organizationId: org.organization.id,
      typeId: org.type.id,
      name: 'ID verification unit',
    });
    unitId = unit.id;

    await grantCallerPermission(
      db,
      callerUserId,
      unit.id,
      org.organization.id,
      PERMISSIONS.VOLUNTEER_EDIT,
    );
  });

  afterEach(() => {
    setAuthMockUserId(callerUserId);
  });

  it('gates setMembershipIdVerified on volunteer:edit', () => {
    expect(
      Reflect.getMetadata(
        PERMISSIONS_KEY,
        MembershipMutationResolver.prototype.setMembershipIdVerified,
      ),
    ).toEqual([PERMISSIONS.VOLUNTEER_EDIT]);
  });

  it('gates checkInSetMembershipIdVerified on check-in:manage', () => {
    expect(
      Reflect.getMetadata(
        PERMISSIONS_KEY,
        MembershipMutationResolver.prototype.checkInSetMembershipIdVerified,
      ),
    ).toEqual([PERMISSIONS.CHECK_IN_MANAGE]);
  });

  it('sets and clears the verified state via setMembershipIdVerified', async () => {
    const volunteer = await createUser(db);
    const membership = await addMembership(db, volunteer.id, unitId);

    const verified = await graphqlRequestRequiringData<{
      setMembershipIdVerified: { id: string; idVerifiedAt: string | null };
    }>(
      app,
      {
        query: SET_ID_VERIFIED,
        variables: { membershipId: membership.id, verified: true },
        headers: { 'x-organization-unit-id': unitId },
      },
      'setMembershipIdVerified',
    );

    expect(verified.setMembershipIdVerified.idVerifiedAt).toBeTruthy();

    const stored = await db.query.memberships.findFirst({
      where: { id: membership.id },
    });
    expect(stored?.idVerifiedAt).toBeTruthy();
    expect(stored?.idVerifiedById).toBe(callerUserId);

    const cleared = await graphqlRequestRequiringData<{
      setMembershipIdVerified: { idVerifiedAt: string | null };
    }>(
      app,
      {
        query: SET_ID_VERIFIED,
        variables: { membershipId: membership.id, verified: false },
        headers: { 'x-organization-unit-id': unitId },
      },
      'setMembershipIdVerified',
    );

    expect(cleared.setMembershipIdVerified.idVerifiedAt).toBeNull();

    const storedCleared = await db.query.memberships.findFirst({
      where: { id: membership.id },
    });
    expect(storedCleared?.idVerifiedById).toBeNull();
  });

  it('rejects a membership that belongs to a different org unit', async () => {
    const otherOrg = await createOrganizationWithType(
      db,
      `IdVerificationOther ${crypto.randomUUID()}`,
    );
    const otherUnit = await createUnit(db, {
      organizationId: otherOrg.organization.id,
      typeId: otherOrg.type.id,
      name: 'Other ID verification unit',
    });
    const volunteer = await createUser(db);
    const foreignMembership = await addMembership(
      db,
      volunteer.id,
      otherUnit.id,
    );

    const response = await graphqlRequest(app, {
      query: SET_ID_VERIFIED,
      variables: { membershipId: foreignMembership.id, verified: true },
      // Caller's header names their OWN unit, not the foreign one.
      headers: { 'x-organization-unit-id': unitId },
    });

    expect(response.errors?.[0]?.message).toBe(
      'Membership does not belong to the current organization unit.',
    );
  });

  it('verifies via checkInSetMembershipIdVerified for a caller holding only check-in:manage', async () => {
    const org = await createOrganizationWithType(
      db,
      `IdVerificationCheckIn ${crypto.randomUUID()}`,
    );
    const unit = await createUnit(db, {
      organizationId: org.organization.id,
      typeId: org.type.id,
      name: 'Check-in ID verification unit',
    });
    await grantCallerPermission(
      db,
      callerUserId,
      unit.id,
      org.organization.id,
      PERMISSIONS.CHECK_IN_MANAGE,
    );

    const volunteer = await createUser(db);
    const membership = await addMembership(db, volunteer.id, unit.id);

    const data = await graphqlRequestRequiringData<{
      checkInSetMembershipIdVerified: { idVerifiedAt: string | null };
    }>(
      app,
      {
        query: CHECK_IN_SET_ID_VERIFIED,
        variables: { membershipId: membership.id, verified: true },
        headers: { 'x-organization-unit-id': unit.id },
      },
      'checkInSetMembershipIdVerified',
    );

    expect(data.checkInSetMembershipIdVerified.idVerifiedAt).toBeTruthy();
  });
});

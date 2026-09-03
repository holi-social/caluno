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
import { DEFAULT_MEMBER_ROLE_NAME, PERMISSIONS } from '../src/auth/constants';
import { PERMISSIONS_KEY } from '../src/auth/decorators/permissions.decorator';
import type { Database } from '../src/database/database.module';
import * as schema from '../src/database/schema';
import { MembershipLifecycleMutationResolver } from '../src/membership-lifecycle/membership-lifecycle-mutation.resolver';
import { ShiftInviteStatus } from '../src/shift/enums';
import { ShiftMutationResolver } from '../src/shift/resolvers/shift-mutation.resolver';
import { TimeTrackingMutationResolver } from '../src/time-tracking/resolvers/time-tracking-mutation.resolver';
import { TimeTrackingQueryResolver } from '../src/time-tracking/resolvers/time-tracking-query.resolver';
import {
  createFormSubmission,
  createMembershipRequest,
  createRequirementForm,
  createShift,
  createShiftInstance,
  createShiftInstanceInvite,
  createUser,
  setRequiredForms,
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
import { applyBunAuthMocks, setAuthMockUserId } from './helpers/auth-mocks';
import {
  graphqlRequest,
  graphqlRequestRequiringData,
} from './helpers/graphql-request';
import { getGraphqlTestContext } from './helpers/graphql-test-context';

applyBunAuthMocks(mock.module);
setDefaultTimeout(20_000);

const CHECK_IN_READINESS = `
  query CheckInReadiness($volunteerId: ID!, $shiftInstanceId: ID!) {
    checkInReadiness(volunteerId: $volunteerId, shiftInstanceId: $shiftInstanceId) {
      isMember
      openMembershipRequestId
      shiftInviteStatus
      isParticipating
    }
  }
`;

describe('checkInReadiness query', () => {
  let app: INestApplication;
  let db: Database;
  let callerUserId: string;
  let unitId: string;
  let instanceId: string;

  beforeAll(async () => {
    const context = await getGraphqlTestContext();
    app = context.app;
    db = context.db;
    callerUserId = context.testUserId;

    const org = await createOrganizationWithType(
      db,
      `Readiness ${crypto.randomUUID()}`,
    );
    const unit = await createUnit(db, {
      organizationId: org.organization.id,
      typeId: org.type.id,
      name: 'Readiness unit',
    });
    unitId = unit.id;

    const permission = await db.query.permissions.findFirst({
      where: { key: PERMISSIONS.CHECK_IN_MANAGE },
    });
    if (!permission) throw new Error('CHECK_IN_MANAGE permission not seeded');

    const role = await createRole(db, { organizationId: org.organization.id });
    await grantPermissionToRole(db, {
      roleId: role.id,
      permissionId: permission.id,
    });
    const membership = await addMembership(db, callerUserId, unit.id);
    await assignRoleToMembership(db, {
      membershipId: membership.id,
      roleId: role.id,
    });

    const shift = await createShift(db, { organizationUnitId: unit.id });
    const instance = await createShiftInstance(db, shift.id);
    instanceId = instance.id;
  });

  afterEach(() => {
    setAuthMockUserId(callerUserId);
  });

  it('reports not-a-member with no open request for a stranger', async () => {
    const volunteer = await createUser(db);

    const data = await graphqlRequestRequiringData<{
      checkInReadiness: {
        isMember: boolean;
        openMembershipRequestId: string | null;
        shiftInviteStatus: string | null;
        isParticipating: boolean;
      };
    }>(
      app,
      {
        query: CHECK_IN_READINESS,
        variables: { volunteerId: volunteer.id, shiftInstanceId: instanceId },
        headers: { 'x-organization-unit-id': unitId },
      },
      'checkInReadiness',
    );

    expect(data.checkInReadiness).toEqual({
      isMember: false,
      openMembershipRequestId: null,
      shiftInviteStatus: null,
      isParticipating: false,
    });
  });

  it('exposes the pending membership request id', async () => {
    const volunteer = await createUser(db);
    const request = await createMembershipRequest(db, {
      userId: volunteer.id,
      organizationUnitId: unitId,
    });

    const data = await graphqlRequestRequiringData<{
      checkInReadiness: { openMembershipRequestId: string | null };
    }>(
      app,
      {
        query: CHECK_IN_READINESS,
        variables: { volunteerId: volunteer.id, shiftInstanceId: instanceId },
        headers: { 'x-organization-unit-id': unitId },
      },
      'checkInReadiness',
    );

    expect(data.checkInReadiness.openMembershipRequestId).toBe(request.id);
  });

  it('reports participating for a member with an ACCEPTED invite', async () => {
    const volunteer = await createUser(db);
    await addMembership(db, volunteer.id, unitId);
    await createShiftInstanceInvite(db, {
      instanceId,
      userId: volunteer.id,
      status: ShiftInviteStatus.ACCEPTED,
    });

    const data = await graphqlRequestRequiringData<{
      checkInReadiness: {
        isMember: boolean;
        shiftInviteStatus: string | null;
        isParticipating: boolean;
      };
    }>(
      app,
      {
        query: CHECK_IN_READINESS,
        variables: { volunteerId: volunteer.id, shiftInstanceId: instanceId },
        headers: { 'x-organization-unit-id': unitId },
      },
      'checkInReadiness',
    );

    expect(data.checkInReadiness).toEqual({
      isMember: true,
      openMembershipRequestId: null,
      shiftInviteStatus: 'ACCEPTED',
      isParticipating: true,
    });
  });

  it('reports not participating for a member with only an INVITED (not accepted) invite', async () => {
    const volunteer = await createUser(db);
    await addMembership(db, volunteer.id, unitId);
    await createShiftInstanceInvite(db, {
      instanceId,
      userId: volunteer.id,
      status: ShiftInviteStatus.INVITED,
    });

    const data = await graphqlRequestRequiringData<{
      checkInReadiness: {
        isParticipating: boolean;
        shiftInviteStatus: string | null;
      };
    }>(
      app,
      {
        query: CHECK_IN_READINESS,
        variables: { volunteerId: volunteer.id, shiftInstanceId: instanceId },
        headers: { 'x-organization-unit-id': unitId },
      },
      'checkInReadiness',
    );

    expect(data.checkInReadiness.isParticipating).toBe(false);
    expect(data.checkInReadiness.shiftInviteStatus).toBe('INVITED');
  });
});

describe('checkInVolunteerRequiredForms query', () => {
  const CHECK_IN_REQUIRED_FORMS = `
    query CheckInVolunteerRequiredForms($volunteerId: ID!) {
      checkInVolunteerRequiredForms(volunteerId: $volunteerId) {
        form { id name }
        order
        submitted
        submissionId
      }
    }
  `;

  let app: INestApplication;
  let db: Database;
  let callerUserId: string;
  let unitId: string;
  let organizationId: string;

  beforeAll(async () => {
    const context = await getGraphqlTestContext();
    app = context.app;
    db = context.db;
    callerUserId = context.testUserId;

    const org = await createOrganizationWithType(
      db,
      `RequiredForms ${crypto.randomUUID()}`,
    );
    organizationId = org.organization.id;
    const unit = await createUnit(db, {
      organizationId: org.organization.id,
      typeId: org.type.id,
      name: 'Required forms unit',
    });
    unitId = unit.id;

    const permission = await db.query.permissions.findFirst({
      where: { key: PERMISSIONS.CHECK_IN_MANAGE },
    });
    if (!permission) throw new Error('CHECK_IN_MANAGE permission not seeded');

    const role = await createRole(db, { organizationId: org.organization.id });
    await grantPermissionToRole(db, {
      roleId: role.id,
      permissionId: permission.id,
    });
    const membership = await addMembership(db, callerUserId, unit.id);
    await assignRoleToMembership(db, {
      membershipId: membership.id,
      roleId: role.id,
    });
  });

  afterEach(() => {
    setAuthMockUserId(callerUserId);
  });

  it('returns an empty list when the unit has no required forms', async () => {
    const volunteer = await createUser(db);

    const data = await graphqlRequestRequiringData<{
      checkInVolunteerRequiredForms: unknown[];
    }>(
      app,
      {
        query: CHECK_IN_REQUIRED_FORMS,
        variables: { volunteerId: volunteer.id },
        headers: { 'x-organization-unit-id': unitId },
      },
      'checkInVolunteerRequiredForms',
    );

    expect(data.checkInVolunteerRequiredForms).toEqual([]);
  });

  it("pairs a required form with the volunteer's submission status", async () => {
    const volunteer = await createUser(db);
    const { form } = await createRequirementForm(db, {
      organizationId,
      organizationUnitId: unitId,
      createdById: callerUserId,
      name: 'Code of conduct',
      required: true,
    });
    await setRequiredForms(db, {
      organizationUnitId: unitId,
      formIds: [form.id],
    });

    const unsubmitted = await graphqlRequestRequiringData<{
      checkInVolunteerRequiredForms: Array<{
        form: { id: string; name: string };
        order: number;
        submitted: boolean;
        submissionId: string | null;
      }>;
    }>(
      app,
      {
        query: CHECK_IN_REQUIRED_FORMS,
        variables: { volunteerId: volunteer.id },
        headers: { 'x-organization-unit-id': unitId },
      },
      'checkInVolunteerRequiredForms',
    );

    expect(unsubmitted.checkInVolunteerRequiredForms).toEqual([
      {
        form: { id: form.id, name: 'Code of conduct' },
        order: 0,
        submitted: false,
        submissionId: null,
      },
    ]);

    const submission = await createFormSubmission(db, {
      formId: form.id,
      userId: volunteer.id,
    });

    const submitted = await graphqlRequestRequiringData<{
      checkInVolunteerRequiredForms: Array<{
        submitted: boolean;
        submissionId: string | null;
      }>;
    }>(
      app,
      {
        query: CHECK_IN_REQUIRED_FORMS,
        variables: { volunteerId: volunteer.id },
        headers: { 'x-organization-unit-id': unitId },
      },
      'checkInVolunteerRequiredForms',
    );

    expect(submitted.checkInVolunteerRequiredForms[0]?.submitted).toBe(true);
    expect(submitted.checkInVolunteerRequiredForms[0]?.submissionId).toBe(
      submission.id,
    );
  });
});

describe('checkInVolunteer mutation', () => {
  const CHECK_IN_VOLUNTEER = `
    mutation CheckInVolunteer($volunteerId: ID!, $shiftInstanceId: ID) {
      checkInVolunteer(volunteerId: $volunteerId, shiftInstanceId: $shiftInstanceId) {
        id
      }
    }
  `;

  let app: INestApplication;
  let db: Database;
  let callerUserId: string;
  let unitId: string;
  let instanceId: string;

  beforeAll(async () => {
    const context = await getGraphqlTestContext();
    app = context.app;
    db = context.db;
    callerUserId = context.testUserId;

    const org = await createOrganizationWithType(
      db,
      `Submit ${crypto.randomUUID()}`,
    );
    const unit = await createUnit(db, {
      organizationId: org.organization.id,
      typeId: org.type.id,
      name: 'Submit unit',
    });
    unitId = unit.id;

    const permission = await db.query.permissions.findFirst({
      where: { key: PERMISSIONS.CHECK_IN_MANAGE },
    });
    if (!permission) throw new Error('CHECK_IN_MANAGE permission not seeded');

    const role = await createRole(db, { organizationId: org.organization.id });
    await grantPermissionToRole(db, {
      roleId: role.id,
      permissionId: permission.id,
    });
    const membership = await addMembership(db, callerUserId, unit.id);
    await assignRoleToMembership(db, {
      membershipId: membership.id,
      roleId: role.id,
    });

    const shift = await createShift(db, { organizationUnitId: unit.id });
    const instance = await createShiftInstance(db, shift.id);
    instanceId = instance.id;
  });

  afterEach(() => {
    setAuthMockUserId(callerUserId);
  });

  it('creates an open time entry for a caller holding only check-in:manage', async () => {
    const volunteer = await createUser(db);
    await addMembership(db, volunteer.id, unitId);

    const data = await graphqlRequestRequiringData<{
      checkInVolunteer: { id: string };
    }>(
      app,
      {
        query: CHECK_IN_VOLUNTEER,
        variables: { volunteerId: volunteer.id, shiftInstanceId: instanceId },
        headers: { 'x-organization-unit-id': unitId },
      },
      'checkInVolunteer',
    );

    expect(data.checkInVolunteer.id).toBeTruthy();
  });

  it('rejects a second check-in while one is already open', async () => {
    const volunteer = await createUser(db);
    await addMembership(db, volunteer.id, unitId);

    await graphqlRequestRequiringData(
      app,
      {
        query: CHECK_IN_VOLUNTEER,
        variables: { volunteerId: volunteer.id, shiftInstanceId: instanceId },
        headers: { 'x-organization-unit-id': unitId },
      },
      'checkInVolunteer',
    );

    const response = await graphqlRequest(app, {
      query: CHECK_IN_VOLUNTEER,
      variables: { volunteerId: volunteer.id, shiftInstanceId: instanceId },
      headers: { 'x-organization-unit-id': unitId },
    });

    expect(response.errors?.[0]?.message).toBe('Already checked in');
  });

  it('rejects a volunteer who is not a member of the unit', async () => {
    const volunteer = await createUser(db); // no membership anywhere

    const response = await graphqlRequest(app, {
      query: CHECK_IN_VOLUNTEER,
      variables: { volunteerId: volunteer.id, shiftInstanceId: instanceId },
      headers: { 'x-organization-unit-id': unitId },
    });

    expect(response.errors?.[0]?.message).toBe(
      'Volunteer is not a member of this unit',
    );
  });

  // Self-contained org: root = membership ancestor, child = managed unit.
  // (A second root in the existing org would violate
  // uq_organization_units_organization_id_is_root_true.)
  it('accepts a volunteer whose membership is on an ancestor unit', async () => {
    const org = await createOrganizationWithType(
      db,
      `Ancestor ${crypto.randomUUID()}`,
    );
    const parentUnit = await createUnit(db, {
      organizationId: org.organization.id,
      typeId: org.type.id,
      name: 'Ancestor Parent',
    });
    const childUnit = await createUnit(db, {
      organizationId: org.organization.id,
      typeId: org.type.id,
      name: 'Ancestor Child',
      parentId: parentUnit.id,
    });

    // Caller holds check-in:manage on the child unit.
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
    const callerMembership = await addMembership(
      db,
      callerUserId,
      childUnit.id,
    );
    await assignRoleToMembership(db, {
      membershipId: callerMembership.id,
      roleId: role.id,
    });

    const shift = await createShift(db, { organizationUnitId: childUnit.id });
    const childInstance = await createShiftInstance(db, shift.id);

    // Volunteer is a member of the PARENT only.
    const volunteer = await createUser(db);
    await addMembership(db, volunteer.id, parentUnit.id);

    const data = await graphqlRequestRequiringData<{
      checkInVolunteer: { id: string };
    }>(
      app,
      {
        query: CHECK_IN_VOLUNTEER,
        variables: {
          volunteerId: volunteer.id,
          shiftInstanceId: childInstance.id,
        },
        headers: { 'x-organization-unit-id': childUnit.id },
      },
      'checkInVolunteer',
    );

    expect(data.checkInVolunteer.id).toBeTruthy();
  });
});

describe('check-in readiness/submit mutation permissions', () => {
  it('gates checkInReadiness on check-in:manage', () => {
    expect(
      Reflect.getMetadata(
        PERMISSIONS_KEY,
        TimeTrackingQueryResolver.prototype.checkInReadiness,
      ),
    ).toEqual([PERMISSIONS.CHECK_IN_MANAGE]);
  });

  it('gates checkInVolunteerRequiredForms on check-in:manage', () => {
    expect(
      Reflect.getMetadata(
        PERMISSIONS_KEY,
        TimeTrackingQueryResolver.prototype.checkInVolunteerRequiredForms,
      ),
    ).toEqual([PERMISSIONS.CHECK_IN_MANAGE]);
  });

  it('gates checkInVolunteer on check-in:manage', () => {
    expect(
      Reflect.getMetadata(
        PERMISSIONS_KEY,
        TimeTrackingMutationResolver.prototype.checkInVolunteer,
      ),
    ).toEqual([PERMISSIONS.CHECK_IN_MANAGE]);
  });

  it('gates checkInInviteToShiftInstance on check-in:manage', () => {
    expect(
      Reflect.getMetadata(
        PERMISSIONS_KEY,
        ShiftMutationResolver.prototype.checkInInviteToShiftInstance,
      ),
    ).toEqual([PERMISSIONS.CHECK_IN_MANAGE]);
  });

  it('gates checkInInviteToOrganization on check-in:manage', () => {
    expect(
      Reflect.getMetadata(
        PERMISSIONS_KEY,
        TimeTrackingMutationResolver.prototype.checkInInviteToOrganization,
      ),
    ).toEqual([PERMISSIONS.CHECK_IN_MANAGE]);
  });

  it("gates checkInApproveMembershipRequest on check-in:manage (distinct from approveMembershipRequest's volunteer:edit)", () => {
    expect(
      Reflect.getMetadata(
        PERMISSIONS_KEY,
        MembershipLifecycleMutationResolver.prototype
          .checkInApproveMembershipRequest,
      ),
    ).toEqual([PERMISSIONS.CHECK_IN_MANAGE]);
  });
});

describe('checkInInviteToShiftInstance mutation', () => {
  const CHECK_IN_INVITE_TO_SHIFT_INSTANCE = `
    mutation CheckInInviteToShiftInstance($shiftInstanceId: ID!, $volunteerId: ID!) {
      checkInInviteToShiftInstance(shiftInstanceId: $shiftInstanceId, volunteerId: $volunteerId) {
        id
      }
    }
  `;

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
      `ShiftInvite ${crypto.randomUUID()}`,
    );
    const unit = await createUnit(db, {
      organizationId: org.organization.id,
      typeId: org.type.id,
      name: 'Shift invite unit',
    });
    unitId = unit.id;

    const permission = await db.query.permissions.findFirst({
      where: { key: PERMISSIONS.CHECK_IN_MANAGE },
    });
    if (!permission) throw new Error('CHECK_IN_MANAGE permission not seeded');

    const role = await createRole(db, { organizationId: org.organization.id });
    await grantPermissionToRole(db, {
      roleId: role.id,
      permissionId: permission.id,
    });
    const membership = await addMembership(db, callerUserId, unit.id);
    await assignRoleToMembership(db, {
      membershipId: membership.id,
      roleId: role.id,
    });
  });

  afterEach(() => {
    setAuthMockUserId(callerUserId);
  });

  it('creates an INVITED invite and leaves other invites on the instance intact', async () => {
    const shift = await createShift(db, { organizationUnitId: unitId });
    const instance = await createShiftInstance(db, shift.id);
    const alreadyInvited = await createUser(db);
    await createShiftInstanceInvite(db, {
      instanceId: instance.id,
      userId: alreadyInvited.id,
      status: ShiftInviteStatus.ACCEPTED,
    });
    const volunteer = await createUser(db);

    await graphqlRequestRequiringData(
      app,
      {
        query: CHECK_IN_INVITE_TO_SHIFT_INSTANCE,
        variables: { shiftInstanceId: instance.id, volunteerId: volunteer.id },
        headers: { 'x-organization-unit-id': unitId },
      },
      'checkInInviteToShiftInstance',
    );

    const invites = await db.query.shiftInstanceInvites.findMany({
      where: { instanceId: instance.id },
    });
    const byUserId = new Map(invites.map((i) => [i.userId, i.status]));

    expect(byUserId.get(volunteer.id)).toBe(ShiftInviteStatus.INVITED);
    expect(byUserId.get(alreadyInvited.id)).toBe(ShiftInviteStatus.ACCEPTED);
  });

  it('rejects a shift instance that belongs to a different org unit', async () => {
    const otherOrg = await createOrganizationWithType(
      db,
      `OtherShiftInvite ${crypto.randomUUID()}`,
    );
    const otherUnit = await createUnit(db, {
      organizationId: otherOrg.organization.id,
      typeId: otherOrg.type.id,
      name: 'Other shift invite unit',
    });
    const foreignShift = await createShift(db, {
      organizationUnitId: otherUnit.id,
    });
    const foreignInstance = await createShiftInstance(db, foreignShift.id);
    const volunteer = await createUser(db);

    const response = await graphqlRequest(app, {
      query: CHECK_IN_INVITE_TO_SHIFT_INSTANCE,
      variables: {
        shiftInstanceId: foreignInstance.id,
        volunteerId: volunteer.id,
      },
      // Caller's header names their OWN unit, not the foreign one — the
      // service must fail to find the instance scoped to that header rather
      // than silently inviting across org boundaries.
      headers: { 'x-organization-unit-id': unitId },
    });

    expect(response.errors?.[0]?.message).toContain('not found');
  });
});

describe('checkInInviteToOrganization mutation', () => {
  const CHECK_IN_INVITE_TO_ORGANIZATION = `
    mutation CheckInInviteToOrganization($volunteerId: ID!) {
      checkInInviteToOrganization(volunteerId: $volunteerId)
    }
  `;

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
      `OrgInvite ${crypto.randomUUID()}`,
    );
    const unit = await createUnit(db, {
      organizationId: org.organization.id,
      typeId: org.type.id,
      name: 'Org invite unit',
    });
    unitId = unit.id;

    const permission = await db.query.permissions.findFirst({
      where: { key: PERMISSIONS.CHECK_IN_MANAGE },
    });
    if (!permission) throw new Error('CHECK_IN_MANAGE permission not seeded');

    const role = await createRole(db, { organizationId: org.organization.id });
    await grantPermissionToRole(db, {
      roleId: role.id,
      permissionId: permission.id,
    });
    const membership = await addMembership(db, callerUserId, unit.id);
    await assignRoleToMembership(db, {
      membershipId: membership.id,
      roleId: role.id,
    });
  });

  afterEach(() => {
    setAuthMockUserId(callerUserId);
  });

  it('succeeds without creating a membership or a membership request', async () => {
    const volunteer = await createUser(db);

    const data = await graphqlRequestRequiringData<{
      checkInInviteToOrganization: boolean;
    }>(
      app,
      {
        query: CHECK_IN_INVITE_TO_ORGANIZATION,
        variables: { volunteerId: volunteer.id },
        headers: { 'x-organization-unit-id': unitId },
      },
      'checkInInviteToOrganization',
    );

    expect(data.checkInInviteToOrganization).toBe(true);

    const membership = await db.query.memberships.findFirst({
      where: { userId: volunteer.id, organizationUnitId: unitId },
    });
    const request = await db.query.membershipRequests.findFirst({
      where: { userId: volunteer.id, organizationUnitId: unitId },
    });
    expect(membership).toBeUndefined();
    expect(request).toBeUndefined();
  });
});

describe('checkInApproveMembershipRequest mutation', () => {
  const CHECK_IN_APPROVE_MEMBERSHIP_REQUEST = `
    mutation CheckInApproveMembershipRequest($requestId: ID!) {
      checkInApproveMembershipRequest(requestId: $requestId) {
        id
        status
      }
    }
  `;

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
      `ApproveRequest ${crypto.randomUUID()}`,
    );
    const unit = await createUnit(db, {
      organizationId: org.organization.id,
      typeId: org.type.id,
      name: 'Approve request unit',
    });
    unitId = unit.id;

    // Create the default member role for this organization, needed by approveMembershipRequest
    const [memberRole] = await db
      .insert(schema.roles)
      .values({
        name: DEFAULT_MEMBER_ROLE_NAME,
        isInternal: true,
        organizationId: org.organization.id,
      })
      .returning();
    if (!memberRole) throw new Error('Failed to create default member role');

    // Caller holds ONLY check-in:manage — not volunteer:edit — proving the
    // new mutation does not depend on the existing approveMembershipRequest's
    // permission.
    const permission = await db.query.permissions.findFirst({
      where: { key: PERMISSIONS.CHECK_IN_MANAGE },
    });
    if (!permission) throw new Error('CHECK_IN_MANAGE permission not seeded');

    const role = await createRole(db, { organizationId: org.organization.id });
    await grantPermissionToRole(db, {
      roleId: role.id,
      permissionId: permission.id,
    });
    const membership = await addMembership(db, callerUserId, unit.id);
    await assignRoleToMembership(db, {
      membershipId: membership.id,
      roleId: role.id,
    });
  });

  afterEach(() => {
    setAuthMockUserId(callerUserId);
  });

  it('approves the request and creates a membership for a caller without volunteer:edit', async () => {
    const volunteer = await createUser(db);
    const request = await createMembershipRequest(db, {
      userId: volunteer.id,
      organizationUnitId: unitId,
    });

    const data = await graphqlRequestRequiringData<{
      checkInApproveMembershipRequest: { id: string; status: string };
    }>(
      app,
      {
        query: CHECK_IN_APPROVE_MEMBERSHIP_REQUEST,
        variables: { requestId: request.id },
        headers: { 'x-organization-unit-id': unitId },
      },
      'checkInApproveMembershipRequest',
    );

    expect(data.checkInApproveMembershipRequest.status).toBe('ACCEPTED');

    const membership = await db.query.memberships.findFirst({
      where: { userId: volunteer.id, organizationUnitId: unitId },
    });
    expect(membership).toBeTruthy();
  });
});

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
import { ShiftInviteStatus } from '../src/shift/enums';
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
import { graphqlRequestRequiringData } from './helpers/graphql-request';
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
});

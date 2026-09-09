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
import {
  ContractStatus,
  DocumentKind,
  InvoiceStatus,
} from '../src/accounting/enums';
import type { Database } from '../src/database/database.module';
import * as schema from '../src/database/schema';
import { ShiftInviteStatus } from '../src/shift/enums';
import { createReimbursementType } from './factories/accounting.factory';
import {
  addMembership,
  createOrganizationWithType,
  createUnit,
} from './factories/org.factory';
import {
  assignRoleToMembership,
  createPermission,
  createRole,
  grantPermissionToRole,
} from './factories/role.factory';
import { createShift } from './factories/shift.factory';
import { createShiftInstanceInvite } from './factories/shift-instance-invite.factory';
import { createUser } from './factories/user.factory';
import { applyBunAuthMocks, setAuthMockUserId } from './helpers/auth-mocks';
import {
  graphqlRequest,
  graphqlRequestRequiringData,
} from './helpers/graphql-request';
import { getGraphqlTestContext } from './helpers/graphql-test-context';

applyBunAuthMocks(mock.module);
setDefaultTimeout(30_000);

const PAID_SHIFT_SIGNUP_VOLUNTEERS = `
  query PaidShiftSignupVolunteers($year: Int!) {
    paidShiftSignupVolunteers(year: $year) {
      volunteer { id }
      reimbursementType { id }
    }
  }
`;

type PaidShiftSignup = {
  volunteer: { id: string };
  reimbursementType: { id: string };
};

type FlowOrg = Awaited<ReturnType<typeof setupPaidShiftOrg>>;

const setupPaidShiftOrg = async (db: Database) => {
  const reimbursementType = await createReimbursementType(db);
  const { organization, type } = await createOrganizationWithType(
    db,
    `Paid Shift Org ${crypto.randomUUID()}`,
  );
  const root = await createUnit(db, {
    organizationId: organization.id,
    typeId: type.id,
    name: 'root',
  });
  await db
    .update(schema.organizations)
    .set({ accountingEnabled: true })
    .where(eq(schema.organizations.id, organization.id));

  const permission =
    (await db.query.permissions.findFirst({
      where: { key: 'accounting:manage' },
    })) ?? (await createPermission(db, { key: 'accounting:manage' }));
  const role = await createRole(db, { organizationId: organization.id });
  await grantPermissionToRole(db, {
    roleId: role.id,
    permissionId: permission.id,
  });

  const admin = await createUser(db);
  const adminMembership = await addMembership(db, admin.id, root.id);
  await assignRoleToMembership(db, {
    membershipId: adminMembership.id,
    roleId: role.id,
  });

  const volunteer = await createUser(db);
  await addMembership(db, volunteer.id, root.id);

  return {
    organizationId: organization.id,
    organizationUnitId: root.id,
    adminId: admin.id,
    volunteerId: volunteer.id,
    reimbursementTypeId: reimbursementType.id,
  };
};

const createPaidShiftWithJoinedVolunteer = async (
  db: Database,
  args: {
    organizationUnitId: string;
    volunteerId: string;
    reimbursementTypeId: string | null;
    status?: ShiftInviteStatus;
    actualStartsAt?: Date;
  },
) => {
  const startsAt = args.actualStartsAt ?? new Date('2026-06-19T08:00:00.000Z');
  const shift = await createShift(db, {
    organizationUnitId: args.organizationUnitId,
    reimbursementTypeId: args.reimbursementTypeId,
    startsAt,
    endsAt: new Date(startsAt.getTime() + 2 * 60 * 60 * 1000),
  });
  const instance = await db.query.shiftInstances.findFirst({
    where: { masterId: shift.id },
  });
  if (!instance) throw new Error('Shift instance not created');
  await createShiftInstanceInvite(db, {
    instanceId: instance.id,
    userId: args.volunteerId,
    status: args.status ?? ShiftInviteStatus.JOINED,
  });
  return instance;
};

describe('paidShiftSignupVolunteers', () => {
  let app: INestApplication;
  let db: Database;
  let org: FlowOrg;
  let orgHeader: Record<string, string>;

  beforeAll(async () => {
    const context = await getGraphqlTestContext();
    app = context.app;
    db = context.db;

    org = await setupPaidShiftOrg(db);
    orgHeader = { 'x-organization-unit-id': org.organizationUnitId };
    setAuthMockUserId(org.adminId);
  });

  const query = async (year: number) =>
    graphqlRequestRequiringData<{
      paidShiftSignupVolunteers: PaidShiftSignup[];
    }>(
      app,
      {
        query: PAID_SHIFT_SIGNUP_VOLUNTEERS,
        variables: { year },
        headers: orgHeader,
      },
      'paidShiftSignupVolunteers',
    );

  it('surfaces a volunteer with a JOINED invite on a paid shift instance in the requested year', async () => {
    await createPaidShiftWithJoinedVolunteer(db, {
      organizationUnitId: org.organizationUnitId,
      volunteerId: org.volunteerId,
      reimbursementTypeId: org.reimbursementTypeId,
    });

    const { paidShiftSignupVolunteers } = await query(2026);
    expect(paidShiftSignupVolunteers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          volunteer: { id: org.volunteerId },
          reimbursementType: { id: org.reimbursementTypeId },
        }),
      ]),
    );
  });

  it('dedupes a volunteer with multiple JOINED paid-shift instances to one row per type', async () => {
    await createPaidShiftWithJoinedVolunteer(db, {
      organizationUnitId: org.organizationUnitId,
      volunteerId: org.volunteerId,
      reimbursementTypeId: org.reimbursementTypeId,
      actualStartsAt: new Date('2026-01-10T08:00:00.000Z'),
    });
    await createPaidShiftWithJoinedVolunteer(db, {
      organizationUnitId: org.organizationUnitId,
      volunteerId: org.volunteerId,
      reimbursementTypeId: org.reimbursementTypeId,
      actualStartsAt: new Date('2026-02-10T08:00:00.000Z'),
    });

    const { paidShiftSignupVolunteers } = await query(2026);
    const matches = paidShiftSignupVolunteers.filter(
      (entry) =>
        entry.volunteer.id === org.volunteerId &&
        entry.reimbursementType.id === org.reimbursementTypeId,
    );
    expect(matches).toHaveLength(1);
  });

  it('excludes a volunteer who already has a non-declined contract for that type', async () => {
    const other = await createUser(db);
    await addMembership(db, other.id, org.organizationUnitId);
    await createPaidShiftWithJoinedVolunteer(db, {
      organizationUnitId: org.organizationUnitId,
      volunteerId: other.id,
      reimbursementTypeId: org.reimbursementTypeId,
      actualStartsAt: new Date('2026-03-10T08:00:00.000Z'),
    });

    const [template] = await db
      .insert(schema.documentTemplates)
      .values({
        organizationId: org.organizationId,
        organizationUnitId: org.organizationUnitId,
        reimbursementTypeId: org.reimbursementTypeId,
        kind: DocumentKind.CONTRACT,
        body: { header: {}, blocks: [], footer: {} },
      })
      .returning();
    await db.insert(schema.contracts).values({
      documentTemplateId: template.id,
      volunteerId: other.id,
      reimbursementTypeId: org.reimbursementTypeId,
      organizationUnitId: org.organizationUnitId,
      contractStatus: ContractStatus.ACTIVE,
      periodStart: new Date('2026-01-01T00:00:00.000Z'),
      periodEnd: new Date('2027-01-01T00:00:00.000Z'),
      resolvedBody: { header: {}, blocks: [], footer: {} },
    });

    const { paidShiftSignupVolunteers } = await query(2026);
    expect(
      paidShiftSignupVolunteers.some(
        (entry) => entry.volunteer.id === other.id,
      ),
    ).toBe(false);
  });

  it('excludes a volunteer who already has an invoice for that type in the year', async () => {
    const other = await createUser(db);
    await addMembership(db, other.id, org.organizationUnitId);
    await createPaidShiftWithJoinedVolunteer(db, {
      organizationUnitId: org.organizationUnitId,
      volunteerId: other.id,
      reimbursementTypeId: org.reimbursementTypeId,
      actualStartsAt: new Date('2026-04-10T08:00:00.000Z'),
    });

    const [template] = await db
      .insert(schema.documentTemplates)
      .values({
        organizationId: org.organizationId,
        organizationUnitId: org.organizationUnitId,
        reimbursementTypeId: org.reimbursementTypeId,
        kind: DocumentKind.INVOICE,
        body: { header: {}, blocks: [], footer: {} },
      })
      .returning();
    await db.insert(schema.invoices).values({
      documentTemplateId: template.id,
      volunteerId: other.id,
      reimbursementTypeId: org.reimbursementTypeId,
      organizationUnitId: org.organizationUnitId,
      invoiceStatus: InvoiceStatus.READY,
      periodStart: new Date('2026-05-01T00:00:00.000Z'),
      periodEnd: new Date('2026-05-31T23:59:59.000Z'),
      totalAmountCents: 100,
      totalHours: 1,
      resolvedBody: { header: {}, blocks: [], footer: {} },
    });

    const { paidShiftSignupVolunteers } = await query(2026);
    expect(
      paidShiftSignupVolunteers.some(
        (entry) => entry.volunteer.id === other.id,
      ),
    ).toBe(false);
  });

  it('does not surface a JOINED invite on an unpaid shift (no reimbursement type)', async () => {
    const other = await createUser(db);
    await addMembership(db, other.id, org.organizationUnitId);
    await createPaidShiftWithJoinedVolunteer(db, {
      organizationUnitId: org.organizationUnitId,
      volunteerId: other.id,
      reimbursementTypeId: null,
      actualStartsAt: new Date('2026-05-10T08:00:00.000Z'),
    });

    const { paidShiftSignupVolunteers } = await query(2026);
    expect(
      paidShiftSignupVolunteers.some(
        (entry) => entry.volunteer.id === other.id,
      ),
    ).toBe(false);
  });

  it('does not surface a volunteer whose invite is not JOINED', async () => {
    const other = await createUser(db);
    await addMembership(db, other.id, org.organizationUnitId);
    await createPaidShiftWithJoinedVolunteer(db, {
      organizationUnitId: org.organizationUnitId,
      volunteerId: other.id,
      reimbursementTypeId: org.reimbursementTypeId,
      status: ShiftInviteStatus.ADMIN_INVITED,
      actualStartsAt: new Date('2026-06-10T08:00:00.000Z'),
    });

    const { paidShiftSignupVolunteers } = await query(2026);
    expect(
      paidShiftSignupVolunteers.some(
        (entry) => entry.volunteer.id === other.id,
      ),
    ).toBe(false);
  });

  it('does not surface paid-shift signups from another organization', async () => {
    const otherOrg = await setupPaidShiftOrg(db);
    const otherVolunteer = await createUser(db);
    await createPaidShiftWithJoinedVolunteer(db, {
      organizationUnitId: otherOrg.organizationUnitId,
      volunteerId: otherVolunteer.id,
      reimbursementTypeId: otherOrg.reimbursementTypeId,
      actualStartsAt: new Date('2026-07-10T08:00:00.000Z'),
    });

    const { paidShiftSignupVolunteers } = await query(2026);
    expect(
      paidShiftSignupVolunteers.some(
        (entry) => entry.volunteer.id === otherVolunteer.id,
      ),
    ).toBe(false);
  });

  it('forbids the query when accounting is disabled for the organization', async () => {
    await db
      .update(schema.organizations)
      .set({ accountingEnabled: false })
      .where(eq(schema.organizations.id, org.organizationId));

    const response = await graphqlRequest<{
      paidShiftSignupVolunteers?: unknown;
    }>(app, {
      query: PAID_SHIFT_SIGNUP_VOLUNTEERS,
      variables: { year: 2026 },
      headers: orgHeader,
    });
    expect(response.errors?.[0]?.extensions?.code).toBe('FORBIDDEN');

    await db
      .update(schema.organizations)
      .set({ accountingEnabled: true })
      .where(eq(schema.organizations.id, org.organizationId));
  });
});

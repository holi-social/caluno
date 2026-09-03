import { beforeAll, describe, expect, it } from 'bun:test';
import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { eq } from 'drizzle-orm';
import { AccountingOrgAccessService } from '../src/accounting/services/accounting-org-access.service';
import { InvoiceService } from '../src/accounting/services/invoice.service';
import { AuthService } from '../src/auth/auth.service';
import { type Database, DatabaseModule } from '../src/database/database.module';
import { DATABASE_CONNECTION } from '../src/database/database-connection';
import * as schema from '../src/database/schema';
import { MembershipService } from '../src/membership/membership.service';
import { NotificationService } from '../src/notification';
import { OrganizationService } from '../src/organization/organization.service';
import { OrganizationUnitService } from '../src/organization/organization-unit.service';
import { PostHogService } from '../src/shared/observability/posthog.service';
import { ShiftVisibility } from '../src/shift/enums';
import { ShiftService } from '../src/shift/shift.service';
import { AddTimeEntryInput } from '../src/time-tracking/inputs/add-time-entry.input';
import { CloseTimeEntryInput } from '../src/time-tracking/inputs/close-time-enty-input';
import { TimeTrackingService } from '../src/time-tracking/time-tracking.service';
import { createReimbursementType } from './factories/accounting.factory';
import {
  createOrganizationWithType,
  createUnit,
} from './factories/org.factory';
import { createUser } from './factories/user.factory';
import {
  ensureTestDatabase,
  registerTestResourceCleanup,
} from './helpers/ensure-test-database';

describe('Time entry -> eligible timesheet flow', () => {
  let moduleRef: TestingModule;
  let db: Database;
  let shiftService: ShiftService;
  let timeTrackingService: TimeTrackingService;
  let invoiceService: InvoiceService;
  let organizationUnitId: string;
  let volunteerId: string;

  beforeAll(async () => {
    await ensureTestDatabase();
    moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule],
    }).compile();
    db = moduleRef.get<Database>(DATABASE_CONNECTION);

    const organizationUnitService = new OrganizationUnitService(
      db,
      {} as never,
      {} as never,
      {} as never,
    );
    const accountingOrgAccessService = new AccountingOrgAccessService(
      db,
      organizationUnitService,
    );

    shiftService = new ShiftService(
      db,
      {} as AuthService,
      {} as never,
      {} as MembershipService,
      {} as NotificationService,
      {} as OrganizationService,
      {} as never,
      {} as never,
      {} as never,
      { capture: () => {} } as unknown as PostHogService,
      accountingOrgAccessService,
    );
    timeTrackingService = new TimeTrackingService(
      db,
      {} as MembershipService,
      shiftService,
      { capture: () => {} } as unknown as PostHogService,
    );
    // InvoiceService is not registered as a provider by DatabaseModule alone
    // (it depends on a chain of accounting services), so it is constructed
    // directly like `test/invoice.service.spec.ts` does. Both methods this
    // test exercises (findEligibleTimeEntries/findVolunteersNeedingTimesheets)
    // only touch `db`, so every other dependency is safely stubbed.
    invoiceService = new InvoiceService(
      db,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      { capture: () => {} } as unknown as PostHogService,
    );

    const { organization, type } = await createOrganizationWithType(
      db,
      `Time Entry Reimbursement Flow Org ${crypto.randomUUID()}`,
    );
    organizationUnitId = (
      await createUnit(db, {
        organizationId: organization.id,
        typeId: type.id,
        name: 'root',
      })
    ).id;
    volunteerId = (await createUser(db)).id;

    await db
      .update(schema.organizations)
      .set({ accountingEnabled: true })
      .where(eq(schema.organizations.id, organization.id));

    registerTestResourceCleanup(async () => {
      await moduleRef.close();
    });
  });

  it('makes a checked-out volunteer eligible once their shift has a reimbursement type', async () => {
    const reimbursementType = await createReimbursementType(db);

    const shift = await shiftService.create(volunteerId, organizationUnitId, {
      title: 'Reimbursable coaching',
      startsAt: new Date(Date.now() - 3600_000),
      endsAt: new Date(Date.now() - 1800_000),
      visibility: ShiftVisibility.ALL_MEMBERS,
      reimbursementTypeId: reimbursementType.id,
    } as never);

    const [instance] = await db
      .select()
      .from(schema.shiftInstances)
      .where(eq(schema.shiftInstances.masterId, shift.id));

    const addInput = Object.assign(new AddTimeEntryInput(), {
      shiftInstanceId: instance.id,
      volunteerId,
      startedAt: new Date(Date.now() - 3600_000),
      notes: null,
    });
    const entry = await timeTrackingService.addTimeEntry(
      organizationUnitId,
      addInput,
      volunteerId,
    );

    const closeInput = Object.assign(new CloseTimeEntryInput(), {
      endedAt: new Date(Date.now() - 1800_000),
      notes: null,
    });
    await timeTrackingService.closeTimeEntry(
      entry.id,
      organizationUnitId,
      closeInput,
      volunteerId,
    );

    const eligible = await invoiceService.findEligibleTimeEntries(
      volunteerId,
      reimbursementType.id,
    );
    expect(eligible.map((e) => e.id)).toContain(entry.id);

    const needingTimesheets =
      await invoiceService.findVolunteersNeedingTimesheets(organizationUnitId);
    expect(
      needingTimesheets.some(
        (row) =>
          row.volunteerId === volunteerId &&
          row.reimbursementTypeId === reimbursementType.id,
      ),
    ).toBe(true);
  });

  it('leaves a type-less entry untyped, unpaid, and excluded from eligible timesheets', async () => {
    // Snapshot eligibility before creating the type-less entry, so we can
    // prove below that closing it doesn't change what's eligible — not just
    // that the entry itself came out untyped.
    const before =
      await invoiceService.findVolunteersNeedingTimesheets(organizationUnitId);

    const shift = await shiftService.create(volunteerId, organizationUnitId, {
      title: 'Unpaid setup',
      startsAt: new Date(Date.now() - 3600_000),
      endsAt: new Date(Date.now() - 1800_000),
      visibility: ShiftVisibility.ALL_MEMBERS,
    } as never);

    const [instance] = await db
      .select()
      .from(schema.shiftInstances)
      .where(eq(schema.shiftInstances.masterId, shift.id));

    const addInput = Object.assign(new AddTimeEntryInput(), {
      shiftInstanceId: instance.id,
      volunteerId,
      startedAt: new Date(Date.now() - 3600_000),
      notes: null,
    });
    const entry = await timeTrackingService.addTimeEntry(
      organizationUnitId,
      addInput,
      volunteerId,
    );
    const closeInput = Object.assign(new CloseTimeEntryInput(), {
      endedAt: new Date(Date.now() - 1800_000),
      notes: null,
    });
    await timeTrackingService.closeTimeEntry(
      entry.id,
      organizationUnitId,
      closeInput,
      volunteerId,
    );

    expect(entry.reimbursementTypeId).toBeNull();
    expect(entry.isPaid).toBe(false);

    const after =
      await invoiceService.findVolunteersNeedingTimesheets(organizationUnitId);
    expect(after).toEqual(before);
  });
});

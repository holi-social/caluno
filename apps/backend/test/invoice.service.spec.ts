import { beforeAll, describe, expect, it } from 'bun:test';
import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import {
  ContractStatus,
  DocumentKind,
  DocumentStatusChange,
  InvoiceStatus,
  SigneeType,
} from '../src/accounting/enums';
import { ContractService } from '../src/accounting/services/contract.service';
import { DocumentSigningService } from '../src/accounting/services/document-signing.service';
import { DocumentTemplateService } from '../src/accounting/services/document-template.service';
import { InvoiceService } from '../src/accounting/services/invoice.service';
import { ReimbursementRateService } from '../src/accounting/services/reimbursement-rate.service';
import { AuthService } from '../src/auth/auth.service';
import { type Database, DatabaseModule } from '../src/database/database.module';
import { DATABASE_CONNECTION } from '../src/database/database-connection';
import * as schema from '../src/database/schema';
import {
  BadRequestGraphQLError,
  ConflictGraphQLError,
} from '../src/graphql/errors';
import { MembershipService } from '../src/membership/membership.service';
import { NotificationService } from '../src/notification';
import { OrganizationMapper } from '../src/organization/mappers/organization.mapper';
import { OrganizationService } from '../src/organization/organization.service';
import { OrganizationUnitService } from '../src/organization/organization-unit.service';
import { OrganizationUnitDataService } from '../src/organization/organization-unit-data.service';
import { PostHogCaptureService } from '../src/shared/observability/posthog.capture.service';
import { FileService } from '../src/storage/services/file.service';
import {
  createCompletedTimeEntry,
  createDocumentTemplate,
  createReimbursementType,
  createTwoStepTemplate,
} from './factories/accounting.factory';
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
import { createShiftInstance } from './factories/shift-instance.factory';
import { createUser } from './factories/user.factory';
import {
  ensureTestDatabase,
  registerTestResourceCleanup,
} from './helpers/ensure-test-database';

describe('InvoiceService', () => {
  let moduleRef: TestingModule;
  let db: Database;
  let service: InvoiceService;

  beforeAll(async () => {
    await ensureTestDatabase();
    moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule],
    }).compile();
    db = moduleRef.get<Database>(DATABASE_CONNECTION);

    const organizationUnitDataService = new OrganizationUnitDataService(db);
    const authService = new AuthService(db, organizationUnitDataService);
    const organizationService = new OrganizationService(
      db,
      {} as OrganizationMapper,
      {} as MembershipService,
      {} as OrganizationUnitService,
      {} as NotificationService,
      {} as FileService,
      {} as PostHogCaptureService,
    );
    const documentTemplateService = new DocumentTemplateService(db);
    const documentSigningService = new DocumentSigningService(
      db,
      authService,
      organizationService,
    );
    const reimbursementRateService = new ReimbursementRateService(db);
    const contractService = new ContractService(
      db,
      documentTemplateService,
      documentSigningService,
    );
    service = new InvoiceService(
      db,
      documentTemplateService,
      documentSigningService,
      reimbursementRateService,
      contractService,
    );

    registerTestResourceCleanup(async () => {
      await moduleRef.close();
    });
  });

  /** Org + root unit + an invoice template (volunteer -> permission holder) + a completed, unclaimed time entry. */
  const setup = async (args?: { rateCents?: number }) => {
    const reimbursementType = await createReimbursementType(db, {
      platformDefaultRateCents: args?.rateCents ?? 1_500,
    });
    const { organization, type } = await createOrganizationWithType(
      db,
      `Invoice Org ${crypto.randomUUID()}`,
    );
    const root = await createUnit(db, {
      organizationId: organization.id,
      typeId: type.id,
      name: 'root',
    });
    const permission = await createPermission(db, {
      key: `accounting:manage:${crypto.randomUUID()}`,
    });
    const role = await createRole(db, { organizationId: organization.id });
    await grantPermissionToRole(db, {
      roleId: role.id,
      permissionId: permission.id,
    });
    const supervisor = await createUser(db);
    const supervisorMembership = await addMembership(
      db,
      supervisor.id,
      root.id,
    );
    await assignRoleToMembership(db, {
      membershipId: supervisorMembership.id,
      roleId: role.id,
    });
    await createTwoStepTemplate(db, {
      organizationId: organization.id,
      reimbursementTypeId: reimbursementType.id,
      kind: DocumentKind.INVOICE,
      requiredPermissionId: permission.id,
      signeeTypes: [SigneeType.VOLUNTEER, SigneeType.PERMISSION_HOLDER],
    });
    const volunteer = await createUser(db);
    const timeEntry = await createCompletedTimeEntry(db, {
      organizationUnitId: root.id,
      volunteerId: volunteer.id,
      reimbursementTypeId: reimbursementType.id,
      startedAt: new Date('2026-07-01T09:00:00.000Z'),
      endedAt: new Date('2026-07-01T13:00:00.000Z'), // 4 hours
    });

    return {
      organization,
      root,
      reimbursementType,
      volunteer,
      supervisor,
      timeEntry,
    };
  };

  describe('findEligibleTimeEntries', () => {
    it('excludes entries that have not been ended yet', async () => {
      const { root, reimbursementType, volunteer } = await setup();
      const shift = await createShift(db, {
        organizationUnitId: root.id,
        createdById: volunteer.id,
      });
      const instance = await createShiftInstance(db, shift.id);
      await db.insert(schema.timeEntries).values({
        shiftInstanceId: instance.id,
        organizationUnitId: root.id,
        volunteerId: volunteer.id,
        reimbursementTypeId: reimbursementType.id,
        startedAt: new Date(),
        endedAt: null,
      });

      const eligible = await service.findEligibleTimeEntries(
        volunteer.id,
        reimbursementType.id,
      );
      expect(eligible.every((entry) => entry.endedAt !== null)).toBe(true);
    });

    it('excludes an entry already claimed by an invoice, even a declined one', async () => {
      const {
        organization,
        reimbursementType,
        volunteer,
        supervisor,
        timeEntry,
      } = await setup();

      const invoice = await service.createInvoice(
        organization.id,
        {
          organizationUnitId: null,
          volunteerId: volunteer.id,
          reimbursementTypeId: reimbursementType.id,
          timeEntryIds: [timeEntry.id],
          periodStart: new Date('2026-07-01T00:00:00.000Z'),
          periodEnd: new Date('2026-07-31T00:00:00.000Z'),
        },
        supervisor.id,
      );
      await service.declineInvoice(invoice.id, volunteer.id, 'changed my mind');

      const eligible = await service.findEligibleTimeEntries(
        volunteer.id,
        reimbursementType.id,
      );
      expect(eligible.map((e) => e.id)).not.toContain(timeEntry.id);
    });
  });

  describe('createInvoice', () => {
    it('rejects an empty selection of time entries', async () => {
      const { organization, reimbursementType, volunteer, supervisor } =
        await setup();

      await expect(
        service.createInvoice(
          organization.id,
          {
            organizationUnitId: null,
            volunteerId: volunteer.id,
            reimbursementTypeId: reimbursementType.id,
            timeEntryIds: [],
            periodStart: new Date(),
            periodEnd: new Date(),
          },
          supervisor.id,
        ),
      ).rejects.toBeInstanceOf(BadRequestGraphQLError);
    });

    it('rejects a time entry id that is not eligible', async () => {
      const { organization, reimbursementType, volunteer, supervisor } =
        await setup();

      await expect(
        service.createInvoice(
          organization.id,
          {
            organizationUnitId: null,
            volunteerId: volunteer.id,
            reimbursementTypeId: reimbursementType.id,
            timeEntryIds: [crypto.randomUUID()],
            periodStart: new Date(),
            periodEnd: new Date(),
          },
          supervisor.id,
        ),
      ).rejects.toBeInstanceOf(ConflictGraphQLError);
    });

    it('computes total hours and amount from the effective rate', async () => {
      const {
        organization,
        reimbursementType,
        volunteer,
        supervisor,
        timeEntry,
      } = await setup({ rateCents: 1_500 });

      const invoice = await service.createInvoice(
        organization.id,
        {
          organizationUnitId: null,
          volunteerId: volunteer.id,
          reimbursementTypeId: reimbursementType.id,
          timeEntryIds: [timeEntry.id],
          periodStart: new Date('2026-07-01T00:00:00.000Z'),
          periodEnd: new Date('2026-07-31T00:00:00.000Z'),
        },
        supervisor.id,
      );

      expect(invoice.totalHours).toBe(4);
      expect(invoice.totalAmountCents).toBe(4 * 1_500);
    });

    it('uses the org rate override over the platform default', async () => {
      const {
        organization,
        reimbursementType,
        volunteer,
        supervisor,
        timeEntry,
      } = await setup({ rateCents: 1_500 });
      const reimbursementRateService = new ReimbursementRateService(db);
      await reimbursementRateService.setReimbursementRate(
        organization.id,
        reimbursementType.id,
        2_000,
      );

      const invoice = await service.createInvoice(
        organization.id,
        {
          organizationUnitId: null,
          volunteerId: volunteer.id,
          reimbursementTypeId: reimbursementType.id,
          timeEntryIds: [timeEntry.id],
          periodStart: new Date('2026-07-01T00:00:00.000Z'),
          periodEnd: new Date('2026-07-31T00:00:00.000Z'),
        },
        supervisor.id,
      );

      expect(invoice.totalAmountCents).toBe(4 * 2_000);
    });

    it('flags the invoice as non-compliant when the volunteer has no active contract', async () => {
      const {
        organization,
        reimbursementType,
        volunteer,
        supervisor,
        timeEntry,
      } = await setup();

      const invoice = await service.createInvoice(
        organization.id,
        {
          organizationUnitId: null,
          volunteerId: volunteer.id,
          reimbursementTypeId: reimbursementType.id,
          timeEntryIds: [timeEntry.id],
          periodStart: new Date('2026-07-01T00:00:00.000Z'),
          periodEnd: new Date('2026-07-31T00:00:00.000Z'),
        },
        supervisor.id,
      );

      expect(invoice.isNonCompliant).toBe(true);
    });

    it('does not flag the invoice when the volunteer has an active contract', async () => {
      const {
        organization,
        reimbursementType,
        volunteer,
        supervisor,
        timeEntry,
      } = await setup();
      const contractTemplate = await createDocumentTemplate(db, {
        organizationId: organization.id,
        reimbursementTypeId: reimbursementType.id,
        kind: DocumentKind.CONTRACT,
        signees: [{ order: 0, signeeType: SigneeType.VOLUNTEER }],
      });
      await db.insert(schema.contracts).values({
        documentTemplateId: contractTemplate.id,
        volunteerId: volunteer.id,
        reimbursementTypeId: reimbursementType.id,
        contractStatus: ContractStatus.ACTIVE,
        periodStart: new Date(Date.now() - 86_400_000),
        periodEnd: new Date(Date.now() + 86_400_000),
        resolvedBody: { header: {}, blocks: [], footer: {} },
      });

      const invoice = await service.createInvoice(
        organization.id,
        {
          organizationUnitId: null,
          volunteerId: volunteer.id,
          reimbursementTypeId: reimbursementType.id,
          timeEntryIds: [timeEntry.id],
          periodStart: new Date('2026-07-01T00:00:00.000Z'),
          periodEnd: new Date('2026-07-31T00:00:00.000Z'),
        },
        supervisor.id,
      );

      expect(invoice.isNonCompliant).toBe(false);
    });

    it('claims the time entry so it cannot be pulled into a second invoice', async () => {
      const {
        organization,
        reimbursementType,
        volunteer,
        supervisor,
        timeEntry,
      } = await setup();

      await service.createInvoice(
        organization.id,
        {
          organizationUnitId: null,
          volunteerId: volunteer.id,
          reimbursementTypeId: reimbursementType.id,
          timeEntryIds: [timeEntry.id],
          periodStart: new Date('2026-07-01T00:00:00.000Z'),
          periodEnd: new Date('2026-07-31T00:00:00.000Z'),
        },
        supervisor.id,
      );

      await expect(
        service.createInvoice(
          organization.id,
          {
            organizationUnitId: null,
            volunteerId: volunteer.id,
            reimbursementTypeId: reimbursementType.id,
            timeEntryIds: [timeEntry.id],
            periodStart: new Date('2026-07-01T00:00:00.000Z'),
            periodEnd: new Date('2026-07-31T00:00:00.000Z'),
          },
          supervisor.id,
        ),
      ).rejects.toBeInstanceOf(ConflictGraphQLError);
    });
  });

  describe('signInvoice', () => {
    it('marks claimed time entries as paid once the invoice reaches READY', async () => {
      const {
        organization,
        reimbursementType,
        volunteer,
        supervisor,
        timeEntry,
      } = await setup();
      const invoice = await service.createInvoice(
        organization.id,
        {
          organizationUnitId: null,
          volunteerId: volunteer.id,
          reimbursementTypeId: reimbursementType.id,
          timeEntryIds: [timeEntry.id],
          periodStart: new Date('2026-07-01T00:00:00.000Z'),
          periodEnd: new Date('2026-07-31T00:00:00.000Z'),
        },
        supervisor.id,
      );

      const afterVolunteer = await service.signInvoice(
        invoice.id,
        volunteer.id,
      );
      expect(afterVolunteer.invoiceStatus).toBe(
        InvoiceStatus.AWAITING_SUPERVISOR_SIGNATURE,
      );

      const beforeReady = await db.query.timeEntries.findFirst({
        where: { id: timeEntry.id },
      });
      expect(beforeReady?.isPaid).toBe(false);

      const afterSupervisor = await service.signInvoice(
        invoice.id,
        supervisor.id,
      );
      expect(afterSupervisor.invoiceStatus).toBe(InvoiceStatus.READY);

      const afterReady = await db.query.timeEntries.findFirst({
        where: { id: timeEntry.id },
      });
      expect(afterReady?.isPaid).toBe(true);

      const statusChanges = await service.findInvoiceStatusChanges(invoice.id);
      expect(statusChanges.map((e) => e.type)).toEqual([
        DocumentStatusChange.CREATED,
        DocumentStatusChange.SIGNED,
        DocumentStatusChange.COUNTERSIGNED,
        DocumentStatusChange.ACTIVATED,
      ]);
    });
  });

  describe('declineInvoice', () => {
    it('records the decline reason and leaves the time entry claimed', async () => {
      const {
        organization,
        reimbursementType,
        volunteer,
        supervisor,
        timeEntry,
      } = await setup();
      const invoice = await service.createInvoice(
        organization.id,
        {
          organizationUnitId: null,
          volunteerId: volunteer.id,
          reimbursementTypeId: reimbursementType.id,
          timeEntryIds: [timeEntry.id],
          periodStart: new Date('2026-07-01T00:00:00.000Z'),
          periodEnd: new Date('2026-07-31T00:00:00.000Z'),
        },
        supervisor.id,
      );

      const declined = await service.declineInvoice(
        invoice.id,
        volunteer.id,
        'Wrong hours',
      );

      expect(declined.invoiceStatus).toBe(InvoiceStatus.DECLINED);
      expect(declined.declineReason).toBe('Wrong hours');
      expect(declined.declinedAtSigneeType).toBe(SigneeType.VOLUNTEER);
    });
  });

  describe('findPendingInvoiceSignee', () => {
    it('returns the volunteer as the pending signee right after creation', async () => {
      const {
        organization,
        reimbursementType,
        volunteer,
        supervisor,
        timeEntry,
      } = await setup();
      const invoice = await service.createInvoice(
        organization.id,
        {
          organizationUnitId: null,
          volunteerId: volunteer.id,
          reimbursementTypeId: reimbursementType.id,
          timeEntryIds: [timeEntry.id],
          periodStart: new Date('2026-07-01T00:00:00.000Z'),
          periodEnd: new Date('2026-07-31T00:00:00.000Z'),
        },
        supervisor.id,
      );

      const pending = await service.findPendingInvoiceSignee(invoice.id);
      expect(pending).toEqual({
        signeeType: SigneeType.VOLUNTEER,
        userId: volunteer.id,
      });
    });

    it('returns null once the invoice is fully signed', async () => {
      const {
        organization,
        reimbursementType,
        volunteer,
        supervisor,
        timeEntry,
      } = await setup();
      const invoice = await service.createInvoice(
        organization.id,
        {
          organizationUnitId: null,
          volunteerId: volunteer.id,
          reimbursementTypeId: reimbursementType.id,
          timeEntryIds: [timeEntry.id],
          periodStart: new Date('2026-07-01T00:00:00.000Z'),
          periodEnd: new Date('2026-07-31T00:00:00.000Z'),
        },
        supervisor.id,
      );
      await service.signInvoice(invoice.id, volunteer.id);
      await service.signInvoice(invoice.id, supervisor.id);

      const pending = await service.findPendingInvoiceSignee(invoice.id);
      expect(pending).toBeNull();
    });
  });
});

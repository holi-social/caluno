import { beforeAll, beforeEach, describe, expect, it, mock } from 'bun:test';
import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import {
  ContractStatus,
  DocumentKind,
  SigneeType,
} from '../src/accounting/enums';
import { TimeEntryClosedListener } from '../src/accounting/listeners/time-entry-closed.listener';
import { ContractService } from '../src/accounting/services/contract.service';
import type { DocumentNotificationService } from '../src/accounting/services/document-notification.service';
import type { DocumentProfileRequirementService } from '../src/accounting/services/document-profile-requirement.service';
import type { DocumentRenderingService } from '../src/accounting/services/document-rendering.service';
import { DocumentSigningService } from '../src/accounting/services/document-signing.service';
import { DocumentTemplateService } from '../src/accounting/services/document-template.service';
import { AuthService } from '../src/auth/auth.service';
import { type Database, DatabaseModule } from '../src/database/database.module';
import { DATABASE_CONNECTION } from '../src/database/database-connection';
import { NotFoundGraphQLError } from '../src/graphql/errors';
import type { MembershipService } from '../src/membership/membership.service';
import type { NotificationService } from '../src/notification';
import type { OrganizationMapper } from '../src/organization/mappers/organization.mapper';
import { OrganizationService } from '../src/organization/organization.service';
import type { OrganizationUnitService } from '../src/organization/organization-unit.service';
import { OrganizationUnitDataService } from '../src/organization/organization-unit-data.service';
import type { ObservabilityService } from '../src/shared/observability/observability.service';
import type { PostHogService } from '../src/shared/observability/posthog.service';
import type { FileService } from '../src/storage/services/file.service';
import {
  createCompletedTimeEntry,
  createReimbursementType,
  createTwoStepTemplate,
} from './factories/accounting.factory';
import {
  createOrganizationWithType,
  createUnit,
} from './factories/org.factory';
import { createPermission } from './factories/role.factory';
import { createUser } from './factories/user.factory';
import {
  ensureTestDatabase,
  registerTestResourceCleanup,
} from './helpers/ensure-test-database';

describe('TimeEntryClosedListener', () => {
  let moduleRef: TestingModule;
  let db: Database;
  let listener: TimeEntryClosedListener;
  let organizationUnitDataService: OrganizationUnitDataService;
  let contractService: ContractService;
  const captureException = mock(() => {});
  const observability = {
    captureException,
  } as unknown as ObservabilityService;

  beforeEach(() => {
    captureException.mockClear();
  });

  beforeAll(async () => {
    await ensureTestDatabase();
    moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule],
    }).compile();
    db = moduleRef.get<Database>(DATABASE_CONNECTION);

    const postHog = { capture: () => {} } as unknown as PostHogService;
    organizationUnitDataService = new OrganizationUnitDataService(db);
    const authService = new AuthService(
      db,
      organizationUnitDataService,
      postHog,
    );
    const organizationService = new OrganizationService(
      db,
      {} as OrganizationMapper,
      {} as MembershipService,
      {} as OrganizationUnitService,
      {} as NotificationService,
      {} as FileService,
      postHog,
    );
    const documentTemplateService = new DocumentTemplateService(db, postHog, {
      missingOrgProfileSources: () => Promise.resolve([]),
    } as unknown as DocumentProfileRequirementService);
    contractService = new ContractService(
      db,
      documentTemplateService,
      new DocumentSigningService(db, authService, organizationService),
      {
        notifyAwaitingVolunteerSignature: () => Promise.resolve(),
      } as unknown as DocumentNotificationService,
      {
        missingProfileSources: () => Promise.resolve([]),
        missingOrgProfileSources: () => Promise.resolve([]),
      } as unknown as DocumentProfileRequirementService,
      {
        renderAndAttachPdf: () => Promise.resolve(null),
      } as unknown as DocumentRenderingService,
      postHog,
    );
    listener = new TimeEntryClosedListener(
      db,
      contractService,
      organizationUnitDataService,
      observability,
    );

    registerTestResourceCleanup(async () => {
      await moduleRef.close();
    });
  });

  const setup = async () => {
    const reimbursementType = await createReimbursementType(db);
    const { organization, type } = await createOrganizationWithType(
      db,
      `Listener Org ${crypto.randomUUID()}`,
    );
    const root = await createUnit(db, {
      organizationId: organization.id,
      typeId: type.id,
      name: 'root',
    });
    const permission = await createPermission(db, {
      key: `accounting:manage:${crypto.randomUUID()}`,
    });
    for (const kind of [DocumentKind.INVOICE, DocumentKind.CONTRACT]) {
      await createTwoStepTemplate(db, {
        organizationId: organization.id,
        reimbursementTypeId: reimbursementType.id,
        kind,
        requiredPermissionId: permission.id,
        signeeTypes: [SigneeType.VOLUNTEER, SigneeType.PERMISSION_HOLDER],
      });
    }
    const volunteer = await createUser(db);
    const closedEntry = (day: string) =>
      createCompletedTimeEntry(db, {
        organizationUnitId: root.id,
        volunteerId: volunteer.id,
        reimbursementTypeId: reimbursementType.id,
        startedAt: new Date(`${day}T09:00:00.000Z`),
        endedAt: new Date(`${day}T12:00:00.000Z`),
      });
    return { reimbursementType, volunteer, closedEntry };
  };

  it('drafts no timesheet for closed paid entries, so they add up for the month', async () => {
    const { reimbursementType, volunteer, closedEntry } = await setup();
    const entries = [
      await closedEntry('2026-07-01'),
      await closedEntry('2026-07-15'),
    ];

    for (const entry of entries) {
      await listener.handleTimeEntryClosed({ timeEntryId: entry.id });
    }

    const invoices = await db.query.invoices.findMany({
      where: { volunteerId: volunteer.id },
    });
    expect(invoices).toEqual([]);
    const claims = await db.query.invoiceTimeEntries.findMany({
      where: { timeEntryId: { in: entries.map((entry) => entry.id) } },
    });
    expect(claims).toEqual([]);

    // The first paid entry still queues the volunteer's contract, once.
    const contracts = await db.query.contracts.findMany({
      where: {
        volunteerId: volunteer.id,
        reimbursementTypeId: reimbursementType.id,
      },
    });
    expect(contracts).toHaveLength(1);
    expect(contracts[0]?.contractStatus).toBe(ContractStatus.DRAFT);
  });

  it('reports an unexpected failure to Sentry', async () => {
    const { closedEntry } = await setup();
    const entry = await closedEntry('2026-07-01');
    const failingListener = new TimeEntryClosedListener(
      db,
      {
        ensureDraftContract: () => Promise.reject(new Error('boom')),
      } as unknown as ContractService,
      organizationUnitDataService,
      observability,
    );

    await failingListener.handleTimeEntryClosed({ timeEntryId: entry.id });

    expect(captureException).toHaveBeenCalledTimes(1);
  });

  it('does not report an expected domain error to Sentry', async () => {
    const { closedEntry } = await setup();
    const entry = await closedEntry('2026-07-01');
    const failingListener = new TimeEntryClosedListener(
      db,
      {
        ensureDraftContract: () =>
          Promise.reject(new NotFoundGraphQLError('no contract template')),
      } as unknown as ContractService,
      organizationUnitDataService,
      observability,
    );

    await failingListener.handleTimeEntryClosed({ timeEntryId: entry.id });

    expect(captureException).not.toHaveBeenCalled();
  });
});

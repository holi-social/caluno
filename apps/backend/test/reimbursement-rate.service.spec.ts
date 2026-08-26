import { beforeAll, describe, expect, it } from 'bun:test';
import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { and, eq } from 'drizzle-orm';
import {
  DocumentKind,
  InvoiceStatus,
  ReimbursementTypeKey,
  SigneeType,
} from '../src/accounting/enums';
import { ReimbursementRateService } from '../src/accounting/services/reimbursement-rate.service';
import type { AuthService } from '../src/auth/auth.service';
import { type Database, DatabaseModule } from '../src/database/database.module';
import { DATABASE_CONNECTION } from '../src/database/database-connection';
import * as schema from '../src/database/schema';
import {
  BadRequestGraphQLError,
  NotFoundGraphQLError,
} from '../src/graphql/errors';
import { MembershipService } from '../src/membership/membership.service';
import type { NotificationService } from '../src/notification';
import { OrganizationUnitDataModule } from '../src/organization/organization-unit-data.module';
import { OrganizationUnitDataService } from '../src/organization/organization-unit-data.service';
import type { RequiredFormService } from '../src/requirement-profile/services/required-form.service';
import type { RequirementProfileService } from '../src/requirement-profile/services/requirement-profile.service';
import type { PostHogCaptureService } from '../src/shared/observability/posthog.capture.service';
import {
  createDocumentTemplate,
  createReimbursementType,
} from './factories/accounting.factory';
import {
  addMembership,
  createOrganizationWithType,
  createUnit,
} from './factories/org.factory';
import { createUser } from './factories/user.factory';
import {
  ensureTestDatabase,
  registerTestResourceCleanup,
} from './helpers/ensure-test-database';

describe('ReimbursementRateService', () => {
  let moduleRef: TestingModule;
  let db: Database;
  let service: ReimbursementRateService;

  beforeAll(async () => {
    await ensureTestDatabase();
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        DatabaseModule,
        OrganizationUnitDataModule,
      ],
    }).compile();
    db = moduleRef.get<Database>(DATABASE_CONNECTION);
    const membershipService = new MembershipService(
      db,
      {} as RequirementProfileService,
      {} as AuthService,
      {} as NotificationService,
      {} as RequiredFormService,
      { shareSubmissionsWithOrgUnit: async () => {} } as never,
      { captureUserJoinedOrg: () => {} } as unknown as PostHogCaptureService,
    );
    service = new ReimbursementRateService(
      db,
      moduleRef.get(OrganizationUnitDataService),
      membershipService,
    );
    registerTestResourceCleanup(async () => {
      await moduleRef.close();
    });
  });

  /** Org + root unit, ready for a reimbursement type's rate to cascade over. */
  const setupOrgWithRootUnit = async () => {
    const { organization, type } = await createOrganizationWithType(
      db,
      `Rate Org ${crypto.randomUUID()}`,
    );
    const root = await createUnit(db, {
      organizationId: organization.id,
      typeId: type.id,
      name: 'root',
    });
    return { organization, unitType: type, root };
  };

  describe('getEffectiveRates', () => {
    it('falls back to the platform default when the org has no override', async () => {
      const reimbursementType = await createReimbursementType(db, {
        platformDefaultRateCents: 1_500,
      });
      const { organization, root } = await setupOrgWithRootUnit();

      const rates = await service.getEffectiveRates(organization.id, root.id);
      const rate = rates.find(
        (r) => r.reimbursementType.id === reimbursementType.id,
      );

      expect(rate).toMatchObject({
        hourlyRateCents: 1_500,
        isOverride: false,
        organizationUnitId: null,
      });
    });

    it('uses the org override when one is set', async () => {
      const reimbursementType = await createReimbursementType(db, {
        platformDefaultRateCents: 1_500,
      });
      const { organization, root } = await setupOrgWithRootUnit();

      await service.setReimbursementRate(
        organization.id,
        reimbursementType.id,
        2_000,
      );

      const rates = await service.getEffectiveRates(organization.id, root.id);
      const rate = rates.find(
        (r) => r.reimbursementType.id === reimbursementType.id,
      );

      expect(rate).toMatchObject({ hourlyRateCents: 2_000, isOverride: true });
    });

    it('reports isOverride and the resolved organizationUnitId', async () => {
      const reimbursementType = await createReimbursementType(db, {
        platformDefaultRateCents: 1_500,
      });
      const { organization, root } = await setupOrgWithRootUnit();

      const [platformDefault] = (
        await service.getEffectiveRates(organization.id, root.id)
      ).filter((r) => r.reimbursementType.id === reimbursementType.id);
      expect(platformDefault?.isOverride).toBe(false);
      expect(platformDefault?.organizationUnitId).toBeNull();

      await service.setReimbursementRate(
        organization.id,
        reimbursementType.id,
        2_000,
        root.id,
      );
      const [override] = (
        await service.getEffectiveRates(organization.id, root.id)
      ).filter((r) => r.reimbursementType.id === reimbursementType.id);
      expect(override?.isOverride).toBe(true);
      expect(override?.organizationUnitId).toBe(root.id);
    });
  });

  describe('cascading resolution', () => {
    it('falls back to the platform default when nothing is set', async () => {
      const { organization, root } = await setupOrgWithRootUnit();
      const type = await createReimbursementType(db, {
        platformDefaultRateCents: 1_500,
      });

      const cents = await service.getEffectiveRateCents(
        organization.id,
        root.id,
        type.id,
      );
      expect(cents).toBe(1_500);
    });

    it('uses the org-wide override when set and no unit override exists', async () => {
      const { organization, unitType, root } = await setupOrgWithRootUnit();
      const child = await createUnit(db, {
        organizationId: organization.id,
        typeId: unitType.id,
        name: 'child',
        parentId: root.id,
      });
      const type = await createReimbursementType(db, {
        platformDefaultRateCents: 1_500,
      });
      await service.setReimbursementRate(organization.id, type.id, 2_000);

      expect(
        await service.getEffectiveRateCents(organization.id, root.id, type.id),
      ).toBe(2_000);
      expect(
        await service.getEffectiveRateCents(organization.id, child.id, type.id),
      ).toBe(2_000);
    });

    it('prefers the nearest ancestor unit override over the org-wide default', async () => {
      const { organization, unitType, root } = await setupOrgWithRootUnit();
      const child = await createUnit(db, {
        organizationId: organization.id,
        typeId: unitType.id,
        name: 'child',
        parentId: root.id,
      });
      const grandchild = await createUnit(db, {
        organizationId: organization.id,
        typeId: unitType.id,
        name: 'grandchild',
        parentId: child.id,
      });
      const type = await createReimbursementType(db, {
        platformDefaultRateCents: 1_500,
      });
      await service.setReimbursementRate(organization.id, type.id, 2_000); // org-wide
      await service.setReimbursementRate(
        organization.id,
        type.id,
        3_000,
        child.id,
      ); // unit override on child

      expect(
        await service.getEffectiveRateCents(
          organization.id,
          grandchild.id,
          type.id,
        ),
      ).toBe(3_000); // inherits from child, not org-wide or platform default
      expect(
        await service.getEffectiveRateCents(organization.id, root.id, type.id),
      ).toBe(2_000); // root has no override of its own or from an ancestor, falls to org-wide
    });

    it('resolves each reimbursement type independently at the same unit', async () => {
      const { organization, root } = await setupOrgWithRootUnit();
      const ehrenamt = await createReimbursementType(db, {
        key: ReimbursementTypeKey.EHRENAMT,
        platformDefaultRateCents: 1_500,
      });
      const uebungsleiter = await createReimbursementType(db, {
        key: ReimbursementTypeKey.UEBUNGSLEITER,
        platformDefaultRateCents: 2_500,
      });
      await service.setReimbursementRate(
        organization.id,
        ehrenamt.id,
        1_800,
        root.id,
      );
      await service.setReimbursementRate(
        organization.id,
        uebungsleiter.id,
        2_800,
        root.id,
      );

      expect(
        await service.getEffectiveRateCents(
          organization.id,
          root.id,
          ehrenamt.id,
        ),
      ).toBe(1_800);
      expect(
        await service.getEffectiveRateCents(
          organization.id,
          root.id,
          uebungsleiter.id,
        ),
      ).toBe(2_800);
    });
  });

  describe('setReimbursementRate', () => {
    it('rejects a rate that is not greater than zero', async () => {
      const reimbursementType = await createReimbursementType(db);
      const { organization } = await createOrganizationWithType(
        db,
        `Invalid Rate Org ${crypto.randomUUID()}`,
      );

      await expect(
        service.setReimbursementRate(organization.id, reimbursementType.id, 0),
      ).rejects.toBeInstanceOf(BadRequestGraphQLError);
    });

    it('throws NotFoundGraphQLError for an unknown reimbursement type', async () => {
      const { organization } = await createOrganizationWithType(
        db,
        `Unknown Type Org ${crypto.randomUUID()}`,
      );

      await expect(
        service.setReimbursementRate(
          organization.id,
          crypto.randomUUID(),
          1_000,
        ),
      ).rejects.toBeInstanceOf(NotFoundGraphQLError);
    });

    it('upserts rather than duplicating a rate row for the same org and type', async () => {
      const reimbursementType = await createReimbursementType(db);
      const { organization } = await createOrganizationWithType(
        db,
        `Upsert Rate Org ${crypto.randomUUID()}`,
      );

      await service.setReimbursementRate(
        organization.id,
        reimbursementType.id,
        1_800,
      );
      await service.setReimbursementRate(
        organization.id,
        reimbursementType.id,
        2_200,
      );

      const rows = await db
        .select()
        .from(schema.reimbursementRates)
        .where(
          and(
            eq(schema.reimbursementRates.organizationId, organization.id),
            eq(
              schema.reimbursementRates.reimbursementTypeId,
              reimbursementType.id,
            ),
          ),
        );

      expect(rows).toHaveLength(1);
      expect(rows[0].hourlyRateCents).toBe(2_200);
    });

    it('upserts rather than duplicating a rate row for the same unit and type', async () => {
      const reimbursementType = await createReimbursementType(db);
      const { organization, root } = await setupOrgWithRootUnit();

      await service.setReimbursementRate(
        organization.id,
        reimbursementType.id,
        1_800,
        root.id,
      );
      await service.setReimbursementRate(
        organization.id,
        reimbursementType.id,
        2_200,
        root.id,
      );

      const rows = await db
        .select()
        .from(schema.reimbursementRates)
        .where(
          and(
            eq(schema.reimbursementRates.organizationUnitId, root.id),
            eq(
              schema.reimbursementRates.reimbursementTypeId,
              reimbursementType.id,
            ),
          ),
        );

      expect(rows).toHaveLength(1);
      expect(rows[0].hourlyRateCents).toBe(2_200);
    });

    it('keeps the org-wide row and a unit override as separate rows', async () => {
      const reimbursementType = await createReimbursementType(db);
      const { organization, root } = await setupOrgWithRootUnit();

      await service.setReimbursementRate(
        organization.id,
        reimbursementType.id,
        1_800,
      );
      await service.setReimbursementRate(
        organization.id,
        reimbursementType.id,
        2_200,
        root.id,
      );

      const rows = await db
        .select()
        .from(schema.reimbursementRates)
        .where(
          and(
            eq(schema.reimbursementRates.organizationId, organization.id),
            eq(
              schema.reimbursementRates.reimbursementTypeId,
              reimbursementType.id,
            ),
          ),
        );

      expect(rows).toHaveLength(2);
    });
  });

  describe('getYearlyUsage', () => {
    it('sums only non-declined invoices within the given year', async () => {
      const reimbursementType = await createReimbursementType(db, {
        yearlyLimitCents: 84_000,
      });
      const { organization } = await createOrganizationWithType(
        db,
        `Yearly Usage Org ${crypto.randomUUID()}`,
      );
      const volunteer = await createUser(db);
      const template = await createDocumentTemplate(db, {
        organizationId: organization.id,
        reimbursementTypeId: reimbursementType.id,
        kind: DocumentKind.INVOICE,
        signees: [{ order: 0, signeeType: SigneeType.VOLUNTEER }],
      });

      const insertInvoice = (overrides: {
        totalAmountCents: number;
        invoiceStatus: InvoiceStatus;
        periodStart: Date;
      }) =>
        db.insert(schema.invoices).values({
          documentTemplateId: template.id,
          volunteerId: volunteer.id,
          reimbursementTypeId: reimbursementType.id,
          periodStart: overrides.periodStart,
          periodEnd: overrides.periodStart,
          totalAmountCents: overrides.totalAmountCents,
          totalHours: 1,
          resolvedBody: { header: {}, blocks: [], footer: {} },
          invoiceStatus: overrides.invoiceStatus,
        });

      await insertInvoice({
        totalAmountCents: 10_000,
        invoiceStatus: InvoiceStatus.READY,
        periodStart: new Date('2026-03-01T00:00:00.000Z'),
      });
      await insertInvoice({
        totalAmountCents: 5_000,
        invoiceStatus: InvoiceStatus.DECLINED,
        periodStart: new Date('2026-06-01T00:00:00.000Z'),
      });
      await insertInvoice({
        totalAmountCents: 99_999,
        invoiceStatus: InvoiceStatus.READY,
        periodStart: new Date('2025-12-31T00:00:00.000Z'),
      });

      const usage = await service.getYearlyUsage(
        volunteer.id,
        reimbursementType.id,
        2026,
      );

      expect(usage).toEqual({
        usedCents: 10_000,
        limitCents: 84_000,
        remainingCents: 74_000,
      });
    });
  });

  describe('getRosterYearlyUsage', () => {
    it('returns usage per volunteer per reimbursement type for everyone in the unit', async () => {
      const { organization, root: unit } = await setupOrgWithRootUnit();
      const type = await createReimbursementType(db, {
        yearlyLimitCents: 84_000,
      });
      const template = await createDocumentTemplate(db, {
        organizationId: organization.id,
        reimbursementTypeId: type.id,
        kind: DocumentKind.INVOICE,
        signees: [{ order: 0, signeeType: SigneeType.VOLUNTEER }],
      });
      const volunteer = await createUser(db);
      await addMembership(db, volunteer.id, unit.id);
      await db.insert(schema.invoices).values({
        documentTemplateId: template.id,
        volunteerId: volunteer.id,
        reimbursementTypeId: type.id,
        periodStart: new Date('2026-03-01T00:00:00.000Z'),
        periodEnd: new Date('2026-03-01T00:00:00.000Z'),
        totalAmountCents: 5_000,
        totalHours: 1,
        resolvedBody: { header: {}, blocks: [], footer: {} },
        invoiceStatus: InvoiceStatus.READY,
      });

      const usage = await service.getRosterYearlyUsage(unit.id, 2026);

      expect(usage).toHaveLength(1);
      expect(usage[0]?.volunteer.id).toBe(volunteer.id);
      const typeUsage = usage[0]?.usageByType.find(
        (u) => u.reimbursementType.id === type.id,
      );
      expect(typeUsage?.usedCents).toBe(5_000);
      expect(typeUsage?.limitCents).toBe(84_000);
      expect(typeUsage?.remainingCents).toBe(79_000);
    });

    it('aggregates across multiple volunteers and multiple reimbursement types, excluding declined invoices and other units', async () => {
      const {
        organization,
        unitType,
        root: unit,
      } = await setupOrgWithRootUnit();
      const otherUnit = await createUnit(db, {
        organizationId: organization.id,
        typeId: unitType.id,
        name: 'other',
        parentId: unit.id,
      });
      const ehrenamt = await createReimbursementType(db, {
        key: ReimbursementTypeKey.EHRENAMT,
        yearlyLimitCents: 84_000,
      });
      const uebungsleiter = await createReimbursementType(db, {
        key: ReimbursementTypeKey.UEBUNGSLEITER,
        yearlyLimitCents: 300_000,
      });
      const templateEhrenamt = await createDocumentTemplate(db, {
        organizationId: organization.id,
        reimbursementTypeId: ehrenamt.id,
        kind: DocumentKind.INVOICE,
        signees: [{ order: 0, signeeType: SigneeType.VOLUNTEER }],
      });
      const templateUebungsleiter = await createDocumentTemplate(db, {
        organizationId: organization.id,
        reimbursementTypeId: uebungsleiter.id,
        kind: DocumentKind.INVOICE,
        signees: [{ order: 0, signeeType: SigneeType.VOLUNTEER }],
      });

      const volunteerA = await createUser(db);
      const volunteerB = await createUser(db);
      const outsideVolunteer = await createUser(db);
      await addMembership(db, volunteerA.id, unit.id);
      await addMembership(db, volunteerB.id, unit.id);
      await addMembership(db, outsideVolunteer.id, otherUnit.id);

      const insertInvoice = (overrides: {
        documentTemplateId: string;
        volunteerId: string;
        reimbursementTypeId: string;
        totalAmountCents: number;
        invoiceStatus: InvoiceStatus;
        periodStart: Date;
      }) =>
        db.insert(schema.invoices).values({
          documentTemplateId: overrides.documentTemplateId,
          volunteerId: overrides.volunteerId,
          reimbursementTypeId: overrides.reimbursementTypeId,
          periodStart: overrides.periodStart,
          periodEnd: overrides.periodStart,
          totalAmountCents: overrides.totalAmountCents,
          totalHours: 1,
          resolvedBody: { header: {}, blocks: [], footer: {} },
          invoiceStatus: overrides.invoiceStatus,
        });

      // volunteerA: 5_000 ehrenamt (counted) + 2_000 declined ehrenamt (excluded)
      await insertInvoice({
        documentTemplateId: templateEhrenamt.id,
        volunteerId: volunteerA.id,
        reimbursementTypeId: ehrenamt.id,
        totalAmountCents: 5_000,
        invoiceStatus: InvoiceStatus.READY,
        periodStart: new Date('2026-02-01T00:00:00.000Z'),
      });
      await insertInvoice({
        documentTemplateId: templateEhrenamt.id,
        volunteerId: volunteerA.id,
        reimbursementTypeId: ehrenamt.id,
        totalAmountCents: 2_000,
        invoiceStatus: InvoiceStatus.DECLINED,
        periodStart: new Date('2026-04-01T00:00:00.000Z'),
      });
      // volunteerA: 10_000 uebungsleiter (counted), in a different year (excluded)
      await insertInvoice({
        documentTemplateId: templateUebungsleiter.id,
        volunteerId: volunteerA.id,
        reimbursementTypeId: uebungsleiter.id,
        totalAmountCents: 10_000,
        invoiceStatus: InvoiceStatus.READY,
        periodStart: new Date('2026-06-01T00:00:00.000Z'),
      });
      await insertInvoice({
        documentTemplateId: templateUebungsleiter.id,
        volunteerId: volunteerA.id,
        reimbursementTypeId: uebungsleiter.id,
        totalAmountCents: 50_000,
        invoiceStatus: InvoiceStatus.READY,
        periodStart: new Date('2025-06-01T00:00:00.000Z'),
      });
      // volunteerB: no invoices at all — should still appear with zero usage.
      // outsideVolunteer: belongs to a different unit, must not appear.
      await insertInvoice({
        documentTemplateId: templateEhrenamt.id,
        volunteerId: outsideVolunteer.id,
        reimbursementTypeId: ehrenamt.id,
        totalAmountCents: 9_999,
        invoiceStatus: InvoiceStatus.READY,
        periodStart: new Date('2026-02-01T00:00:00.000Z'),
      });

      const usage = await service.getRosterYearlyUsage(unit.id, 2026);

      expect(usage).toHaveLength(2);
      const byVolunteerId = new Map(
        usage.map((entry) => [entry.volunteer.id, entry]),
      );

      const entryA = byVolunteerId.get(volunteerA.id);
      const aEhrenamt = entryA?.usageByType.find(
        (u) => u.reimbursementType.id === ehrenamt.id,
      );
      const aUebungsleiter = entryA?.usageByType.find(
        (u) => u.reimbursementType.id === uebungsleiter.id,
      );
      expect(aEhrenamt?.usedCents).toBe(5_000);
      expect(aEhrenamt?.remainingCents).toBe(79_000);
      expect(aUebungsleiter?.usedCents).toBe(10_000);
      expect(aUebungsleiter?.remainingCents).toBe(290_000);

      const entryB = byVolunteerId.get(volunteerB.id);
      const bEhrenamt = entryB?.usageByType.find(
        (u) => u.reimbursementType.id === ehrenamt.id,
      );
      expect(bEhrenamt?.usedCents).toBe(0);
      expect(bEhrenamt?.remainingCents).toBe(84_000);

      expect(byVolunteerId.has(outsideVolunteer.id)).toBe(false);
    });
  });

  describe('bundle download tracking', () => {
    it('returns undefined when a pair has never been downloaded', async () => {
      const type = await createReimbursementType(db);
      const status = await service.getBundleDownloadStatus(
        'nonexistent-user',
        type.id,
      );
      expect(status).toBeUndefined();
    });

    it('records a download and returns the tracking row', async () => {
      const volunteer = await createUser(db);
      const downloader = await createUser(db);
      const type = await createReimbursementType(db);

      const result = await service.recordBundleDownload(
        volunteer.id,
        type.id,
        downloader.id,
      );

      expect(result.volunteerId).toBe(volunteer.id);
      expect(result.reimbursementTypeId).toBe(type.id);
      expect(result.downloadedByUserId).toBe(downloader.id);
      expect(result.downloadedAt).toBeInstanceOf(Date);
    });

    it('upserts on a second download for the same pair rather than duplicating', async () => {
      const volunteer = await createUser(db);
      const firstDownloader = await createUser(db);
      const secondDownloader = await createUser(db);
      const type = await createReimbursementType(db);

      await service.recordBundleDownload(
        volunteer.id,
        type.id,
        firstDownloader.id,
      );
      const second = await service.recordBundleDownload(
        volunteer.id,
        type.id,
        secondDownloader.id,
      );

      expect(second.downloadedByUserId).toBe(secondDownloader.id);
      const status = await service.getBundleDownloadStatus(
        volunteer.id,
        type.id,
      );
      expect(status?.downloadedByUserId).toBe(secondDownloader.id);

      const rows = await db
        .select()
        .from(schema.reimbursementBundleDownloads)
        .where(
          and(
            eq(schema.reimbursementBundleDownloads.volunteerId, volunteer.id),
            eq(
              schema.reimbursementBundleDownloads.reimbursementTypeId,
              type.id,
            ),
          ),
        );
      expect(rows).toHaveLength(1);
    });
  });
});

import { beforeAll, describe, expect, it } from 'bun:test';
import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { and, eq } from 'drizzle-orm';
import {
  DocumentKind,
  InvoiceStatus,
  SigneeType,
} from '../src/accounting/enums';
import { ReimbursementRateService } from '../src/accounting/services/reimbursement-rate.service';
import { type Database, DatabaseModule } from '../src/database/database.module';
import { DATABASE_CONNECTION } from '../src/database/database-connection';
import * as schema from '../src/database/schema';
import {
  BadRequestGraphQLError,
  NotFoundGraphQLError,
} from '../src/graphql/errors';
import {
  createDocumentTemplate,
  createReimbursementType,
} from './factories/accounting.factory';
import { createOrganizationWithType } from './factories/org.factory';
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
      imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule],
    }).compile();
    db = moduleRef.get<Database>(DATABASE_CONNECTION);
    service = new ReimbursementRateService(db);
    registerTestResourceCleanup(async () => {
      await moduleRef.close();
    });
  });

  describe('getEffectiveRates', () => {
    it('falls back to the platform default when the org has no override', async () => {
      const reimbursementType = await createReimbursementType(db, {
        platformDefaultRateCents: 1_500,
      });
      const { organization } = await createOrganizationWithType(
        db,
        `Rate Org ${crypto.randomUUID()}`,
      );

      const rates = await service.getEffectiveRates(organization.id);
      const rate = rates.find(
        (r) => r.reimbursementType.id === reimbursementType.id,
      );

      expect(rate).toMatchObject({
        hourlyRateCents: 1_500,
        isOverride: false,
      });
    });

    it('uses the org override when one is set', async () => {
      const reimbursementType = await createReimbursementType(db, {
        platformDefaultRateCents: 1_500,
      });
      const { organization } = await createOrganizationWithType(
        db,
        `Rate Override Org ${crypto.randomUUID()}`,
      );

      await service.setReimbursementRate(
        organization.id,
        reimbursementType.id,
        2_000,
      );

      const rates = await service.getEffectiveRates(organization.id);
      const rate = rates.find(
        (r) => r.reimbursementType.id === reimbursementType.id,
      );

      expect(rate).toMatchObject({ hourlyRateCents: 2_000, isOverride: true });
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
});

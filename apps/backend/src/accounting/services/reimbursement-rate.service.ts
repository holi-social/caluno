import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { Database } from '../../database/database.module';
import { DATABASE_CONNECTION } from '../../database/database-connection';
import * as schema from '../../database/schema';
import {
  BadRequestGraphQLError,
  NotFoundGraphQLError,
} from '../../graphql/errors';
import { OrganizationUnitDataService } from '../../organization/organization-unit-data.service';
import type { EffectiveRate, YearlyUsage } from '../accounting.types';
import { InvoiceStatus } from '../enums';
import type { ReimbursementRateEntity } from '../schemas/reimbursement-rate.schema';
import type { ReimbursementTypeEntity } from '../schemas/reimbursement-type.schema';

/** Composite key for the unit-and-type override lookup map below. */
const overrideKey = (
  organizationUnitId: string | null,
  reimbursementTypeId: string,
): string => `${organizationUnitId ?? 'org'}:${reimbursementTypeId}`;

@Injectable()
export class ReimbursementRateService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
    private readonly organizationUnitDataService: OrganizationUnitDataService,
  ) {}

  async findReimbursementTypes(): Promise<ReimbursementTypeEntity[]> {
    return this.db.query.reimbursementTypes.findMany();
  }

  /**
   * Ordered [self, parent, ..., root, null] — null stands for the org-wide
   * row. When no `organizationUnitId` is given (e.g. a caller resolving a
   * rate outside any unit context), the chain is just [null] so resolution
   * falls straight through to the org-wide override or the platform default.
   */
  private async resolutionChain(
    organizationUnitId: string | null | undefined,
  ): Promise<(string | null)[]> {
    if (!organizationUnitId) {
      return [null];
    }
    const ancestorIds =
      await this.organizationUnitDataService.listInclusiveAncestorUnitIds(
        organizationUnitId,
      );
    return [...ancestorIds, null];
  }

  async getEffectiveRates(
    organizationId: string,
    organizationUnitId?: string | null,
  ): Promise<(EffectiveRate & { organizationUnitId: string | null })[]> {
    const [types, chain] = await Promise.all([
      this.db.query.reimbursementTypes.findMany(),
      this.resolutionChain(organizationUnitId),
    ]);
    const unitIds = chain.filter((id): id is string => id !== null);
    const overrides = await this.db.query.reimbursementRates.findMany({
      where: {
        organizationId,
        OR: [
          { organizationUnitId: { in: unitIds } },
          { organizationUnitId: { isNull: true } },
        ],
      },
    });
    // Keyed by unit-and-type, not unit alone — a unit can carry an override
    // for each reimbursement type independently.
    const overrideByKey = new Map(
      overrides.map((override) => [
        overrideKey(override.organizationUnitId, override.reimbursementTypeId),
        override,
      ]),
    );

    return types.map((reimbursementType) => {
      for (const unitId of chain) {
        const override = overrideByKey.get(
          overrideKey(unitId, reimbursementType.id),
        );
        if (override) {
          return {
            reimbursementType,
            hourlyRateCents: override.hourlyRateCents,
            isOverride: true,
            organizationUnitId: unitId,
          };
        }
      }
      return {
        reimbursementType,
        hourlyRateCents: reimbursementType.platformDefaultRateCents,
        isOverride: false,
        organizationUnitId: null,
      };
    });
  }

  /**
   * Upserts by hand rather than via `onConflictDoUpdate`: the org-wide row
   * and unit-override row are each guarded by their own partial unique index
   * (`organizationUnitId IS NULL` / `IS NOT NULL` respectively), and Postgres
   * can't infer either as an arbiter from a plain column-list conflict
   * target. A select-then-write inside a transaction sidesteps that; a
   * concurrent duplicate insert still fails on the unique index rather than
   * silently double-writing.
   */
  async setReimbursementRate(
    organizationId: string,
    reimbursementTypeId: string,
    hourlyRateCents: number,
    organizationUnitId?: string,
  ): Promise<ReimbursementRateEntity> {
    if (hourlyRateCents <= 0) {
      throw new BadRequestGraphQLError('Hourly rate must be greater than zero');
    }
    await this.findReimbursementTypeById(reimbursementTypeId);

    const target = organizationUnitId ?? null;

    return this.db.transaction(async (tx) => {
      const existing = await tx.query.reimbursementRates.findFirst({
        where: target
          ? { organizationUnitId: target, reimbursementTypeId }
          : {
              organizationId,
              reimbursementTypeId,
              organizationUnitId: { isNull: true },
            },
      });

      if (existing) {
        const [updated] = await tx
          .update(schema.reimbursementRates)
          .set({ hourlyRateCents })
          .where(eq(schema.reimbursementRates.id, existing.id))
          .returning();
        return updated;
      }

      const [inserted] = await tx
        .insert(schema.reimbursementRates)
        .values({
          organizationId,
          organizationUnitId: target,
          reimbursementTypeId,
          hourlyRateCents,
        })
        .returning();
      return inserted;
    });
  }

  async getYearlyUsage(
    volunteerId: string,
    reimbursementTypeId: string,
    year: number,
  ): Promise<YearlyUsage> {
    const yearStart = new Date(Date.UTC(year, 0, 1));
    const yearEnd = new Date(Date.UTC(year + 1, 0, 1));
    const reimbursementType =
      await this.findReimbursementTypeById(reimbursementTypeId);

    const invoices = await this.db.query.invoices.findMany({
      where: {
        volunteerId,
        reimbursementTypeId,
        periodStart: { gte: yearStart, lt: yearEnd },
      },
      columns: { totalAmountCents: true, invoiceStatus: true },
    });

    const usedCents = invoices
      .filter((invoice) => invoice.invoiceStatus !== InvoiceStatus.DECLINED)
      .reduce((sum, invoice) => sum + invoice.totalAmountCents, 0);
    const limitCents = reimbursementType.yearlyLimitCents;

    return { usedCents, limitCents, remainingCents: limitCents - usedCents };
  }

  async findReimbursementTypeById(
    id: string,
  ): Promise<ReimbursementTypeEntity> {
    const reimbursementType = await this.db.query.reimbursementTypes.findFirst({
      where: { id },
    });
    if (!reimbursementType) {
      throw new NotFoundGraphQLError(
        `Reimbursement type with ID ${id} not found`,
      );
    }
    return reimbursementType;
  }

  async getEffectiveRateCents(
    organizationId: string,
    organizationUnitId: string | null | undefined,
    reimbursementTypeId: string,
  ): Promise<number> {
    const rates = await this.getEffectiveRates(
      organizationId,
      organizationUnitId,
    );
    const match = rates.find(
      (rate) => rate.reimbursementType.id === reimbursementTypeId,
    );
    if (!match) {
      throw new NotFoundGraphQLError(
        `Reimbursement type with ID ${reimbursementTypeId} not found`,
      );
    }
    return match.hourlyRateCents;
  }
}

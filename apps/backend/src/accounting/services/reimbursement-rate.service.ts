import { Inject, Injectable } from '@nestjs/common';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import type { UserEntity } from '../../auth/schemas/auth.schema';
import type { Database } from '../../database/database.module';
import { DATABASE_CONNECTION } from '../../database/database-connection';
import * as schema from '../../database/schema';
import {
  BadRequestGraphQLError,
  NotFoundGraphQLError,
} from '../../graphql/errors';
import { MembershipService } from '../../membership/membership.service';
import { OrganizationUnitDataService } from '../../organization/organization-unit-data.service';
import type { EffectiveRate, YearlyUsage } from '../accounting.types';
import { InvoiceStatus } from '../enums';
import type { ReimbursementBundleDownloadEntity } from '../schemas/reimbursement-bundle-download.schema';
import type { ManualBaselineEntity } from '../schemas/reimbursement-manual-baseline.schema';
import type { ReimbursementRateEntity } from '../schemas/reimbursement-rate.schema';
import type { ReimbursementTypeEntity } from '../schemas/reimbursement-type.schema';

export interface ReimbursementTypeUsageResult {
  reimbursementType: ReimbursementTypeEntity;
  usedCents: number;
  limitCents: number;
  remainingCents: number;
}

export interface VolunteerYearlyUsageResult {
  volunteer: UserEntity;
  usageByType: ReimbursementTypeUsageResult[];
}

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
    private readonly membershipService: MembershipService,
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

    const [invoices, baseline] = await Promise.all([
      this.db.query.invoices.findMany({
        where: {
          volunteerId,
          reimbursementTypeId,
          periodStart: { gte: yearStart, lt: yearEnd },
        },
        columns: { totalAmountCents: true, invoiceStatus: true },
      }),
      this.getManualBaseline(volunteerId, reimbursementTypeId, year),
    ]);

    const usedCents =
      invoices
        .filter((invoice) => invoice.invoiceStatus !== InvoiceStatus.DECLINED)
        .reduce((sum, invoice) => sum + invoice.totalAmountCents, 0) +
      (baseline?.amountCents ?? 0);
    const limitCents = reimbursementType.yearlyLimitCents;

    return { usedCents, limitCents, remainingCents: limitCents - usedCents };
  }

  /**
   * Roster-scale version of `getYearlyUsage`: one query per volunteer would
   * be N+1 for a board view, so this fetches every member and every
   * reimbursement type once, then aggregates invoices for the whole unit in
   * a single query keyed by volunteer-and-type.
   */
  async getRosterYearlyUsage(
    organizationUnitId: string,
    year: number,
  ): Promise<VolunteerYearlyUsageResult[]> {
    const [members, types] = await Promise.all([
      this.membershipService.getMembers(organizationUnitId),
      this.db.query.reimbursementTypes.findMany(),
    ]);
    if (members.length === 0) return [];

    const yearStart = new Date(Date.UTC(year, 0, 1));
    const yearEnd = new Date(Date.UTC(year + 1, 0, 1));
    const memberIds = members.map((member) => member.id);

    const [invoices, baselines] = await Promise.all([
      this.db.query.invoices.findMany({
        where: {
          volunteerId: { in: memberIds },
          periodStart: { gte: yearStart, lt: yearEnd },
        },
        columns: {
          volunteerId: true,
          reimbursementTypeId: true,
          totalAmountCents: true,
          invoiceStatus: true,
        },
      }),
      this.db.query.reimbursementManualBaselines.findMany({
        where: { volunteerId: { in: memberIds }, year },
        columns: {
          volunteerId: true,
          reimbursementTypeId: true,
          amountCents: true,
        },
      }),
    ]);

    const usedByVolunteerAndType = new Map<string, number>();
    for (const invoice of invoices) {
      if (invoice.invoiceStatus === InvoiceStatus.DECLINED) continue;
      const key = `${invoice.volunteerId}:${invoice.reimbursementTypeId}`;
      usedByVolunteerAndType.set(
        key,
        (usedByVolunteerAndType.get(key) ?? 0) + invoice.totalAmountCents,
      );
    }
    for (const baseline of baselines) {
      const key = `${baseline.volunteerId}:${baseline.reimbursementTypeId}`;
      usedByVolunteerAndType.set(
        key,
        (usedByVolunteerAndType.get(key) ?? 0) + baseline.amountCents,
      );
    }

    return members.map((volunteer) => ({
      volunteer,
      usageByType: types.map((reimbursementType) => {
        const usedCents =
          usedByVolunteerAndType.get(
            `${volunteer.id}:${reimbursementType.id}`,
          ) ?? 0;
        const limitCents = reimbursementType.yearlyLimitCents;
        return {
          reimbursementType,
          usedCents,
          limitCents,
          remainingCents: limitCents - usedCents,
        };
      }),
    }));
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

  async getBundleDownloadStatus(
    volunteerId: string,
    reimbursementTypeId: string,
  ): Promise<ReimbursementBundleDownloadEntity | undefined> {
    return this.db.query.reimbursementBundleDownloads.findFirst({
      where: { volunteerId, reimbursementTypeId },
    });
  }

  async recordBundleDownload(
    volunteerId: string,
    reimbursementTypeId: string,
    downloadedByUserId: string,
    invoiceIds: string[] = [],
  ): Promise<ReimbursementBundleDownloadEntity> {
    return this.db.transaction(async (tx) => {
      const [row] = await tx
        .insert(schema.reimbursementBundleDownloads)
        .values({
          volunteerId,
          reimbursementTypeId,
          downloadedAt: new Date(),
          downloadedByUserId,
        })
        .onConflictDoUpdate({
          target: [
            schema.reimbursementBundleDownloads.volunteerId,
            schema.reimbursementBundleDownloads.reimbursementTypeId,
          ],
          set: { downloadedAt: new Date(), downloadedByUserId },
        })
        .returning();

      if (invoiceIds.length > 0) {
        await tx
          .update(schema.invoices)
          .set({ paidAt: new Date(), paidByUserId: downloadedByUserId })
          .where(
            and(
              inArray(schema.invoices.id, invoiceIds),
              eq(schema.invoices.volunteerId, volunteerId),
              eq(schema.invoices.reimbursementTypeId, reimbursementTypeId),
              eq(schema.invoices.invoiceStatus, InvoiceStatus.READY),
              isNull(schema.invoices.paidAt),
            ),
          );
      }

      return row;
    });
  }

  async getManualBaseline(
    volunteerId: string,
    reimbursementTypeId: string,
    year: number,
  ): Promise<ManualBaselineEntity | undefined> {
    return this.db.query.reimbursementManualBaselines.findFirst({
      where: { volunteerId, reimbursementTypeId, year },
    });
  }

  async setManualBaseline(
    organizationId: string,
    volunteerId: string,
    reimbursementTypeId: string,
    year: number,
    amountCents: number,
    updatedByUserId: string,
  ): Promise<ManualBaselineEntity> {
    if (amountCents < 0) {
      throw new BadRequestGraphQLError('Amount must not be negative');
    }
    await this.findReimbursementTypeById(reimbursementTypeId);

    const [row] = await this.db
      .insert(schema.reimbursementManualBaselines)
      .values({
        organizationId,
        volunteerId,
        reimbursementTypeId,
        year,
        amountCents,
        updatedByUserId,
      })
      .onConflictDoUpdate({
        target: [
          schema.reimbursementManualBaselines.volunteerId,
          schema.reimbursementManualBaselines.reimbursementTypeId,
          schema.reimbursementManualBaselines.year,
        ],
        set: { amountCents, updatedByUserId },
      })
      .returning();

    return row;
  }
}

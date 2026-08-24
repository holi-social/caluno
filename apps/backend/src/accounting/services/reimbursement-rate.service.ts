import { Inject, Injectable } from '@nestjs/common';
import type { Database } from '../../database/database.module';
import { DATABASE_CONNECTION } from '../../database/database-connection';
import * as schema from '../../database/schema';
import {
  BadRequestGraphQLError,
  NotFoundGraphQLError,
} from '../../graphql/errors';
import {
  POSTHOG_EVENT,
  POSTHOG_SURFACE,
} from '../../shared/observability/posthog.events';
import { PostHogService } from '../../shared/observability/posthog.service';
import type { EffectiveRate, YearlyUsage } from '../accounting.types';
import { InvoiceStatus } from '../enums';
import type { ReimbursementRateEntity } from '../schemas/reimbursement-rate.schema';
import type { ReimbursementTypeEntity } from '../schemas/reimbursement-type.schema';

@Injectable()
export class ReimbursementRateService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
    private readonly postHogService: PostHogService,
  ) {}

  async findReimbursementTypes(): Promise<ReimbursementTypeEntity[]> {
    return this.db.query.reimbursementTypes.findMany();
  }

  async getEffectiveRates(organizationId: string): Promise<EffectiveRate[]> {
    const [types, overrides] = await Promise.all([
      this.db.query.reimbursementTypes.findMany(),
      this.db.query.reimbursementRates.findMany({ where: { organizationId } }),
    ]);
    const overrideByTypeId = new Map(
      overrides.map((override) => [override.reimbursementTypeId, override]),
    );

    return types.map((reimbursementType) => {
      const override = overrideByTypeId.get(reimbursementType.id);
      return {
        reimbursementType,
        hourlyRateCents:
          override?.hourlyRateCents ??
          reimbursementType.platformDefaultRateCents,
        isOverride: Boolean(override),
      };
    });
  }

  async setReimbursementRate(
    organizationId: string,
    reimbursementTypeId: string,
    hourlyRateCents: number,
    userId: string,
  ): Promise<ReimbursementRateEntity> {
    if (hourlyRateCents <= 0) {
      throw new BadRequestGraphQLError('Hourly rate must be greater than zero');
    }
    await this.findReimbursementTypeById(reimbursementTypeId);

    const [rate] = await this.db
      .insert(schema.reimbursementRates)
      .values({ organizationId, reimbursementTypeId, hourlyRateCents })
      .onConflictDoUpdate({
        target: [
          schema.reimbursementRates.organizationId,
          schema.reimbursementRates.reimbursementTypeId,
        ],
        set: { hourlyRateCents },
      })
      .returning();

    this.postHogService.capture({
      event: POSTHOG_EVENT.REIMBURSEMENT_RATE_UPDATE,
      userId,
      properties: {
        surface: POSTHOG_SURFACE.BACKOFFICE,
        organization_id: organizationId,
      },
    });

    return rate;
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
    reimbursementTypeId: string,
  ): Promise<number> {
    const [override, reimbursementType] = await Promise.all([
      this.db.query.reimbursementRates.findFirst({
        where: { organizationId, reimbursementTypeId },
      }),
      this.findReimbursementTypeById(reimbursementTypeId),
    ]);
    return (
      override?.hourlyRateCents ?? reimbursementType.platformDefaultRateCents
    );
  }
}

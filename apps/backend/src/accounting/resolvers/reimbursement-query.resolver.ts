import { Args, Context, ID, Int, Query, Resolver } from '@nestjs/graphql';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { OrganizationUnitService } from '../../organization/organization-unit.service';
import { UserMapper } from '../../user/mappers/user.mapper';
import { ReimbursementTypeMapper } from '../mappers';
import { EffectiveRate } from '../models/effective-rate.model';
import { ReimbursementType } from '../models/reimbursement-type.model';
import { VolunteerYearlyUsage } from '../models/volunteer-yearly-usage.model';
import { YearlyUsage } from '../models/yearly-usage.model';
import { ReimbursementRateService } from '../services';

@Resolver(() => ReimbursementType)
export class ReimbursementQueryResolver {
  constructor(
    private readonly reimbursementRateService: ReimbursementRateService,
    private readonly reimbursementTypeMapper: ReimbursementTypeMapper,
    private readonly organizationUnitService: OrganizationUnitService,
    private readonly userMapper: UserMapper,
  ) {}

  @Query(() => [ReimbursementType])
  async reimbursementTypes(): Promise<ReimbursementType[]> {
    const types = await this.reimbursementRateService.findReimbursementTypes();
    return this.reimbursementTypeMapper.toArray(types);
  }

  @Permissions(PERMISSIONS.ACCOUNTING_MANAGE)
  @Query(() => [EffectiveRate])
  async effectiveRates(
    @Args('organizationUnitId', { type: () => ID, nullable: true })
    organizationUnitId: string | null | undefined,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<EffectiveRate[]> {
    const targetUnitId = organizationUnitId ?? context.organizationUnitId;
    const organizationId =
      await this.organizationUnitService.findOrganizationIdByUnitId(
        targetUnitId,
      );
    if (!organizationId) {
      return [];
    }

    const rates = await this.reimbursementRateService.getEffectiveRates(
      organizationId,
      targetUnitId,
    );
    return rates.map((rate) => ({
      reimbursementType: this.reimbursementTypeMapper.toModelOrThrow(
        rate.reimbursementType,
      ),
      hourlyRateCents: rate.hourlyRateCents,
      isOverride: rate.isOverride,
      organizationUnitId: rate.organizationUnitId,
    }));
  }

  @Query(() => YearlyUsage)
  async yearlyUsage(
    @Args('reimbursementTypeId', { type: () => ID })
    reimbursementTypeId: string,
    @Args('year', { type: () => Int }) year: number,
    @Session() session: UserSession,
  ): Promise<YearlyUsage> {
    return this.reimbursementRateService.getYearlyUsage(
      session.user.id,
      reimbursementTypeId,
      year,
    );
  }

  @Permissions(PERMISSIONS.ACCOUNTING_MANAGE)
  @Query(() => [VolunteerYearlyUsage])
  async rosterYearlyUsage(
    @Args('organizationUnitId', { type: () => ID }) organizationUnitId: string,
    @Args('year', { type: () => Int }) year: number,
  ): Promise<VolunteerYearlyUsage[]> {
    const usage = await this.reimbursementRateService.getRosterYearlyUsage(
      organizationUnitId,
      year,
    );
    return usage.map((entry) => ({
      volunteer: this.userMapper.toModelOrThrow(entry.volunteer),
      usageByType: entry.usageByType.map((typeUsage) => ({
        reimbursementType: this.reimbursementTypeMapper.toModelOrThrow(
          typeUsage.reimbursementType,
        ),
        usedCents: typeUsage.usedCents,
        limitCents: typeUsage.limitCents,
        remainingCents: typeUsage.remainingCents,
      })),
    }));
  }
}

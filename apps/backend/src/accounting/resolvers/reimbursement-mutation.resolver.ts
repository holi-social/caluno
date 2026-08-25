import { Args, Context, ID, Int, Mutation, Resolver } from '@nestjs/graphql';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { NotFoundGraphQLError } from '../../graphql/errors';
import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { OrganizationUnitService } from '../../organization/organization-unit.service';
import { ReimbursementRateMapper } from '../mappers';
import { ReimbursementRate } from '../models/reimbursement-rate.model';
import { ReimbursementRateService } from '../services';

@Resolver(() => ReimbursementRate)
export class ReimbursementMutationResolver {
  constructor(
    private readonly reimbursementRateService: ReimbursementRateService,
    private readonly reimbursementRateMapper: ReimbursementRateMapper,
    private readonly organizationUnitService: OrganizationUnitService,
  ) {}

  @Permissions(PERMISSIONS.ACCOUNTING_MANAGE)
  @Mutation(() => ReimbursementRate)
  async setReimbursementRate(
    @Args('reimbursementTypeId', { type: () => ID })
    reimbursementTypeId: string,
    @Args('hourlyRateCents', { type: () => Int }) hourlyRateCents: number,
    @Args('organizationUnitId', { type: () => ID, nullable: true })
    organizationUnitId: string | null | undefined,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<ReimbursementRate> {
    const organizationId =
      await this.organizationUnitService.findOrganizationIdByUnitId(
        context.organizationUnitId,
      );
    if (!organizationId) {
      throw new NotFoundGraphQLError('Organization not found');
    }
    if (
      organizationUnitId &&
      organizationUnitId !== context.organizationUnitId
    ) {
      const ancestorIds =
        await this.organizationUnitService.listInclusiveAncestorUnitIds(
          organizationUnitId,
        );
      if (!ancestorIds.includes(context.organizationUnitId)) {
        throw new NotFoundGraphQLError('Organization unit not found');
      }
    }

    const rate = await this.reimbursementRateService.setReimbursementRate(
      organizationId,
      reimbursementTypeId,
      hourlyRateCents,
      organizationUnitId ?? undefined,
    );
    return this.reimbursementRateMapper.toModelOrThrow(rate);
  }
}

import { Args, Context, ID, Int, Query, Resolver } from '@nestjs/graphql';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { NotFoundGraphQLError } from '../../graphql/errors';
import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { VolunteerInviteAllowance } from '../models/invite-allowance.model';
import {
  AccountingOrgAccessService,
  InviteAllowanceEligibilityService,
} from '../services';

@Resolver(() => VolunteerInviteAllowance)
export class InviteAllowanceQueryResolver {
  constructor(
    private readonly accountingOrgAccessService: AccountingOrgAccessService,
    private readonly inviteAllowanceEligibilityService: InviteAllowanceEligibilityService,
  ) {}

  /**
   * One allowance state per member of `organizationUnitId`, for inviting
   * them to a paid shift lasting `shiftDurationMinutes` at
   * `reimbursementTypeId`. Only called for paid shifts — the frontend simply
   * doesn't query this (and shows no states) for an unpaid one.
   *
   * Status signals only: never returns or implies a euro amount.
   */
  @Permissions(PERMISSIONS.ACCOUNTING_MANAGE)
  @Query(() => [VolunteerInviteAllowance])
  async inviteAllowanceEligibility(
    @Args('organizationUnitId', { type: () => ID })
    organizationUnitId: string,
    @Args('reimbursementTypeId', { type: () => ID })
    reimbursementTypeId: string,
    @Args('shiftDurationMinutes', { type: () => Int })
    shiftDurationMinutes: number,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<VolunteerInviteAllowance[]> {
    // Scoped to the caller's own unit, same as inviting itself: the invite
    // list's available members already only ever come from this unit.
    if (organizationUnitId !== context.organizationUnitId) {
      throw new NotFoundGraphQLError('Organization unit not found');
    }

    const organizationId =
      await this.accountingOrgAccessService.resolveEnabledOrganizationId(
        organizationUnitId,
      );

    return this.inviteAllowanceEligibilityService.getInviteAllowanceStates({
      organizationId,
      organizationUnitId,
      reimbursementTypeId,
      shiftDurationMinutes,
    });
  }
}

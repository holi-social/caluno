import { Context, Query, Resolver } from '@nestjs/graphql';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { AccountingSetupStatus } from '../models/accounting-setup-status.model';
import { AccountingOrgAccessService, AccountingSetupService } from '../services';

@Resolver(() => AccountingSetupStatus)
export class AccountingSetupQueryResolver {
  constructor(
    private readonly accountingSetupService: AccountingSetupService,
    private readonly accountingOrgAccessService: AccountingOrgAccessService,
  ) {}

  @Permissions(PERMISSIONS.ACCOUNTING_MANAGE)
  @Query(() => AccountingSetupStatus)
  async accountingSetupStatus(
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<AccountingSetupStatus> {
    const organizationId =
      await this.accountingOrgAccessService.resolveEnabledOrganizationId(
        context.organizationUnitId,
      );
    return this.accountingSetupService.getSetupStatus(
      organizationId,
      context.organizationUnitId,
    );
  }
}

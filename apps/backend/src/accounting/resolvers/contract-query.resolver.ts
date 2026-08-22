import { Args, Context, ID, Query, Resolver } from '@nestjs/graphql';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { AuthService } from '../../auth/auth.service';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import {
  ForbiddenGraphQLError,
  NotFoundGraphQLError,
} from '../../graphql/errors';
import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { OrganizationUnitService } from '../../organization/organization-unit.service';
import type { ContractFilter } from '../accounting.types';
import { ContractFilterInput } from '../inputs/contract-filter.input';
import { ContractMapper } from '../mappers';
import { Contract } from '../models/contract.model';
import { PendingSignee } from '../models/pending-signee.model';
import { ContractService } from '../services';

function toContractFilter(
  filter: ContractFilterInput | null | undefined,
): ContractFilter {
  return {
    volunteerId: filter?.volunteerId ?? undefined,
    reimbursementTypeId: filter?.reimbursementTypeId ?? undefined,
    status: filter?.status ?? undefined,
  };
}

@Resolver(() => Contract)
export class ContractQueryResolver {
  constructor(
    private readonly contractService: ContractService,
    private readonly contractMapper: ContractMapper,
    private readonly authService: AuthService,
    private readonly organizationUnitService: OrganizationUnitService,
  ) {}

  @Query(() => Contract)
  async contract(
    @Args('id', { type: () => ID }) id: string,
    @Session() session: UserSession,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<Contract> {
    const contract = await this.contractService.findContract(id);
    await this.assertCanViewDocument(contract.volunteerId, session, context);
    return this.contractMapper.toModelOrThrow(contract);
  }

  @Permissions(PERMISSIONS.ACCOUNTING_MANAGE)
  @Query(() => [Contract])
  async contracts(
    @Args('filter', { type: () => ContractFilterInput, nullable: true })
    filter: ContractFilterInput | null | undefined,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<Contract[]> {
    const organizationId = await this.resolveOrganizationId(context);
    const contracts = await this.contractService.findContractsForOrganization(
      organizationId,
      toContractFilter(filter),
    );
    return this.contractMapper.toArray(contracts);
  }

  @Query(() => [Contract])
  async myContracts(
    @Args('filter', { type: () => ContractFilterInput, nullable: true })
    filter: ContractFilterInput | null | undefined,
    @Session() session: UserSession,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<Contract[]> {
    const organizationId = await this.resolveOrganizationId(context);
    const contracts = await this.contractService.findContractsForOrganization(
      organizationId,
      { ...toContractFilter(filter), volunteerId: session.user.id },
    );
    return this.contractMapper.toArray(contracts);
  }

  @Query(() => PendingSignee, { nullable: true })
  async pendingContractSignee(
    @Args('contractId', { type: () => ID }) contractId: string,
    @Session() session: UserSession,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<PendingSignee | null> {
    const contract = await this.contractService.findContract(contractId);
    await this.assertCanViewDocument(contract.volunteerId, session, context);
    return this.contractService.findPendingContractSignee(contractId);
  }

  private async assertCanViewDocument(
    volunteerId: string,
    session: UserSession,
    context: AuthenticatedGraphQLContext,
  ): Promise<void> {
    if (session.user.id === volunteerId) {
      return;
    }
    const hasPermission = await this.authService.hasRequiredPermissions(
      session.user.id,
      context.organizationUnitId,
      [PERMISSIONS.ACCOUNTING_MANAGE],
    );
    if (!hasPermission) {
      throw new ForbiddenGraphQLError(
        'You do not have permission to view this document',
      );
    }
  }

  private async resolveOrganizationId(
    context: AuthenticatedGraphQLContext,
  ): Promise<string> {
    const organizationId =
      await this.organizationUnitService.findOrganizationIdByUnitId(
        context.organizationUnitId,
      );
    if (!organizationId) {
      throw new NotFoundGraphQLError('Organization not found');
    }
    return organizationId;
  }
}

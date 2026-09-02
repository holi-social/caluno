import { Args, Context, ID, Mutation, Resolver } from '@nestjs/graphql';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { CreateContractInput } from '../inputs/create-contract.input';
import { ContractMapper } from '../mappers';
import { Contract } from '../models/contract.model';
import { AccountingOrgAccessService, ContractService } from '../services';

@Resolver(() => Contract)
export class ContractMutationResolver {
  constructor(
    private readonly contractService: ContractService,
    private readonly contractMapper: ContractMapper,
    private readonly accountingOrgAccessService: AccountingOrgAccessService,
  ) {}

  @Permissions(PERMISSIONS.ACCOUNTING_MANAGE)
  @Mutation(() => Contract)
  async createContract(
    @Args('input') input: CreateContractInput,
    @Session() session: UserSession,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<Contract> {
    const organizationId =
      await this.accountingOrgAccessService.resolveEnabledOrganizationId(
        context.organizationUnitId,
      );

    const contract = await this.contractService.createContract(
      organizationId,
      {
        ...input,
        organizationUnitId:
          input.organizationUnitId ?? context.organizationUnitId,
      },
      session.user.id,
    );
    return this.contractMapper.toModelOrThrow(contract);
  }

  @Mutation(() => Contract)
  async signContract(
    @Args('contractId', { type: () => ID }) contractId: string,
    @Session() session: UserSession,
  ): Promise<Contract> {
    const contract = await this.contractService.signContract(
      contractId,
      session.user.id,
    );
    return this.contractMapper.toModelOrThrow(contract);
  }

  @Mutation(() => Contract)
  async declineContract(
    @Args('contractId', { type: () => ID }) contractId: string,
    @Args('reason') reason: string,
    @Session() session: UserSession,
  ): Promise<Contract> {
    const contract = await this.contractService.declineContract(
      contractId,
      session.user.id,
      reason,
    );
    return this.contractMapper.toModelOrThrow(contract);
  }
}

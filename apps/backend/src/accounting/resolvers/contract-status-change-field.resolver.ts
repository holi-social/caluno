import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Loader } from '../../graphql/decorators/loader.decorator';
import { User } from '../../user/models/user.model';
import { ContractStatusChange } from '../models/contract-status-change.model';
import type { ContractStatusChangeEntity } from '../schemas/contract-status-change.schema';
import { AccountingUserLoader } from './accounting-user.loader';

@Resolver(() => ContractStatusChange)
export class ContractStatusChangeFieldResolver {
  @ResolveField(() => User, { nullable: true })
  async actorUser(
    @Parent() statusChange: ContractStatusChangeEntity,
    @Loader(AccountingUserLoader) loader: AccountingUserLoader,
  ): Promise<User | null> {
    if (!statusChange.actorUserId) {
      return null;
    }
    return loader.userById.load(statusChange.actorUserId);
  }
}

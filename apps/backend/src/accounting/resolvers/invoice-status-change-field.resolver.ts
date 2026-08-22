import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Loader } from '../../graphql/decorators/loader.decorator';
import { User } from '../../user/models/user.model';
import { InvoiceStatusChange } from '../models/invoice-status-change.model';
import type { InvoiceStatusChangeEntity } from '../schemas/invoice-status-change.schema';
import { AccountingUserLoader } from './accounting-user.loader';

@Resolver(() => InvoiceStatusChange)
export class InvoiceStatusChangeFieldResolver {
  @ResolveField(() => User, { nullable: true })
  async actorUser(
    @Parent() statusChange: InvoiceStatusChangeEntity,
    @Loader(AccountingUserLoader) loader: AccountingUserLoader,
  ): Promise<User | null> {
    if (!statusChange.actorUserId) {
      return null;
    }
    return loader.userById.load(statusChange.actorUserId);
  }
}

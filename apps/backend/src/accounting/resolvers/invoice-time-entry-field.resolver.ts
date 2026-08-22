import { Context, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Loader } from '../../graphql/decorators/loader.decorator';
import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { TimeEntry } from '../../time-tracking/models/time-entry.model';
import { InvoiceTimeEntry } from '../models/invoice-time-entry.model';
import type { InvoiceTimeEntryEntity } from '../schemas/invoice-time-entry.schema';
import { AccountingReferenceLoader } from './accounting-reference.loader';

@Resolver(() => InvoiceTimeEntry)
export class InvoiceTimeEntryFieldResolver {
  @ResolveField(() => TimeEntry)
  async timeEntry(
    @Parent() invoiceTimeEntry: InvoiceTimeEntryEntity,
    @Loader(AccountingReferenceLoader) loader: AccountingReferenceLoader,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<TimeEntry> {
    return loader.timeEntryById.load({
      id: invoiceTimeEntry.timeEntryId,
      organizationUnitId: context.organizationUnitId,
    });
  }
}

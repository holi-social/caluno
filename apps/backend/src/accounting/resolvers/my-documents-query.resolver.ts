import { Query, Resolver } from '@nestjs/graphql';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { ContractMapper, InvoiceMapper } from '../mappers';
import { MyDocumentSummary } from '../models/my-document-summary.model';
import { MyDocumentsGroup } from '../models/my-documents-group.model';
import { VolunteerDocumentsService } from '../services';

/**
 * The volunteer's cross-org document views: the "My documents" page data
 * (grouped by organization) and the action-needed badge count. Both resolve
 * the user's organizations server-side, so they are not bound to the
 * `x-organization-unit-id` header.
 */
@Resolver()
export class MyDocumentsQueryResolver {
  constructor(
    private readonly volunteerDocumentsService: VolunteerDocumentsService,
    private readonly contractMapper: ContractMapper,
    private readonly invoiceMapper: InvoiceMapper,
  ) {}

  @Query(() => [MyDocumentsGroup])
  async myDocuments(
    @Session() session: UserSession,
  ): Promise<MyDocumentsGroup[]> {
    const groups = await this.volunteerDocumentsService.findMyDocumentsGroups(
      session.user.id,
    );
    return groups.map((group) => ({
      ...group,
      contracts: this.contractMapper.toArray(group.contracts),
      invoices: this.invoiceMapper.toArray(group.invoices),
    }));
  }

  @Query(() => MyDocumentSummary)
  async myDocumentSummary(
    @Session() session: UserSession,
  ): Promise<MyDocumentSummary> {
    return this.volunteerDocumentsService.getMyDocumentSummary(session.user.id);
  }
}

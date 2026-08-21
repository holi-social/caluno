import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Loader } from '../../graphql/decorators/loader.decorator';
import { NotFoundGraphQLError } from '../../graphql/errors';
import { User } from '../../user/models/user.model';
import {
  DocumentTemplateMapper,
  InvoiceSignatureMapper,
  InvoiceStatusChangeMapper,
  InvoiceTimeEntryMapper,
  ReimbursementTypeMapper,
} from '../mappers';
import { DocumentTemplate } from '../models/document-template.model';
import { Invoice } from '../models/invoice.model';
import { InvoiceSignature } from '../models/invoice-signature.model';
import { InvoiceStatusChange } from '../models/invoice-status-change.model';
import { InvoiceTimeEntry } from '../models/invoice-time-entry.model';
import { ReimbursementType } from '../models/reimbursement-type.model';
import type { DocumentTemplateEntity } from '../schemas/document-template.schema';
import type { InvoiceEntity } from '../schemas/invoice.schema';
import type { InvoiceSignatureEntity } from '../schemas/invoice-signature.schema';
import type { InvoiceStatusChangeEntity } from '../schemas/invoice-status-change.schema';
import type { InvoiceTimeEntryEntity } from '../schemas/invoice-time-entry.schema';
import type { ReimbursementTypeEntity } from '../schemas/reimbursement-type.schema';
import { AccountingUserLoader } from './accounting-user.loader';
import { InvoiceLoader } from './invoice.loader';

type MaybeWithRelations = InvoiceEntity & {
  documentTemplate?: DocumentTemplateEntity;
  reimbursementType?: ReimbursementTypeEntity;
  signatures?: InvoiceSignatureEntity[];
  statusChanges?: InvoiceStatusChangeEntity[];
  invoiceTimeEntries?: InvoiceTimeEntryEntity[];
};

@Resolver(() => Invoice)
export class InvoiceFieldResolver {
  constructor(
    private readonly documentTemplateMapper: DocumentTemplateMapper,
    private readonly reimbursementTypeMapper: ReimbursementTypeMapper,
    private readonly invoiceSignatureMapper: InvoiceSignatureMapper,
    private readonly invoiceStatusChangeMapper: InvoiceStatusChangeMapper,
    private readonly invoiceTimeEntryMapper: InvoiceTimeEntryMapper,
  ) {}

  @ResolveField(() => DocumentTemplate)
  async documentTemplate(
    @Parent() invoice: MaybeWithRelations,
    @Loader(InvoiceLoader) loader: InvoiceLoader,
  ): Promise<DocumentTemplate> {
    if (invoice.documentTemplate) {
      return this.documentTemplateMapper.toModelOrThrow(
        invoice.documentTemplate,
      );
    }
    const full = await loader.invoiceWithRelationsById.load(invoice.id);
    return this.documentTemplateMapper.toModelOrThrow(full.documentTemplate);
  }

  @ResolveField(() => ReimbursementType)
  async reimbursementType(
    @Parent() invoice: MaybeWithRelations,
    @Loader(InvoiceLoader) loader: InvoiceLoader,
  ): Promise<ReimbursementType> {
    if (invoice.reimbursementType) {
      return this.reimbursementTypeMapper.toModelOrThrow(
        invoice.reimbursementType,
      );
    }
    const full = await loader.invoiceWithRelationsById.load(invoice.id);
    return this.reimbursementTypeMapper.toModelOrThrow(full.reimbursementType);
  }

  @ResolveField(() => [InvoiceSignature])
  async signatures(
    @Parent() invoice: MaybeWithRelations,
    @Loader(InvoiceLoader) loader: InvoiceLoader,
  ): Promise<InvoiceSignature[]> {
    if (invoice.signatures) {
      return this.invoiceSignatureMapper.toArray(invoice.signatures);
    }
    const full = await loader.invoiceWithRelationsById.load(invoice.id);
    return this.invoiceSignatureMapper.toArray(full.signatures);
  }

  @ResolveField(() => [InvoiceStatusChange])
  async statusChanges(
    @Parent() invoice: MaybeWithRelations,
    @Loader(InvoiceLoader) loader: InvoiceLoader,
  ): Promise<InvoiceStatusChange[]> {
    if (invoice.statusChanges) {
      return this.invoiceStatusChangeMapper.toArray(invoice.statusChanges);
    }
    const full = await loader.invoiceWithRelationsById.load(invoice.id);
    return this.invoiceStatusChangeMapper.toArray(full.statusChanges);
  }

  @ResolveField(() => [InvoiceTimeEntry])
  async invoiceTimeEntries(
    @Parent() invoice: MaybeWithRelations,
    @Loader(InvoiceLoader) loader: InvoiceLoader,
  ): Promise<InvoiceTimeEntry[]> {
    if (invoice.invoiceTimeEntries) {
      return this.invoiceTimeEntryMapper.toArray(invoice.invoiceTimeEntries);
    }
    const full = await loader.invoiceWithRelationsById.load(invoice.id);
    return this.invoiceTimeEntryMapper.toArray(full.invoiceTimeEntries);
  }

  @ResolveField(() => User)
  async volunteer(
    @Parent() invoice: InvoiceEntity,
    @Loader(AccountingUserLoader) loader: AccountingUserLoader,
  ): Promise<User> {
    const user = await loader.userById.load(invoice.volunteerId);
    if (!user) {
      throw new NotFoundGraphQLError(
        `Volunteer with ID ${invoice.volunteerId} not found`,
      );
    }
    return user;
  }

  @ResolveField(() => User, { nullable: true })
  async declinedByUser(
    @Parent() invoice: InvoiceEntity,
    @Loader(AccountingUserLoader) loader: AccountingUserLoader,
  ): Promise<User | null> {
    if (!invoice.declinedByUserId) {
      return null;
    }
    return loader.userById.load(invoice.declinedByUserId);
  }
}

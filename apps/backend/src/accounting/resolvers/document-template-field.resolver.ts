import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Loader } from '../../graphql/decorators/loader.decorator';
import { Organization } from '../../organization/models/organization.model';
import { OrganizationUnit } from '../../organization/models/organization-unit.model';
import { User } from '../../user/models/user.model';
import { ReimbursementTypeMapper, TemplateSigneeMapper } from '../mappers';
import { DocumentTemplate } from '../models/document-template.model';
import { ReimbursementType } from '../models/reimbursement-type.model';
import { TemplateSignee } from '../models/template-signee.model';
import type { DocumentTemplateEntity } from '../schemas/document-template.schema';
import type { ReimbursementTypeEntity } from '../schemas/reimbursement-type.schema';
import type { TemplateSigneeEntity } from '../schemas/template-signee.schema';
import { AccountingOrganizationLoader } from './accounting-organization.loader';
import { AccountingReferenceLoader } from './accounting-reference.loader';
import { AccountingUserLoader } from './accounting-user.loader';
import { DocumentTemplateSigneesLoader } from './document-template-signees.loader';

type MaybeWithRelations = DocumentTemplateEntity & {
  reimbursementType?: ReimbursementTypeEntity;
  signees?: TemplateSigneeEntity[];
};

@Resolver(() => DocumentTemplate)
export class DocumentTemplateFieldResolver {
  constructor(
    private readonly reimbursementTypeMapper: ReimbursementTypeMapper,
    private readonly templateSigneeMapper: TemplateSigneeMapper,
  ) {}

  @ResolveField(() => Organization)
  async organization(
    @Parent() template: DocumentTemplateEntity,
    @Loader(AccountingOrganizationLoader) loader: AccountingOrganizationLoader,
  ): Promise<Organization> {
    return loader.organizationById.load(template.organizationId);
  }

  @ResolveField(() => OrganizationUnit, { nullable: true })
  async organizationUnit(
    @Parent() template: DocumentTemplateEntity,
    @Loader(AccountingOrganizationLoader) loader: AccountingOrganizationLoader,
  ): Promise<OrganizationUnit | null> {
    if (!template.organizationUnitId) {
      return null;
    }
    return loader.organizationUnitById.load(template.organizationUnitId);
  }

  @ResolveField(() => ReimbursementType)
  async reimbursementType(
    @Parent() template: MaybeWithRelations,
    @Loader(AccountingReferenceLoader) loader: AccountingReferenceLoader,
  ): Promise<ReimbursementType> {
    if (template.reimbursementType) {
      return this.reimbursementTypeMapper.toModelOrThrow(
        template.reimbursementType,
      );
    }
    return loader.reimbursementTypeById.load(template.reimbursementTypeId);
  }

  @ResolveField(() => User, { nullable: true })
  async lastEditedByUser(
    @Parent() template: DocumentTemplateEntity,
    @Loader(AccountingUserLoader) loader: AccountingUserLoader,
  ): Promise<User | null> {
    if (!template.lastEditedBy) {
      return null;
    }
    return loader.userById.load(template.lastEditedBy);
  }

  @ResolveField(() => [TemplateSignee])
  async signees(
    @Parent() template: MaybeWithRelations,
    @Loader(DocumentTemplateSigneesLoader)
    loader: DocumentTemplateSigneesLoader,
  ): Promise<TemplateSignee[]> {
    if (template.signees) {
      return this.templateSigneeMapper.toArray(template.signees);
    }
    return loader.signeesByTemplateId.load(template.id);
  }
}

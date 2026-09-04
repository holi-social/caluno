import { Args, Context, ID, Query, Resolver } from '@nestjs/graphql';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { DocumentKind } from '../enums';
import { DocumentTemplateMapper } from '../mappers';
import { DocumentTemplate } from '../models/document-template.model';
import {
  AccountingOrgAccessService,
  DocumentTemplateService,
} from '../services';

@Resolver(() => DocumentTemplate)
export class DocumentTemplateQueryResolver {
  constructor(
    private readonly documentTemplateService: DocumentTemplateService,
    private readonly documentTemplateMapper: DocumentTemplateMapper,
    private readonly accountingOrgAccessService: AccountingOrgAccessService,
  ) {}

  @Permissions(PERMISSIONS.ACCOUNTING_MANAGE)
  @Query(() => [DocumentTemplate])
  async documentTemplates(
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<DocumentTemplate[]> {
    const organizationId =
      await this.accountingOrgAccessService.resolveEnabledOrganizationId(
        context.organizationUnitId,
      );
    const templates =
      await this.documentTemplateService.findDocumentTemplates(organizationId);
    return this.documentTemplateMapper.toArray(templates);
  }

  @Permissions(PERMISSIONS.ACCOUNTING_MANAGE)
  @Query(() => DocumentTemplate)
  async documentTemplate(
    @Args('id', { type: () => ID }) id: string,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<DocumentTemplate> {
    const organizationId =
      await this.accountingOrgAccessService.resolveEnabledOrganizationId(
        context.organizationUnitId,
      );
    const template = await this.documentTemplateService.findDocumentTemplate(
      organizationId,
      id,
    );
    return this.documentTemplateMapper.toModelOrThrow(template);
  }

  @Permissions(PERMISSIONS.ACCOUNTING_MANAGE)
  @Query(() => DocumentTemplate)
  async activeDocumentTemplate(
    @Args('reimbursementTypeId', { type: () => ID })
    reimbursementTypeId: string,
    @Args('kind', { type: () => DocumentKind }) kind: DocumentKind,
    @Args('organizationUnitId', { type: () => ID, nullable: true })
    organizationUnitId: string | null | undefined,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<DocumentTemplate> {
    const organizationId =
      await this.accountingOrgAccessService.resolveEnabledOrganizationId(
        context.organizationUnitId,
      );
    const template = await this.documentTemplateService.findActiveTemplate(
      organizationId,
      reimbursementTypeId,
      kind,
      organizationUnitId ?? context.organizationUnitId,
    );
    return this.documentTemplateMapper.toModelOrThrow(template);
  }
}

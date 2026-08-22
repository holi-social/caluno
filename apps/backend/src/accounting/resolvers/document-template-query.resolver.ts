import { Args, Context, ID, Query, Resolver } from '@nestjs/graphql';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { NotFoundGraphQLError } from '../../graphql/errors';
import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { OrganizationUnitService } from '../../organization/organization-unit.service';
import { DocumentKind } from '../enums';
import { DocumentTemplateMapper } from '../mappers';
import { DocumentTemplate } from '../models/document-template.model';
import { DocumentTemplateService } from '../services';

@Resolver(() => DocumentTemplate)
export class DocumentTemplateQueryResolver {
  constructor(
    private readonly documentTemplateService: DocumentTemplateService,
    private readonly documentTemplateMapper: DocumentTemplateMapper,
    private readonly organizationUnitService: OrganizationUnitService,
  ) {}

  @Permissions(PERMISSIONS.ACCOUNTING_MANAGE)
  @Query(() => [DocumentTemplate])
  async documentTemplates(
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<DocumentTemplate[]> {
    const organizationId = await this.resolveOrganizationId(context);
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
    const organizationId = await this.resolveOrganizationId(context);
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
    const organizationId = await this.resolveOrganizationId(context);
    const template = await this.documentTemplateService.findActiveTemplate(
      organizationId,
      reimbursementTypeId,
      kind,
      organizationUnitId ?? context.organizationUnitId,
    );
    return this.documentTemplateMapper.toModelOrThrow(template);
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

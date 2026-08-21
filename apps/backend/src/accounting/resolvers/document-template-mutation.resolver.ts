import { Args, Context, ID, Mutation, Resolver } from '@nestjs/graphql';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { NotFoundGraphQLError } from '../../graphql/errors';
import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { OrganizationUnitService } from '../../organization/organization-unit.service';
import { CreateDocumentTemplateInput } from '../inputs/create-document-template.input';
import { UpdateDocumentTemplateInput } from '../inputs/update-document-template.input';
import { DocumentTemplateMapper } from '../mappers';
import { DocumentTemplate } from '../models/document-template.model';
import type { DocumentTemplateBody } from '../schemas/document-template.schema';
import { DocumentTemplateService } from '../services';

@Resolver(() => DocumentTemplate)
export class DocumentTemplateMutationResolver {
  constructor(
    private readonly documentTemplateService: DocumentTemplateService,
    private readonly documentTemplateMapper: DocumentTemplateMapper,
    private readonly organizationUnitService: OrganizationUnitService,
  ) {}

  @Permissions(PERMISSIONS.ACCOUNTING_MANAGE)
  @Mutation(() => DocumentTemplate)
  async createDocumentTemplate(
    @Args('input') input: CreateDocumentTemplateInput,
    @Session() session: UserSession,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<DocumentTemplate> {
    const organizationId = await this.resolveOrganizationId(context);
    const template = await this.documentTemplateService.createDocumentTemplate(
      organizationId,
      {
        organizationUnitId: input.organizationUnitId,
        reimbursementTypeId: input.reimbursementTypeId,
        kind: input.kind,
        renewalCadence: input.renewalCadence,
        invoiceNumberFormat: input.invoiceNumberFormat,
        body: input.body as DocumentTemplateBody,
        signees: input.signees,
      },
      session.user.id,
    );
    return this.documentTemplateMapper.toModelOrThrow(template);
  }

  @Permissions(PERMISSIONS.ACCOUNTING_MANAGE)
  @Mutation(() => DocumentTemplate)
  async updateDocumentTemplate(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateDocumentTemplateInput,
    @Session() session: UserSession,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<DocumentTemplate> {
    const organizationId = await this.resolveOrganizationId(context);
    const template = await this.documentTemplateService.updateDocumentTemplate(
      organizationId,
      id,
      {
        renewalCadence: input.renewalCadence,
        invoiceNumberFormat: input.invoiceNumberFormat,
        body: input.body as DocumentTemplateBody | undefined,
        signees: input.signees,
      },
      session.user.id,
    );
    return this.documentTemplateMapper.toModelOrThrow(template);
  }

  @Permissions(PERMISSIONS.ACCOUNTING_MANAGE)
  @Mutation(() => Boolean)
  async deleteDocumentTemplate(
    @Args('id', { type: () => ID }) id: string,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<boolean> {
    const organizationId = await this.resolveOrganizationId(context);
    await this.documentTemplateService.deleteDocumentTemplate(
      organizationId,
      id,
    );
    return true;
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

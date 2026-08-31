import { Args, Context, ID, Mutation, Resolver } from '@nestjs/graphql';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { CreateDocumentTemplateInput } from '../inputs/create-document-template.input';
import { UpdateDocumentTemplateInput } from '../inputs/update-document-template.input';
import { DocumentTemplateMapper } from '../mappers';
import { DocumentTemplate } from '../models/document-template.model';
import {
  AccountingOrgAccessService,
  DocumentTemplateService,
} from '../services';

@Resolver(() => DocumentTemplate)
export class DocumentTemplateMutationResolver {
  constructor(
    private readonly documentTemplateService: DocumentTemplateService,
    private readonly documentTemplateMapper: DocumentTemplateMapper,
    private readonly accountingOrgAccessService: AccountingOrgAccessService,
  ) {}

  @Permissions(PERMISSIONS.ACCOUNTING_MANAGE)
  @Mutation(() => DocumentTemplate)
  async createDocumentTemplate(
    @Args('input') input: CreateDocumentTemplateInput,
    @Session() session: UserSession,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<DocumentTemplate> {
    const organizationId =
      await this.accountingOrgAccessService.resolveEnabledOrganizationId(
        context.organizationUnitId,
      );
    const template = await this.documentTemplateService.createDocumentTemplate(
      organizationId,
      input,
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
    const organizationId =
      await this.accountingOrgAccessService.resolveEnabledOrganizationId(
        context.organizationUnitId,
      );
    const template = await this.documentTemplateService.updateDocumentTemplate(
      organizationId,
      id,
      input,
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
    const organizationId =
      await this.accountingOrgAccessService.resolveEnabledOrganizationId(
        context.organizationUnitId,
      );
    await this.documentTemplateService.deleteDocumentTemplate(
      organizationId,
      id,
      context.user.id,
    );
    return true;
  }
}

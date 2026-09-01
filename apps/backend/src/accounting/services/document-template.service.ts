import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { Database } from '../../database/database.module';
import { DATABASE_CONNECTION } from '../../database/database-connection';
import * as schema from '../../database/schema';
import {
  BadRequestGraphQLError,
  ConflictGraphQLError,
  NotFoundGraphQLError,
} from '../../graphql/errors';
import {
  POSTHOG_EVENT,
  POSTHOG_SURFACE,
} from '../../shared/observability/posthog.events';
import { PostHogService } from '../../shared/observability/posthog.service';
import { DocumentKind, SigneeType } from '../enums';
import type { CreateDocumentTemplateInput } from '../inputs/create-document-template.input';
import type { CreateTemplateSigneeInput } from '../inputs/create-template-signee.input';
import type { UpdateDocumentTemplateInput } from '../inputs/update-document-template.input';
import type {
  DocumentTemplateBody,
  DocumentTemplateEntity,
} from '../schemas/document-template.schema';
import type { TemplateSigneeEntity } from '../schemas/template-signee.schema';
import { DocumentProfileRequirementService } from './document-profile-requirement.service';

@Injectable()
export class DocumentTemplateService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
    private readonly postHogService: PostHogService,
    private readonly documentProfileRequirementService: DocumentProfileRequirementService,
  ) {}

  async findDocumentTemplates(
    organizationId: string,
  ): Promise<DocumentTemplateEntity[]> {
    return this.db.query.documentTemplates.findMany({
      where: { organizationId, isDeleted: false },
      with: { signees: true, reimbursementType: true },
    });
  }

  async findDocumentTemplate(
    organizationId: string,
    templateId: string,
  ): Promise<DocumentTemplateEntity> {
    const template = await this.db.query.documentTemplates.findFirst({
      where: { id: templateId, organizationId, isDeleted: false },
      with: { signees: true },
    });
    if (!template) {
      throw new NotFoundGraphQLError(
        `Document template with ID ${templateId} not found`,
      );
    }
    return template;
  }

  async createDocumentTemplate(
    organizationId: string,
    input: CreateDocumentTemplateInput,
    editedByUserId: string,
  ): Promise<DocumentTemplateEntity> {
    this.assertValidSignees(input.signees);

    if (input.organizationUnitId) {
      const unit = await this.db.query.organizationUnits.findFirst({
        where: { id: input.organizationUnitId, organizationId },
        columns: { id: true },
      });
      if (!unit) {
        throw new NotFoundGraphQLError('Organization unit not found');
      }
      // The unit must already carry the org-profile fields the template's
      // bound org sources render — otherwise the PDF comes out with "—" gaps
      // the org can't fix inline after the fact.
      await this.assertOrgProfileComplete(input.organizationUnitId, input.body);
    }

    const existing = await this.db.query.documentTemplates.findFirst({
      where: {
        organizationId,
        organizationUnitId: input.organizationUnitId
          ? input.organizationUnitId
          : { isNull: true },
        reimbursementTypeId: input.reimbursementTypeId,
        kind: input.kind,
        isDeleted: false,
      },
    });
    if (existing) {
      throw new ConflictGraphQLError(
        `A ${input.kind.toLowerCase()} template already exists for this reimbursement type`,
      );
    }

    const template = await this.db.transaction(async (tx) => {
      const [created] = await tx
        .insert(schema.documentTemplates)
        .values({
          organizationId,
          organizationUnitId: input.organizationUnitId ?? null,
          reimbursementTypeId: input.reimbursementTypeId,
          kind: input.kind,
          renewalCadence: input.renewalCadence ?? null,
          invoiceNumberFormat: input.invoiceNumberFormat ?? null,
          body: input.body as DocumentTemplateBody,
          lastEditedAt: new Date(),
          lastEditedBy: editedByUserId,
        })
        .returning();

      await tx.insert(schema.templateSignees).values(
        input.signees.map((signee) => ({
          documentTemplateId: created.id,
          order: signee.order,
          signeeType: signee.signeeType,
          requiredPermissionId: signee.requiredPermissionId ?? null,
        })),
      );

      return created;
    });

    this.postHogService.capture({
      event: POSTHOG_EVENT.DOCUMENT_TEMPLATE_CREATE,
      userId: editedByUserId,
      properties: {
        surface: POSTHOG_SURFACE.BACKOFFICE,
        organization_id: organizationId,
        organization_unit_id: input.organizationUnitId ?? undefined,
      },
    });

    return template;
  }

  async updateDocumentTemplate(
    organizationId: string,
    templateId: string,
    input: UpdateDocumentTemplateInput,
    editedByUserId: string,
  ): Promise<DocumentTemplateEntity> {
    const existingTemplate = await this.findDocumentTemplate(
      organizationId,
      templateId,
    );
    if (input.signees) {
      this.assertValidSignees(input.signees);
    }

    // Org-data can be removed after a template is created, so re-check the
    // unit the template is scoped to before overwriting its body.
    if (input.body !== undefined && existingTemplate.organizationUnitId) {
      await this.assertOrgProfileComplete(
        existingTemplate.organizationUnitId,
        input.body,
      );
    }

    const template = await this.db.transaction(async (tx) => {
      const [updated] = await tx
        .update(schema.documentTemplates)
        .set({
          ...(input.renewalCadence !== undefined && {
            renewalCadence: input.renewalCadence,
          }),
          ...(input.invoiceNumberFormat !== undefined && {
            invoiceNumberFormat: input.invoiceNumberFormat,
          }),
          ...(input.body !== undefined && {
            body: input.body as DocumentTemplateBody,
          }),
          lastEditedAt: new Date(),
          lastEditedBy: editedByUserId,
        })
        .where(eq(schema.documentTemplates.id, templateId))
        .returning();

      if (input.signees) {
        // Contracts/invoices already issued keep their own signature rows and
        // resolvedBody snapshot, so replacing signees here never touches them.
        await tx
          .delete(schema.templateSignees)
          .where(eq(schema.templateSignees.documentTemplateId, templateId));
        await tx.insert(schema.templateSignees).values(
          input.signees.map((signee) => ({
            documentTemplateId: templateId,
            order: signee.order,
            signeeType: signee.signeeType,
            requiredPermissionId: signee.requiredPermissionId ?? null,
          })),
        );
      }

      return updated;
    });

    this.postHogService.capture({
      event: POSTHOG_EVENT.DOCUMENT_TEMPLATE_UPDATE,
      userId: editedByUserId,
      properties: {
        surface: POSTHOG_SURFACE.BACKOFFICE,
        organization_id: organizationId,
        organization_unit_id: template.organizationUnitId ?? undefined,
      },
    });

    return template;
  }

  async deleteDocumentTemplate(
    organizationId: string,
    templateId: string,
    userId: string,
  ): Promise<void> {
    await this.findDocumentTemplate(organizationId, templateId);
    await this.db
      .update(schema.documentTemplates)
      .set({ isDeleted: true })
      .where(eq(schema.documentTemplates.id, templateId));

    this.postHogService.capture({
      event: POSTHOG_EVENT.DOCUMENT_TEMPLATE_DELETE,
      userId,
      properties: {
        surface: POSTHOG_SURFACE.BACKOFFICE,
        organization_id: organizationId,
      },
    });
  }

  /**
   * Resolves the template a unit actually uses: its own override if one
   * exists, else the organization-wide default. Pass `organizationUnitId:
   * null` (or omit it) to resolve the org-wide default directly.
   */
  async findActiveTemplate(
    organizationId: string,
    reimbursementTypeId: string,
    kind: DocumentKind,
    organizationUnitId?: string | null,
  ): Promise<DocumentTemplateEntity> {
    if (organizationUnitId) {
      const override = await this.db.query.documentTemplates.findFirst({
        where: {
          organizationId,
          organizationUnitId,
          reimbursementTypeId,
          kind,
          isDeleted: false,
        },
      });
      if (override) {
        return override;
      }
    }

    const template = await this.db.query.documentTemplates.findFirst({
      where: {
        organizationId,
        organizationUnitId: { isNull: true },
        reimbursementTypeId,
        kind,
        isDeleted: false,
      },
    });
    if (!template) {
      throw new NotFoundGraphQLError(
        `No ${kind.toLowerCase()} template configured for reimbursement type ${reimbursementTypeId}`,
      );
    }
    return template;
  }

  async findOrderedTemplateSignees(
    templateId: string,
  ): Promise<TemplateSigneeEntity[]> {
    const signees = await this.db.query.templateSignees.findMany({
      where: { documentTemplateId: templateId },
    });
    if (signees.length === 0) {
      throw new BadRequestGraphQLError(
        `Document template ${templateId} has no configured signees`,
      );
    }
    return [...signees].sort((a, b) => a.order - b.order);
  }

  private async assertOrgProfileComplete(
    organizationUnitId: string | null,
    body: unknown,
  ): Promise<void> {
    if (!organizationUnitId) return;
    const missing =
      await this.documentProfileRequirementService.missingOrgProfileSources(
        organizationUnitId,
        body,
      );
    if (missing.length > 0) {
      throw new BadRequestGraphQLError(
        'Your organization is missing details required for this template: ' +
          missing.join(', ') +
          '. Please complete your organization profile before saving this template.',
      );
    }
  }

  private assertValidSignees(signees: CreateTemplateSigneeInput[]): void {
    if (signees.length === 0) {
      throw new BadRequestGraphQLError('At least one signee is required');
    }
    for (const signee of signees) {
      if (
        signee.signeeType === SigneeType.PERMISSION_HOLDER &&
        !signee.requiredPermissionId
      ) {
        throw new BadRequestGraphQLError(
          'Permission-holder signees must specify a required permission',
        );
      }
      if (
        signee.signeeType === SigneeType.VOLUNTEER &&
        signee.requiredPermissionId
      ) {
        throw new BadRequestGraphQLError(
          'Volunteer signees must not specify a required permission',
        );
      }
    }
  }
}

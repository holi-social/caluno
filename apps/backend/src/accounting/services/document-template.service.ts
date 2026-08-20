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
import type {
  CreateDocumentTemplateInput,
  CreateTemplateSigneeInput,
  UpdateDocumentTemplateInput,
} from '../accounting.types';
import { DocumentKind, SigneeType } from '../enums';
import type { DocumentTemplateEntity } from '../schemas/document-template.schema';
import type { TemplateSigneeEntity } from '../schemas/template-signee.schema';

@Injectable()
export class DocumentTemplateService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
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

    const existing = await this.db.query.documentTemplates.findFirst({
      where: {
        organizationId,
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

    return this.db.transaction(async (tx) => {
      const [template] = await tx
        .insert(schema.documentTemplates)
        .values({
          organizationId,
          reimbursementTypeId: input.reimbursementTypeId,
          kind: input.kind,
          renewalCadence: input.renewalCadence ?? null,
          invoiceNumberFormat: input.invoiceNumberFormat ?? null,
          body: input.body,
          lastEditedAt: new Date(),
          lastEditedBy: editedByUserId,
        })
        .returning();

      await tx.insert(schema.templateSignees).values(
        input.signees.map((signee) => ({
          documentTemplateId: template.id,
          order: signee.order,
          signeeType: signee.signeeType,
          requiredPermissionId: signee.requiredPermissionId ?? null,
        })),
      );

      return template;
    });
  }

  async updateDocumentTemplate(
    organizationId: string,
    templateId: string,
    input: UpdateDocumentTemplateInput,
    editedByUserId: string,
  ): Promise<DocumentTemplateEntity> {
    await this.findDocumentTemplate(organizationId, templateId);
    if (input.signees) {
      this.assertValidSignees(input.signees);
    }

    return this.db.transaction(async (tx) => {
      const [template] = await tx
        .update(schema.documentTemplates)
        .set({
          ...(input.renewalCadence !== undefined && {
            renewalCadence: input.renewalCadence,
          }),
          ...(input.invoiceNumberFormat !== undefined && {
            invoiceNumberFormat: input.invoiceNumberFormat,
          }),
          ...(input.body !== undefined && { body: input.body }),
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

      return template;
    });
  }

  async deleteDocumentTemplate(
    organizationId: string,
    templateId: string,
  ): Promise<void> {
    await this.findDocumentTemplate(organizationId, templateId);
    await this.db
      .update(schema.documentTemplates)
      .set({ isDeleted: true })
      .where(eq(schema.documentTemplates.id, templateId));
  }

  async findActiveTemplate(
    organizationId: string,
    reimbursementTypeId: string,
    kind: DocumentKind,
  ): Promise<DocumentTemplateEntity> {
    const template = await this.db.query.documentTemplates.findFirst({
      where: { organizationId, reimbursementTypeId, kind, isDeleted: false },
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

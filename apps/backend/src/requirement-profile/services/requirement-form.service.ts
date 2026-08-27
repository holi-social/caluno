import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { count, eq } from 'drizzle-orm';
import type { Database } from '../../database/database.module';
import { DATABASE_CONNECTION } from '../../database/database-connection';
import * as schema from '../../database/schema';
import {
  BadRequestGraphQLError,
  ConflictGraphQLError,
  NotFoundGraphQLError,
} from '../../graphql/errors';
import type { PaginationInput } from '../../graphql/pagination.input';
import {
  POSTHOG_EVENT,
  POSTHOG_SURFACE,
} from '../../shared/observability/posthog.events';
import { PostHogService } from '../../shared/observability/posthog.service';
import { patch } from '../../shared/patch';
import { CreateRequirementFormInput } from '../inputs/create-requirement-form.input';
import { UpdateRequirementFormInput } from '../inputs/update-requirement-form.input';
import type {
  RequirementFormEntity,
  RequirementFormInsert,
} from '../schemas/requirement-form.schema';
import { isUnitInOrg } from './is-unit-in-org';
import { RequiredFormService } from './required-form.service';

@Injectable()
export class RequirementFormService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
    private readonly requiredFormService: RequiredFormService,
    private readonly postHogService: PostHogService,
  ) {}

  async findById(id: string): Promise<RequirementFormEntity | undefined> {
    return this.db.query.requirementForms.findFirst({
      where: { id },
    });
  }

  async verifyOrgAccess(
    organizationUnitId: string,
    organizationId: string,
  ): Promise<void> {
    await isUnitInOrg(this.db, organizationUnitId, organizationId);
  }

  async countSubmissions(formId: string): Promise<number> {
    const [{ count: total }] = await this.db
      .select({ count: count() })
      .from(schema.formSubmissions)
      .where(eq(schema.formSubmissions.formId, formId));
    return total;
  }

  async findByShareToken(
    token: string,
  ): Promise<RequirementFormEntity | undefined> {
    return this.db.query.requirementForms.findFirst({
      where: { shareToken: token },
    });
  }

  async findBlockRefs(formId: string) {
    return this.db.query.requirementFormBlockRefs.findMany({
      where: { formId },
      orderBy: { fieldOrder: 'asc' },
    });
  }

  /**
   * Multi-tenancy guard: block refs may only point at blocks owned by the
   * form's organization — the ids are client-supplied.
   */
  private async verifyBlocksInOrg(
    blockIds: string[],
    organizationId: string,
  ): Promise<void> {
    if (blockIds.length === 0) {
      return;
    }
    const blocks = await this.db.query.formBlocks.findMany({
      where: { id: { in: blockIds } },
      columns: { id: true, organizationId: true },
    });
    if (
      blocks.length !== new Set(blockIds).size ||
      blocks.some((block) => block.organizationId !== organizationId)
    ) {
      throw new BadRequestGraphQLError(
        'One or more blocks do not belong to this organization',
      );
    }
  }

  async findAll(
    organizationId: string,
    pagination: PaginationInput,
  ): Promise<{ items: RequirementFormEntity[]; total: number }> {
    const items = await this.db.query.requirementForms.findMany({
      where: { organizationId },
      limit: pagination.limit,
      offset: pagination.offset,
      orderBy: { createdAt: 'desc' },
    });
    const [{ count: total }] = await this.db
      .select({ count: count() })
      .from(schema.requirementForms)
      .where(eq(schema.requirementForms.organizationId, organizationId));
    return { items, total };
  }

  async create(
    input: CreateRequirementFormInput,
    organizationUnitId: string,
    userId: string,
  ): Promise<RequirementFormEntity> {
    await isUnitInOrg(this.db, organizationUnitId, input.organizationId);

    if (input.blockRefs?.length) {
      await this.verifyBlocksInOrg(
        input.blockRefs.map((ref) => ref.blockId),
        input.organizationId,
      );
    }

    if (organizationUnitId) {
      const duplicate = await this.db.query.requirementForms.findFirst({
        where: { organizationUnitId, name: input.name },
        columns: { id: true },
      });
      if (duplicate) {
        throw new ConflictGraphQLError(
          `A form named "${input.name}" already exists in this organization unit`,
        );
      }
    }

    const slug = this.generateSlug(input.name);

    const form = await this.db.transaction(async (tx) => {
      const formInsert: RequirementFormInsert = {
        organizationId: input.organizationId,
        organizationUnitId: organizationUnitId,
        slug,
        name: input.name,
        description: input.description,
        settings: this.normalizeSettings(input.settings),
        shareToken: randomUUID(),
        createdBy: userId,
        updatedBy: userId,
      };

      const [created] = await tx
        .insert(schema.requirementForms)
        .values(formInsert)
        .returning();

      if (input.blockRefs && input.blockRefs.length > 0) {
        await tx.insert(schema.requirementFormBlockRefs).values(
          input.blockRefs.map((ref, index) => ({
            formId: created.id,
            blockId: ref.blockId,
            fieldOrder: ref.order ?? index,
            required: ref.required,
          })),
        );
      }

      return created;
    });

    this.postHogService.capture({
      event: POSTHOG_EVENT.REQUIREMENT_FORM_CREATE,
      userId,
      properties: {
        surface: POSTHOG_SURFACE.BACKOFFICE,
        organization_id: form.organizationId,
        organization_unit_id: form.organizationUnitId ?? undefined,
      },
    });

    return form;
  }

  async update(
    id: string,
    organizationUnitId: string,
    input: UpdateRequirementFormInput,
    userId: string,
  ): Promise<RequirementFormEntity> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundGraphQLError('Form not found');
    }

    await isUnitInOrg(this.db, organizationUnitId, existing.organizationId);

    if (input.blockRefs !== undefined && !input.blockRefs?.length) {
      throw new BadRequestGraphQLError('Form must contain at least one block');
    }

    if (input.blockRefs) {
      await this.verifyBlocksInOrg(
        input.blockRefs.map((ref) => ref.blockId),
        existing.organizationId,
      );
    }

    if (
      input.name &&
      input.name !== existing.name &&
      existing.organizationUnitId
    ) {
      const conflict = await this.db.query.requirementForms.findFirst({
        where: {
          organizationUnitId: existing.organizationUnitId,
          name: input.name,
        },
        columns: { id: true },
      });
      if (conflict) {
        throw new ConflictGraphQLError(
          `A form named "${input.name}" already exists in this organization unit`,
        );
      }
    }

    const updated = await this.db.transaction(async (tx) => {
      const hasSubmissions = await tx.query.formSubmissions.findFirst({
        where: { formId: id },
        columns: { id: true },
      });

      if (hasSubmissions) {
        throw new ConflictGraphQLError(
          'Cannot edit form because it already has submissions',
        );
      }

      const { settings, blockRefs, ...rest } = input;
      const [form] = await tx
        .update(schema.requirementForms)
        .set({
          ...patch(rest, { ignoreNull: ['name'] }),
          ...(settings !== undefined && {
            settings: this.normalizeSettings(settings),
          }),
          updatedBy: userId,
          updatedAt: new Date(),
        })
        .where(eq(schema.requirementForms.id, id))
        .returning();

      if (!form) {
        throw new NotFoundGraphQLError('Form not found');
      }

      if (input.blockRefs) {
        await tx
          .delete(schema.requirementFormBlockRefs)
          .where(eq(schema.requirementFormBlockRefs.formId, id));

        if (input.blockRefs.length > 0) {
          await tx.insert(schema.requirementFormBlockRefs).values(
            input.blockRefs.map((ref, index) => ({
              formId: id,
              blockId: ref.blockId,
              fieldOrder: ref.order ?? index,
              required: ref.required,
            })),
          );
        }
      }

      return form;
    });

    this.postHogService.capture({
      event: POSTHOG_EVENT.REQUIREMENT_FORM_UPDATE,
      userId,
      properties: {
        surface: POSTHOG_SURFACE.BACKOFFICE,
        organization_id: updated.organizationId,
        organization_unit_id: updated.organizationUnitId ?? undefined,
      },
    });

    return updated;
  }

  async delete(
    id: string,
    organizationUnitId: string,
    userId: string,
  ): Promise<RequirementFormEntity> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundGraphQLError('Form not found');
    }

    await isUnitInOrg(this.db, organizationUnitId, existing.organizationId);

    const isRequired =
      await this.requiredFormService.isFormRequiredByAnyTarget(id);

    if (isRequired) {
      throw new ConflictGraphQLError(
        'Cannot delete form because it is required by an organization unit',
      );
    }

    const deleted = await this.db.transaction(async (tx) => {
      const hasSubmissions = await tx.query.formSubmissions.findFirst({
        where: { formId: id },
        columns: { id: true },
      });

      if (hasSubmissions) {
        throw new ConflictGraphQLError(
          'Cannot delete form because it already has submissions',
        );
      }

      const [form] = await tx
        .delete(schema.requirementForms)
        .where(eq(schema.requirementForms.id, id))
        .returning();

      if (!form) {
        throw new NotFoundGraphQLError('Form not found');
      }

      return form;
    });

    this.postHogService.capture({
      event: POSTHOG_EVENT.REQUIREMENT_FORM_DELETE,
      userId,
      properties: {
        surface: POSTHOG_SURFACE.BACKOFFICE,
        organization_id: deleted.organizationId,
        organization_unit_id: deleted.organizationUnitId ?? undefined,
      },
    });

    return deleted;
  }

  async regenerateShareToken(
    id: string,
    organizationUnitId: string,
    userId: string,
  ): Promise<RequirementFormEntity> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundGraphQLError('Form not found');
    }

    await isUnitInOrg(this.db, organizationUnitId, existing.organizationId);

    const [updated] = await this.db
      .update(schema.requirementForms)
      .set({
        shareToken: randomUUID(),
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(schema.requirementForms.id, id))
      .returning();

    if (!updated) {
      throw new NotFoundGraphQLError('Form not found');
    }

    this.postHogService.capture({
      event: POSTHOG_EVENT.REQUIREMENT_FORM_UPDATE,
      userId,
      properties: {
        surface: POSTHOG_SURFACE.BACKOFFICE,
        organization_id: updated.organizationId,
        organization_unit_id: updated.organizationUnitId ?? undefined,
        updated_field: 'share_token',
      },
    });

    return updated;
  }

  private generateSlug(name: string): string {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return base || `form-${Date.now()}`;
  }

  private normalizeSettings(
    input:
      | {
          submitButtonLabel?: string | null;
          successTitle?: string | null;
          successMessage?: string | null;
          allowEmbed?: boolean | null;
        }
      | null
      | undefined,
  ): {
    submitButtonLabel?: string;
    successTitle?: string;
    successMessage?: string;
    allowEmbed?: boolean;
  } {
    if (!input) return {};
    return {
      ...(input.submitButtonLabel !== null &&
      input.submitButtonLabel !== undefined
        ? { submitButtonLabel: input.submitButtonLabel }
        : {}),
      ...(input.successTitle !== null && input.successTitle !== undefined
        ? { successTitle: input.successTitle }
        : {}),
      ...(input.successMessage !== null && input.successMessage !== undefined
        ? { successMessage: input.successMessage }
        : {}),
      ...(input.allowEmbed !== null && input.allowEmbed !== undefined
        ? { allowEmbed: input.allowEmbed }
        : {}),
    };
  }
}

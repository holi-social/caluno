import { Inject, Injectable } from '@nestjs/common';
import { count, desc, eq, inArray } from 'drizzle-orm';
import type { Database } from '../../database/database.module';
import { DATABASE_CONNECTION } from '../../database/database-connection';
import * as schema from '../../database/schema';
import {
  BadRequestGraphQLError,
  ConflictGraphQLError,
  NotFoundGraphQLError,
} from '../../graphql/errors';
import type { PaginationInput } from '../../graphql/pagination.input';
import { patch } from '../../shared/patch';
import { SYSTEM_PROFILE_KEYS } from '../constants';
import { CreateFormBlockInput } from '../inputs/create-form-block.input';
import { CreateFormBlockFieldInput } from '../inputs/create-form-block-field.input';
import { UpdateFormBlockInput } from '../inputs/update-form-block.input';
import { UpdateFormBlockFieldInput } from '../inputs/update-form-block-field.input';
import type {
  FormBlockEntity,
  FormBlockInsert,
} from '../schemas/form-block.schema';
import type { FormBlockFieldInsert } from '../schemas/form-block-field.schema';
import { isUnitInOrg } from './is-unit-in-org';

@Injectable()
export class FormBlockService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
  ) {}

  async findById(id: string): Promise<FormBlockEntity | undefined> {
    return this.db.query.formBlocks.findFirst({
      where: { id },
    });
  }

  async isEditable(blockId: string): Promise<boolean> {
    const refs = await this.db
      .select({ formId: schema.requirementFormBlockRefs.formId })
      .from(schema.requirementFormBlockRefs)
      .where(eq(schema.requirementFormBlockRefs.blockId, blockId));

    if (refs.length === 0) return true;

    const formIds = refs.map((r) => r.formId);
    const hasSubmissions = await this.db
      .select({ count: count() })
      .from(schema.formSubmissions)
      .where(inArray(schema.formSubmissions.formId, formIds));

    return (hasSubmissions[0]?.count ?? 0) === 0;
  }

  async findByIds(ids: string[]): Promise<FormBlockEntity[]> {
    if (ids.length === 0) return [];
    return this.db
      .select()
      .from(schema.formBlocks)
      .where(inArray(schema.formBlocks.id, ids));
  }

  async findFields(blockId: string) {
    return this.db.query.formBlockFields.findMany({
      where: { blockId },
      orderBy: { fieldOrder: 'asc' },
    });
  }

  async findAll(
    organizationId: string,
    pagination: PaginationInput,
  ): Promise<{ items: FormBlockEntity[]; total: number }> {
    const items = await this.db.query.formBlocks.findMany({
      where: { organizationId },
      limit: pagination.limit,
      offset: pagination.offset,
      orderBy: { createdAt: 'desc' },
    });
    const [{ count: total }] = await this.db
      .select({ count: count() })
      .from(schema.formBlocks)
      .where(eq(schema.formBlocks.organizationId, organizationId));
    return { items, total };
  }

  async create(
    input: CreateFormBlockInput,
    organizationUnitId: string,
    userId: string,
  ): Promise<FormBlockEntity> {
    await isUnitInOrg(this.db, organizationUnitId, input.organizationId);

    const duplicate = await this.db.query.formBlocks.findFirst({
      where: { organizationId: input.organizationId, title: input.title },
      columns: { id: true },
    });
    if (duplicate) {
      throw new ConflictGraphQLError(
        `A block named "${input.title}" already exists in this organization`,
      );
    }

    return this.db.transaction(async (tx) => {
      const blockInsert: FormBlockInsert = {
        organizationId: input.organizationId,
        title: input.title,
        description: input.description,
        icon: input.icon,
        required: input.required ?? true,
        createdBy: userId,
        updatedBy: userId,
      };

      const [block] = await tx
        .insert(schema.formBlocks)
        .values(blockInsert)
        .returning();

      if (input.fields && input.fields.length > 0) {
        await tx
          .insert(schema.formBlockFields)
          .values(
            input.fields.map((field, index) =>
              this.mapFieldInput(field, block.id, index),
            ),
          );
      }

      return block;
    });
  }

  async update(
    id: string,
    organizationUnitId: string,
    input: UpdateFormBlockInput,
    userId: string,
  ): Promise<FormBlockEntity> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundGraphQLError('Block not found');
    }

    await isUnitInOrg(this.db, organizationUnitId, existing.organizationId);

    if (!(await this.isEditable(id))) {
      throw new ConflictGraphQLError(
        'Cannot edit locked block, it is used in a form with submissions',
      );
    }

    if (input.title && input.title !== existing.title) {
      const conflict = await this.db.query.formBlocks.findFirst({
        where: { organizationId: existing.organizationId, title: input.title },
        columns: { id: true },
      });
      if (conflict) {
        throw new ConflictGraphQLError(
          `A block named "${input.title}" already exists in this organization`,
        );
      }
    }

    const [updated] = await this.db
      .update(schema.formBlocks)
      .set({ ...patch(input), updatedBy: userId, updatedAt: new Date() })
      .where(eq(schema.formBlocks.id, id))
      .returning();

    if (!updated) {
      throw new NotFoundGraphQLError('Block not found');
    }

    return updated;
  }

  async delete(
    id: string,
    organizationUnitId: string,
  ): Promise<FormBlockEntity> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundGraphQLError('Block not found');
    }

    await isUnitInOrg(this.db, organizationUnitId, existing.organizationId);

    const used = await this.db.query.requirementFormBlockRefs.findFirst({
      where: { blockId: id },
    });

    if (used) {
      throw new ConflictGraphQLError(
        'Cannot delete block because it is used in one or more forms',
      );
    }

    const [deleted] = await this.db
      .delete(schema.formBlocks)
      .where(eq(schema.formBlocks.id, id))
      .returning();

    if (!deleted) {
      throw new NotFoundGraphQLError('Block not found');
    }

    return deleted;
  }

  private validateDocumentUrl(url: string | null | undefined): void {
    if (!url) return;
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        throw new Error();
      }
    } catch {
      throw new BadRequestGraphQLError(
        'documentUrl must be a valid http/https URL',
      );
    }
  }

  async createField(
    blockId: string,
    organizationUnitId: string,
    input: CreateFormBlockFieldInput,
  ): Promise<FormBlockEntity> {
    if (input.systemKey && !SYSTEM_PROFILE_KEYS.has(input.systemKey)) {
      throw new BadRequestGraphQLError(
        `Invalid systemKey: "${input.systemKey}". Must be one of: ${[...SYSTEM_PROFILE_KEYS].join(', ')}`,
      );
    }
    this.validateDocumentUrl(input.documentUrl);

    const block = await this.findById(blockId);
    if (!block) {
      throw new NotFoundGraphQLError('Block not found');
    }

    await isUnitInOrg(this.db, organizationUnitId, block.organizationId);

    if (!(await this.isEditable(blockId))) {
      throw new ConflictGraphQLError(
        'Cannot edit locked block, it is used in a form with submissions',
      );
    }

    const maxOrder = await this.db
      .select({ maxOrder: schema.formBlockFields.fieldOrder })
      .from(schema.formBlockFields)
      .where(eq(schema.formBlockFields.blockId, blockId))
      .orderBy(desc(schema.formBlockFields.fieldOrder))
      .limit(1);

    const order = maxOrder[0]?.maxOrder ?? -1;

    await this.db
      .insert(schema.formBlockFields)
      .values(this.mapFieldInput(input, blockId, order + 1));

    return this.findById(blockId) as Promise<FormBlockEntity>;
  }

  async updateField(
    fieldId: string,
    organizationUnitId: string,
    input: UpdateFormBlockFieldInput,
  ): Promise<FormBlockEntity> {
    if (input.systemKey && !SYSTEM_PROFILE_KEYS.has(input.systemKey)) {
      throw new BadRequestGraphQLError(
        `Invalid systemKey: "${input.systemKey}". Must be one of: ${[...SYSTEM_PROFILE_KEYS].join(', ')}`,
      );
    }
    this.validateDocumentUrl(input.documentUrl);

    const field = await this.db.query.formBlockFields.findFirst({
      where: { id: fieldId },
      with: { block: true },
    });

    if (!field || !field.block) {
      throw new NotFoundGraphQLError('Field not found');
    }

    await isUnitInOrg(this.db, organizationUnitId, field.block.organizationId);

    if (!(await this.isEditable(field.block.id))) {
      throw new ConflictGraphQLError(
        'Cannot edit locked block, it is used in a form with submissions',
      );
    }

    await this.db
      .update(schema.formBlockFields)
      .set({ ...patch(input), updatedAt: new Date() })
      .where(eq(schema.formBlockFields.id, fieldId));

    return this.findById(field.block.id) as Promise<FormBlockEntity>;
  }

  async deleteField(
    fieldId: string,
    organizationUnitId: string,
  ): Promise<FormBlockEntity> {
    const field = await this.db.query.formBlockFields.findFirst({
      where: { id: fieldId },
      with: { block: true },
    });

    if (!field || !field.block) {
      throw new NotFoundGraphQLError('Field not found');
    }

    await isUnitInOrg(this.db, organizationUnitId, field.block.organizationId);

    if (!(await this.isEditable(field.block.id))) {
      throw new ConflictGraphQLError(
        'Cannot edit locked block, it is used in a form with submissions',
      );
    }

    await this.db
      .delete(schema.formBlockFields)
      .where(eq(schema.formBlockFields.id, fieldId));

    return this.findById(field.block.id) as Promise<FormBlockEntity>;
  }

  private mapFieldInput(
    input: CreateFormBlockFieldInput,
    blockId: string,
    order: number,
  ): FormBlockFieldInsert {
    return {
      blockId,
      type: input.type,
      label: input.label,
      placeholder: input.placeholder,
      description: input.description,
      required: input.required ?? false,
      lockType: input.lockType ?? false,
      systemKey: input.systemKey,
      options: input.options,
      documentUrl: input.documentUrl,
      documentLabel: input.documentLabel,
      minAge: input.minAge,
      fieldOrder: input.fieldOrder ?? order,
    };
  }
}

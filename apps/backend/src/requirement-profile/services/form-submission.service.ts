import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { and, count, eq, inArray } from 'drizzle-orm';
import type { Database } from '../../database/database.module';
import { DATABASE_CONNECTION } from '../../database/database-connection';
import * as schema from '../../database/schema';
import {
  BadRequestGraphQLError,
  NotFoundGraphQLError,
} from '../../graphql/errors';
import type { PaginationInput } from '../../graphql/pagination.input';
import { MembershipService } from '../../membership/membership.service';
import { SYSTEM_PROFILE_KEYS } from '../constants';
import { FieldType } from '../enums';
import { SubmitFormInput } from '../inputs/submit-form.input';
import type { FormSubmissionEntity } from '../schemas/form-submission.schema';
import { UserProfileService } from './user-profile.service';

@Injectable()
export class FormSubmissionService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
    private readonly userProfileService: UserProfileService,
    @Inject(forwardRef(() => MembershipService))
    private readonly membershipService: MembershipService,
  ) {}

  async findById(id: string): Promise<FormSubmissionEntity | undefined> {
    return this.db.query.formSubmissions.findFirst({
      where: { id },
      with: { values: true },
    });
  }

  async findByFormId(
    formId: string,
    pagination: PaginationInput,
  ): Promise<{ items: FormSubmissionEntity[]; total: number }> {
    const items = await this.db.query.formSubmissions.findMany({
      where: { formId },
      limit: pagination.limit,
      offset: pagination.offset,
      orderBy: { submittedAt: 'desc' },
      with: { values: true, user: true },
    });
    const [{ count: total }] = await this.db
      .select({ count: count() })
      .from(schema.formSubmissions)
      .where(eq(schema.formSubmissions.formId, formId));
    return { items, total };
  }

  async findByUserAndForm(
    userId: string,
    formId: string,
  ): Promise<FormSubmissionEntity | undefined> {
    return this.db.query.formSubmissions.findFirst({
      where: {
        userId,
        formId,
      },
      with: { values: true },
    });
  }

  async findValuesBySubmissionId(submissionId: string) {
    return this.db.query.formSubmissionValues.findMany({
      where: { submissionId },
    });
  }

  async submit(
    token: string,
    input: SubmitFormInput,
    userId: string,
  ): Promise<FormSubmissionEntity> {
    const form = await this.db.query.requirementForms.findFirst({
      where: { shareToken: token },
    });

    if (!form) {
      throw new NotFoundGraphQLError('Form not found');
    }

    const existing = await this.findByUserAndForm(userId, form.id);
    if (existing) {
      if (existing.status !== 'REJECTED') {
        throw new BadRequestGraphQLError(
          'You have already submitted this form',
        );
      }
      // Previous submission was rejected — delete it so the user can re-submit
      await this.db
        .delete(schema.formSubmissions)
        .where(eq(schema.formSubmissions.id, existing.id));
    }

    // Load block refs and fields
    const blockRefs = await this.db.query.requirementFormBlockRefs.findMany({
      where: { formId: form.id },
      orderBy: { fieldOrder: 'asc' },
    });

    const blockIds = blockRefs.map((ref) => ref.blockId);
    const blocks =
      blockIds.length > 0
        ? await this.db
            .select()
            .from(schema.formBlocks)
            .where(inArray(schema.formBlocks.id, blockIds))
        : [];

    const fields =
      blockIds.length > 0
        ? await this.db
            .select()
            .from(schema.formBlockFields)
            .where(inArray(schema.formBlockFields.blockId, blockIds))
            .orderBy(schema.formBlockFields.fieldOrder)
        : [];

    const blockMap = new Map(blocks.map((b) => [b.id, b]));
    const fieldsByBlockId = new Map<string, typeof fields>();
    for (const field of fields) {
      const list = fieldsByBlockId.get(field.blockId) ?? [];
      list.push(field);
      fieldsByBlockId.set(field.blockId, list);
    }

    // Gather all required fields
    const requiredFieldIds = new Set<string>();
    const fieldMap = new Map<
      string,
      { blockId: string; systemKey: string | null; type: string; label: string }
    >();

    for (const ref of blockRefs) {
      const block = blockMap.get(ref.blockId);
      const effectiveRequired = ref.required ?? block?.required ?? true;
      const blockFields = fieldsByBlockId.get(ref.blockId) ?? [];
      for (const field of blockFields) {
        fieldMap.set(field.id, {
          blockId: ref.blockId,
          systemKey: field.systemKey,
          type: field.type,
          label: field.label,
        });
        if (effectiveRequired && field.required) {
          requiredFieldIds.add(field.id);
        }
      }
    }

    // Validate required fields
    const providedFieldIds = new Set(input.values.map((v) => v.fieldId));
    for (const requiredId of requiredFieldIds) {
      if (!providedFieldIds.has(requiredId)) {
        const fieldInfo = fieldMap.get(requiredId);
        throw new BadRequestGraphQLError(
          `Field "${fieldInfo?.label ?? requiredId}" is required`,
        );
      }
    }

    // Separate system fields from custom fields
    const profileData: Record<string, unknown> = {};
    const customValues: Array<{
      fieldId: string;
      blockId: string;
      value: unknown;
    }> = [];

    for (const valueInput of input.values) {
      const fieldInfo = fieldMap.get(valueInput.fieldId);
      if (!fieldInfo) {
        throw new BadRequestGraphQLError(
          `Unknown field: ${valueInput.fieldId}`,
        );
      }

      if (fieldInfo.systemKey && SYSTEM_PROFILE_KEYS.has(fieldInfo.systemKey)) {
        profileData[fieldInfo.systemKey] = this.parseValue(
          valueInput.value,
          fieldInfo.type,
        );
      } else {
        customValues.push({
          fieldId: valueInput.fieldId,
          blockId: fieldInfo.blockId,
          value: this.parseValue(valueInput.value, fieldInfo.type),
        });
      }
    }

    const submission = await this.db.transaction(async (tx) => {
      // Save profile data
      if (Object.keys(profileData).length > 0) {
        await this.userProfileService.upsertData(userId, profileData, tx);
      }

      // Create submission
      const [created] = await tx
        .insert(schema.formSubmissions)
        .values({
          formId: form.id,
          userId,
          status: 'SUBMITTED',
          submittedAt: new Date(),
        })
        .returning();

      // Create submission values
      if (customValues.length > 0) {
        await tx.insert(schema.formSubmissionValues).values(
          customValues.map((cv) => ({
            submissionId: created.id,
            fieldId: cv.fieldId,
            blockId: cv.blockId,
            value: cv.value,
          })),
        );
      }

      return created;
    });

    // Create membership request if the user is not already a member.
    // A pending request already existing is not an error — ignore ConflictGraphQLError.
    if (form.organizationUnitId) {
      const isMember = await this.membershipService.isMemberOfUnitOrAncestor(
        userId,
        form.organizationUnitId,
      );
      if (!isMember) {
        try {
          await this.membershipService.createMembershipRequest(
            userId,
            form.organizationUnitId,
          );
        } catch {
          // Pending request already exists — submission is still valid
        }
      }
    }

    return submission;
  }

  async rejectByUserAndOrgUnit(
    userId: string,
    organizationUnitId: string,
  ): Promise<void> {
    const forms = await this.db.query.requirementForms.findMany({
      where: { organizationUnitId },
      columns: { id: true },
    });
    if (forms.length === 0) return;

    const formIds = forms.map((f) => f.id);
    await this.db
      .update(schema.formSubmissions)
      .set({ status: 'REJECTED' })
      .where(
        and(
          eq(schema.formSubmissions.userId, userId),
          eq(schema.formSubmissions.status, 'SUBMITTED'),
          inArray(schema.formSubmissions.formId, formIds),
        ),
      );
  }

  private parseValue(rawValue: string, fieldType: string): unknown {
    if (
      fieldType === FieldType.CHECKBOX ||
      fieldType === FieldType.DOCUMENT_ACKNOWLEDGEMENT
    ) {
      return rawValue === 'true';
    }
    if (fieldType === FieldType.MULTI_CHOICE) {
      try {
        return JSON.parse(rawValue);
      } catch {
        return rawValue.split(',');
      }
    }
    if (fieldType === FieldType.NUMBERS) {
      const num = Number(rawValue);
      return Number.isNaN(num) ? rawValue : num;
    }
    return rawValue;
  }
}

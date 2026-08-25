import { Inject, Injectable } from '@nestjs/common';
import { and, asc, count, eq, inArray } from 'drizzle-orm';
import type { Database } from '../../database/database.module';
import { DATABASE_CONNECTION } from '../../database/database-connection';
import * as schema from '../../database/schema';
import {
  BadRequestGraphQLError,
  ConflictGraphQLError,
  ForbiddenGraphQLError,
  NotFoundGraphQLError,
} from '../../graphql/errors';
import type { PaginationInput } from '../../graphql/pagination.input';
import { SYSTEM_PROFILE_KEYS } from '../constants';
import { FieldType, RequiredFormTargetType } from '../enums';
import { SubmitFormInput } from '../inputs/submit-form.input';
import type { FormSubmissionEntity } from '../schemas/form-submission.schema';
import { isUnitInOrg } from './is-unit-in-org';
import { parseMultiChoiceValue } from './multi-choice-value';
import {
  RequiredFormService,
  type RequiredFormTarget,
} from './required-form.service';
import { UserProfileService } from './user-profile.service';

@Injectable()
export class FormSubmissionService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
    private readonly userProfileService: UserProfileService,
    private readonly requiredFormService: RequiredFormService,
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

  async findMySubmission(
    userId: string,
    id: string,
  ): Promise<FormSubmissionEntity | null> {
    const submission = await this.db.query.formSubmissions.findFirst({
      where: { id, userId },
      with: {
        form: {
          with: { blockRefs: { with: { block: { with: { fields: true } } } } },
        },
        values: true,
      },
    });

    return submission ?? null;
  }

  async findValuesBySubmissionId(submissionId: string) {
    return this.db.query.formSubmissionValues.findMany({
      where: { submissionId },
    });
  }

  async findByMembershipRequestForAdmin(
    membershipRequestId: string,
    orgUnitId: string,
  ): Promise<FormSubmissionEntity[]> {
    const request = await this.db.query.membershipRequests.findFirst({
      where: { id: membershipRequestId, organizationUnitId: orgUnitId },
    });
    if (!request) {
      throw new NotFoundGraphQLError('Membership request not found');
    }
    if (!request.userId) {
      throw new ForbiddenGraphQLError(
        `Membership request ${membershipRequestId} has no user`,
      );
    }
    return this.findByUserAndOrgUnit(request.userId, orgUnitId);
  }

  async findByUserForAdmin(
    userId: string,
    orgUnitId: string,
  ): Promise<FormSubmissionEntity[]> {
    return this.findByUserAndOrgUnit(userId, orgUnitId);
  }

  async findByUserAndOrgUnit(
    userId: string,
    orgUnitId: string,
  ): Promise<FormSubmissionEntity[]> {
    const rows = await this.db
      .select({ submission: schema.formSubmissions })
      .from(schema.formSubmissions)
      .innerJoin(
        schema.formSubmissionShares,
        eq(schema.formSubmissionShares.submissionId, schema.formSubmissions.id),
      )
      .where(
        and(
          eq(schema.formSubmissions.userId, userId),
          eq(schema.formSubmissionShares.organizationUnitId, orgUnitId),
        ),
      )
      .orderBy(asc(schema.formSubmissions.submittedAt));
    return rows.map((row) => row.submission);
  }

  async submit(
    token: string,
    input: SubmitFormInput,
    userId: string,
    organizationUnitId: string,
  ): Promise<FormSubmissionEntity> {
    const form = await this.db.query.requirementForms.findFirst({
      where: { shareToken: token },
    });

    if (!form) {
      throw new NotFoundGraphQLError('Form not found');
    }

    await isUnitInOrg(this.db, organizationUnitId, form.organizationId);

    return this.submitToForm(form, input, userId, organizationUnitId);
  }

  async submitRequiredForm(
    target: RequiredFormTarget,
    formId: string,
    input: SubmitFormInput,
    userId: string,
  ): Promise<FormSubmissionEntity> {
    const requiredForms =
      await this.requiredFormService.getRequiredForms(target);
    const isRequired = requiredForms.some((item) => item.form.id === formId);

    if (!isRequired) {
      throw new ForbiddenGraphQLError(
        'This form is not required for the target',
      );
    }

    const form = await this.db.query.requirementForms.findFirst({
      where: { id: formId },
    });

    if (!form) {
      throw new NotFoundGraphQLError('Form not found');
    }

    const organizationUnitId =
      await this.resolveTargetOrganizationUnitId(target);
    return this.submitToForm(form, input, userId, organizationUnitId);
  }

  /**
   * When a target's required forms are already satisfied by submissions made
   * elsewhere, make the asking unit's views reflect that: share each of those
   * submissions with the target's org unit. Idempotent.
   */
  async shareSatisfiedRequiredForms(
    userId: string,
    target: RequiredFormTarget,
  ): Promise<void> {
    const requiredForms =
      await this.requiredFormService.getRequiredForms(target);
    if (requiredForms.length === 0) return;

    const formIds = requiredForms.map((item) => item.form.id);
    const submissions = await this.db.query.formSubmissions.findMany({
      where: { userId, formId: { in: formIds } },
      columns: { id: true },
    });
    if (submissions.length === 0) return;

    const organizationUnitId =
      await this.resolveTargetOrganizationUnitId(target);
    for (const submission of submissions) {
      await this.shareWithOrgUnit(submission.id, organizationUnitId);
    }
  }

  private async resolveTargetOrganizationUnitId(
    target: RequiredFormTarget,
  ): Promise<string> {
    switch (target.targetType) {
      case RequiredFormTargetType.ORGANIZATION_UNIT:
        return target.targetId;
      case RequiredFormTargetType.EVENT: {
        const event = await this.db.query.events.findFirst({
          where: { id: target.targetId },
          columns: { organizationUnitId: true },
        });
        if (!event) throw new NotFoundGraphQLError('Event not found');
        return event.organizationUnitId;
      }
      case RequiredFormTargetType.SHIFT: {
        const shift = await this.db.query.shifts.findFirst({
          where: { id: target.targetId },
          columns: { organizationUnitId: true },
        });
        if (!shift) throw new NotFoundGraphQLError('Shift not found');
        return shift.organizationUnitId;
      }
      case RequiredFormTargetType.SHIFT_INSTANCE: {
        const instance = await this.db.query.shiftInstances.findFirst({
          where: { id: target.targetId },
          columns: { masterId: true },
        });
        if (!instance) {
          throw new NotFoundGraphQLError('Shift instance not found');
        }
        const shift = await this.db.query.shifts.findFirst({
          where: { id: instance.masterId },
          columns: { organizationUnitId: true },
        });
        if (!shift) throw new NotFoundGraphQLError('Shift not found');
        return shift.organizationUnitId;
      }
      default:
        throw new ConflictGraphQLError(
          `Unsupported required-form target: ${target.targetType}`,
        );
    }
  }

  private async submitToForm(
    form: schema.RequirementFormEntity,
    input: SubmitFormInput,
    userId: string,
    organizationUnitId: string,
  ): Promise<FormSubmissionEntity> {
    const existing = await this.findByUserAndForm(userId, form.id);
    if (existing) {
      await this.shareWithOrgUnit(existing.id, organizationUnitId);
      return existing;
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
      {
        blockId: string;
        systemKey: string | null;
        type: string;
        label: string;
        options: Array<{ label: string; value: string }> | null;
        minAge: number | null;
      }
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
          options: field.options as Array<{
            label: string;
            value: string;
          }> | null,
          minAge: field.minAge,
        });
        if (effectiveRequired && field.required) {
          requiredFieldIds.add(field.id);
        }
      }
    }

    // Validate required fields are present and non-empty
    const valuesByFieldId = new Map(
      input.values.map((v) => [v.fieldId, v.value]),
    );
    for (const requiredId of requiredFieldIds) {
      const fieldInfo = fieldMap.get(requiredId);
      const label = fieldInfo?.label ?? requiredId;
      const value = valuesByFieldId.get(requiredId);
      const isCheckboxType =
        fieldInfo?.type === FieldType.CHECKBOX ||
        fieldInfo?.type === FieldType.DOCUMENT_ACKNOWLEDGEMENT;
      const missing = isCheckboxType
        ? value !== 'true'
        : fieldInfo?.type === FieldType.MULTI_CHOICE
          ? parseMultiChoiceValue(value ?? '').length === 0
          : !value;
      if (missing) {
        throw new BadRequestGraphQLError(`Field "${label}" is required`);
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

      this.validateFieldValue(valueInput.value, fieldInfo);

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

      await this.shareWithOrgUnit(created.id, organizationUnitId, tx);

      return created;
    });

    return submission;
  }

  private async shareWithOrgUnit(
    submissionId: string,
    organizationUnitId: string,
    tx: Database = this.db,
  ): Promise<void> {
    await tx
      .insert(schema.formSubmissionShares)
      .values({ submissionId, organizationUnitId })
      .onConflictDoNothing();
  }

  private validateFieldValue(
    rawValue: string,
    field: {
      type: string;
      label: string;
      systemKey: string | null;
      options: Array<{ label: string; value: string }> | null;
      minAge: number | null;
    },
  ): void {
    const { type, label, systemKey, options, minAge } = field;

    if (type === FieldType.STATIC_TEXT) return;
    if (!rawValue) return;

    switch (type) {
      case FieldType.TEXT:
        if (rawValue.length > 300)
          throw new BadRequestGraphQLError(
            `"${label}": must be 300 characters or fewer`,
          );
        break;
      case FieldType.NAME:
      case FieldType.LASTNAME:
        if (rawValue.length > 100)
          throw new BadRequestGraphQLError(
            `"${label}": must be 100 characters or fewer`,
          );
        break;
      case FieldType.ZIP:
        if (rawValue.length > 20)
          throw new BadRequestGraphQLError(
            `"${label}": must be 20 characters or fewer`,
          );
        break;
      case FieldType.TEXTAREA:
        if (rawValue.length > 5000)
          throw new BadRequestGraphQLError(
            `"${label}": must be 5000 characters or fewer`,
          );
        break;
      case FieldType.EMAIL:
        if (
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawValue) ||
          rawValue.length > 254
        )
          throw new BadRequestGraphQLError(
            `"${label}": must be a valid email address`,
          );
        break;
      case FieldType.PHONE:
        if (!/^\+?[\d\s\-().]{7,20}$/.test(rawValue))
          throw new BadRequestGraphQLError(
            `"${label}": must be a valid phone number`,
          );
        break;
      case FieldType.NUMBERS:
        if (!/^-?\d+(\.\d+)?$/.test(rawValue))
          throw new BadRequestGraphQLError(`"${label}": must be a number`);
        break;
      case FieldType.DATE:
        if (Number.isNaN(Date.parse(rawValue)))
          throw new BadRequestGraphQLError(`"${label}": must be a valid date`);
        break;
      case FieldType.SINGLE_CHOICE: {
        const valid = (options ?? []).map((o) => o.value);
        if (valid.length > 0 && !valid.includes(rawValue))
          throw new BadRequestGraphQLError(`"${label}": invalid option`);
        break;
      }
      case FieldType.MULTI_CHOICE: {
        const valid = new Set((options ?? []).map((o) => o.value));
        const invalid = parseMultiChoiceValue(rawValue).filter(
          (v) => valid.size > 0 && !valid.has(v),
        );
        if (invalid.length > 0)
          throw new BadRequestGraphQLError(`"${label}": invalid option(s)`);
        break;
      }
      case FieldType.CHECKBOX:
      case FieldType.DOCUMENT_ACKNOWLEDGEMENT:
        if (rawValue !== 'true' && rawValue !== 'false')
          throw new BadRequestGraphQLError(`"${label}": must be true or false`);
        break;
    }

    if (systemKey) {
      this.validateSystemKey(rawValue, systemKey, label, minAge);
    }
  }

  private validateSystemKey(
    value: string,
    systemKey: string,
    label: string,
    minAge: number | null,
  ): void {
    switch (systemKey) {
      case 'name':
      case 'lastname':
      case 'preferred-name':
      case 'city':
        if (value.length > 100)
          throw new BadRequestGraphQLError(
            `"${label}": must be 100 characters or fewer`,
          );
        if (!/^[\p{L}\p{M}'\- ]+$/u.test(value))
          throw new BadRequestGraphQLError(
            `"${label}": contains invalid characters`,
          );
        break;
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || value.length > 254)
          throw new BadRequestGraphQLError(
            `"${label}": must be a valid email address`,
          );
        break;
      case 'phone':
        if (!/^\+?[\d\s\-().]{7,20}$/.test(value))
          throw new BadRequestGraphQLError(
            `"${label}": must be a valid phone number`,
          );
        break;
      case 'address':
        if (value.length > 200)
          throw new BadRequestGraphQLError(
            `"${label}": must be 200 characters or fewer`,
          );
        break;
      case 'zip':
        if (!/^[A-Z0-9\- ]{3,10}$/i.test(value))
          throw new BadRequestGraphQLError(
            `"${label}": must be a valid postal code`,
          );
        break;
      case 'gender':
        if (value.length > 50)
          throw new BadRequestGraphQLError(
            `"${label}": must be 50 characters or fewer`,
          );
        break;
      case 'birth-date':
        if (minAge !== null && minAge !== undefined) {
          const birth = new Date(value);
          const today = new Date();
          let age = today.getFullYear() - birth.getFullYear();
          if (
            today.getMonth() < birth.getMonth() ||
            (today.getMonth() === birth.getMonth() &&
              today.getDate() < birth.getDate())
          ) {
            age--;
          }
          if (age < minAge)
            throw new BadRequestGraphQLError(
              `You must be at least ${minAge} years old`,
            );
        }
        break;
      case 'iban':
        if (value.length > 34)
          throw new BadRequestGraphQLError(
            `"${label}": must be 34 characters or fewer`,
          );
        break;
    }
  }

  private parseValue(rawValue: string, fieldType: string): unknown {
    if (
      fieldType === FieldType.CHECKBOX ||
      fieldType === FieldType.DOCUMENT_ACKNOWLEDGEMENT
    ) {
      return rawValue === 'true';
    }
    if (fieldType === FieldType.MULTI_CHOICE) {
      return parseMultiChoiceValue(rawValue);
    }
    if (fieldType === FieldType.NUMBERS) {
      const num = Number(rawValue);
      return Number.isNaN(num) ? rawValue : num;
    }
    return rawValue;
  }
}

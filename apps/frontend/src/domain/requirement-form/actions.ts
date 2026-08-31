'use server';

import { FieldType, RequiredFormTargetType } from '@repo/data';
import { revalidatePath } from 'next/cache';
import z from 'zod';
import { getDataClient } from '@/lib/data-client';
import { actionClient } from '@/lib/safe-action';
import { choiceOptionSchema } from './option-values';
import { serverCreateBlockSchema, serverCreateFormSchema } from './schemas';

export const createForm = actionClient
  .inputSchema(serverCreateFormSchema)
  .action(async ({ parsedInput }) => {
    const data = await getDataClient({
      orgUId: parsedInput.organizationUnitId,
    });
    const form = await data.requirementForm.createForm({
      organizationId: parsedInput.organizationId,
      name: parsedInput.name,
      description: parsedInput.description,
    });
    revalidatePath(
      `/admin/${parsedInput.organizationUnitId}/requirement-forms`,
    );
    return form;
  });

const updateFormSchema = z.object({
  organizationUnitId: z.string().min(1),
  formId: z.string().min(1),
  name: z.string().optional(),
  description: z.string().optional(),
  blockRefs: z
    .array(
      z.object({
        blockId: z.string(),
        order: z.number().optional(),
        required: z.boolean().optional(),
      }),
    )
    .optional(),
});

export const updateForm = actionClient
  .inputSchema(updateFormSchema)
  .action(async ({ parsedInput }) => {
    const data = await getDataClient({
      orgUId: parsedInput.organizationUnitId,
    });
    const form = await data.requirementForm.updateForm(parsedInput.formId, {
      name: parsedInput.name,
      description: parsedInput.description,
      blockRefs: parsedInput.blockRefs,
    });
    revalidatePath(
      `/admin/${parsedInput.organizationUnitId}/requirement-forms`,
    );
    return form;
  });

export const createBlock = actionClient
  .inputSchema(serverCreateBlockSchema)
  .action(async ({ parsedInput }) => {
    const data = await getDataClient({
      orgUId: parsedInput.organizationUnitId,
    });
    const block = await data.requirementForm.createBlock({
      organizationId: parsedInput.organizationId,
      title: parsedInput.title,
      description: parsedInput.description,
      icon: parsedInput.icon,
      required: parsedInput.required,
    });
    revalidatePath(
      `/admin/${parsedInput.organizationUnitId}/requirement-forms/blocks`,
    );
    return block;
  });

const submitFormSchema = z.object({
  token: z.string().min(1),
  organizationUnitId: z.string().min(1),
  values: z.array(
    z.object({
      fieldId: z.string(),
      blockId: z.string(),
      value: z.string(),
    }),
  ),
});

export const submitForm = actionClient
  .inputSchema(submitFormSchema)
  .action(async ({ parsedInput }) => {
    const data = await getDataClient();
    const result = await data.requirementForm.submitForm(
      parsedInput.token,
      parsedInput.organizationUnitId,
      {
        values: parsedInput.values,
      },
    );
    return result;
  });

const submitRequiredFormSchema = z.object({
  targetType: z.nativeEnum(RequiredFormTargetType),
  targetId: z.string().min(1),
  formId: z.string().min(1),
  values: z.array(
    z.object({
      fieldId: z.string(),
      blockId: z.string(),
      value: z.string(),
    }),
  ),
});

export const submitRequiredForm = actionClient
  .inputSchema(submitRequiredFormSchema)
  .action(async ({ parsedInput }) => {
    const data = await getDataClient();
    const result = await data.requirementForm.submitRequiredForm(
      parsedInput.targetType,
      parsedInput.targetId,
      parsedInput.formId,
      { values: parsedInput.values },
    );
    return result;
  });

const deleteFormSchema = z.object({
  organizationUnitId: z.string().min(1),
  formId: z.string().min(1),
});

export const deleteForm = actionClient
  .inputSchema(deleteFormSchema)
  .action(async ({ parsedInput }) => {
    const data = await getDataClient({
      orgUId: parsedInput.organizationUnitId,
    });
    await data.requirementForm.deleteForm(parsedInput.formId);
    revalidatePath(
      `/admin/${parsedInput.organizationUnitId}/requirement-forms`,
    );
    return { success: true };
  });

const deleteBlockSchema = z.object({
  organizationUnitId: z.string().min(1),
  blockId: z.string().min(1),
});

export const deleteBlock = actionClient
  .inputSchema(deleteBlockSchema)
  .action(async ({ parsedInput }) => {
    const data = await getDataClient({
      orgUId: parsedInput.organizationUnitId,
    });
    await data.requirementForm.deleteBlock(parsedInput.blockId);
    revalidatePath(
      `/admin/${parsedInput.organizationUnitId}/requirement-forms`,
    );
    return { success: true };
  });

const updateBlockSchema = z.object({
  organizationUnitId: z.string().min(1),
  blockId: z.string().min(1),
  title: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  required: z.boolean().optional(),
});

export const updateBlock = actionClient
  .inputSchema(updateBlockSchema)
  .action(async ({ parsedInput }) => {
    const data = await getDataClient({
      orgUId: parsedInput.organizationUnitId,
    });
    const block = await data.requirementForm.updateBlock(parsedInput.blockId, {
      title: parsedInput.title,
      description: parsedInput.description,
      icon: parsedInput.icon,
      required: parsedInput.required,
    });
    revalidatePath(
      `/admin/${parsedInput.organizationUnitId}/requirement-forms/blocks`,
    );
    return block;
  });

const createBlockFieldSchema = z.object({
  organizationUnitId: z.string().min(1),
  blockId: z.string().min(1),
  type: z.nativeEnum(FieldType),
  label: z.string().min(1),
  description: z.string().optional(),
  placeholder: z.string().optional(),
  required: z.boolean().optional(),
  options: z
    .array(
      z.object({
        label: z.string(),
        value: z.string(),
      }),
    )
    .optional(),
  documentFileId: z.string().nullish(),
  documentLabel: z.string().optional(),
  systemKey: z.string().optional(),
  lockType: z.boolean().optional(),
});

export const createBlockField = actionClient
  .inputSchema(createBlockFieldSchema)
  .action(async ({ parsedInput }) => {
    const data = await getDataClient({
      orgUId: parsedInput.organizationUnitId,
    });
    const block = await data.requirementForm.createBlockField(
      parsedInput.blockId,
      {
        type: parsedInput.type,
        label: parsedInput.label,
        description: parsedInput.description,
        placeholder: parsedInput.placeholder,
        required: parsedInput.required,
        options: parsedInput.options,
        documentFileId: parsedInput.documentFileId,
        documentLabel: parsedInput.documentLabel,
        systemKey: parsedInput.systemKey,
        lockType: parsedInput.lockType,
      },
    );
    revalidatePath(
      `/admin/${parsedInput.organizationUnitId}/requirement-forms/blocks`,
    );
    return block;
  });

const updateBlockFieldSchema = z.object({
  organizationUnitId: z.string().min(1),
  fieldId: z.string().min(1),
  label: z.string().optional(),
  description: z.string().optional(),
  placeholder: z.string().optional(),
  required: z.boolean().optional(),
  options: z
    .array(
      z.object({
        label: z.string(),
        value: z.string(),
      }),
    )
    .optional(),
  documentFileId: z.string().nullish(),
  documentLabel: z.string().optional(),
  fieldOrder: z.number().optional(),
  systemKey: z.string().nullable().optional(),
  lockType: z.boolean().optional(),
});

export const updateBlockField = actionClient
  .inputSchema(updateBlockFieldSchema)
  .action(async ({ parsedInput }) => {
    const data = await getDataClient({
      orgUId: parsedInput.organizationUnitId,
    });
    const block = await data.requirementForm.updateBlockField(
      parsedInput.fieldId,
      {
        label: parsedInput.label,
        description: parsedInput.description,
        placeholder: parsedInput.placeholder,
        required: parsedInput.required,
        options: parsedInput.options,
        documentFileId: parsedInput.documentFileId,
        documentLabel: parsedInput.documentLabel,
        fieldOrder: parsedInput.fieldOrder,
        systemKey: parsedInput.systemKey,
        lockType: parsedInput.lockType,
      },
    );
    revalidatePath(
      `/admin/${parsedInput.organizationUnitId}/requirement-forms/blocks`,
    );
    return block;
  });

const deleteBlockFieldSchema = z.object({
  organizationUnitId: z.string().min(1),
  fieldId: z.string().min(1),
});

export const deleteBlockField = actionClient
  .inputSchema(deleteBlockFieldSchema)
  .action(async ({ parsedInput }) => {
    const data = await getDataClient({
      orgUId: parsedInput.organizationUnitId,
    });
    await data.requirementForm.deleteBlockField(parsedInput.fieldId);
    revalidatePath(
      `/admin/${parsedInput.organizationUnitId}/requirement-forms/blocks`,
    );
    return { success: true };
  });

const joinOrganizationSchema = z.object({
  organizationUnitId: z.string().min(1),
});

export const joinOrganization = actionClient
  .inputSchema(joinOrganizationSchema)
  .action(async ({ parsedInput }) => {
    const data = await getDataClient();
    const result = await data.membershipRequest.join(
      parsedInput.organizationUnitId,
    );
    return result;
  });

const saveBlockSchema = z.object({
  organizationUnitId: z.string().min(1),
  organizationId: z.string().min(1),
  blockId: z.string().optional(),
  title: z.string().trim().min(1, 'Title is required'),
  description: z.string().trim().optional(),
  icon: z.string().trim().optional(),
  fields: z.array(
    z.object({
      id: z.string().optional(),
      type: z.nativeEnum(FieldType),
      label: z.string().trim().min(1, 'Field label is required'),
      description: z.string().trim().optional(),
      placeholder: z.string().trim().optional(),
      required: z.boolean().optional(),
      systemKey: z.string().optional(),
      lockType: z.boolean().optional(),
      options: z.array(choiceOptionSchema).optional(),
      documentFileId: z.string().nullish(),
      documentLabel: z.string().optional(),
    }),
  ),
});

export const saveBlock = actionClient
  .inputSchema(saveBlockSchema)
  .action(async ({ parsedInput }) => {
    const data = await getDataClient({
      orgUId: parsedInput.organizationUnitId,
    });

    // Step 1: Create or update block
    let blockId: string;
    if (parsedInput.blockId) {
      const updated = await data.requirementForm.updateBlock(
        parsedInput.blockId,
        {
          title: parsedInput.title,
          description: parsedInput.description,
          icon: parsedInput.icon,
        },
      );
      blockId = updated.id;
    } else {
      const created = await data.requirementForm.createBlock({
        organizationId: parsedInput.organizationId,
        title: parsedInput.title,
        description: parsedInput.description,
        icon: parsedInput.icon,
        required: true,
      });
      blockId = created.id;
    }

    // Step 2: Apply fields
    if (parsedInput.blockId) {
      // Edit mode: diff fields
      const existingBlock = await data.requirementForm.findBlockById(blockId);
      const existingFields = existingBlock?.fields ?? [];
      const submittedFieldIds = new Set(
        parsedInput.fields.map((f) => f.id).filter(Boolean),
      );

      // Delete removed fields
      for (const existing of existingFields) {
        if (!submittedFieldIds.has(existing.id)) {
          await data.requirementForm.deleteBlockField(existing.id);
        }
      }

      // Update existing and create new
      for (let i = 0; i < parsedInput.fields.length; i++) {
        const field = parsedInput.fields[i];
        if (!field) continue;
        if (field.id) {
          await data.requirementForm.updateBlockField(field.id, {
            label: field.label,
            description: field.description,
            placeholder: field.placeholder,
            required: field.required,
            systemKey: field.systemKey ?? null,
            lockType: field.lockType,
            options: field.options,
            documentFileId: field.documentFileId,
            documentLabel: field.documentLabel,
            fieldOrder: i,
          });
        } else {
          await data.requirementForm.createBlockField(blockId, {
            type: field.type,
            label: field.label,
            description: field.description,
            placeholder: field.placeholder,
            required: field.required,
            systemKey: field.systemKey,
            lockType: field.lockType,
            options: field.options,
            documentFileId: field.documentFileId,
            documentLabel: field.documentLabel,
            fieldOrder: i,
          });
        }
      }
    } else {
      // Create mode: create all fields
      for (let i = 0; i < parsedInput.fields.length; i++) {
        const field = parsedInput.fields[i];
        if (!field) continue;
        await data.requirementForm.createBlockField(blockId, {
          type: field.type,
          label: field.label,
          description: field.description,
          placeholder: field.placeholder,
          required: field.required,
          systemKey: field.systemKey,
          lockType: field.lockType,
          options: field.options,
          documentFileId: field.documentFileId,
          documentLabel: field.documentLabel,
          fieldOrder: i,
        });
      }
    }

    revalidatePath(
      `/admin/${parsedInput.organizationUnitId}/requirement-forms`,
      'layout',
    );
    return { blockId };
  });

const updateUserProfileSchema = z.object({
  data: z.record(z.string(), z.string()),
});

export const updateUserProfile = actionClient
  .inputSchema(updateUserProfileSchema)
  .action(async ({ parsedInput }) => {
    const data = await getDataClient();
    const result = await data.requirementForm.updateMyUserProfile({
      data: JSON.stringify(parsedInput.data),
    });
    return result;
  });

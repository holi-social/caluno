import { eq } from 'drizzle-orm';
import type { Database } from '../../src/database/database.module';
import * as schema from '../../src/database/schema';
import { FormSubmissionStatus } from '../../src/requirement-profile/enums';

export const createRequirementForm = async (
  db: Database,
  args: {
    organizationId: string;
    organizationUnitId: string;
    createdById: string;
    name?: string;
    required?: boolean;
  },
) => {
  const name = args.name ?? `Test Form ${crypto.randomUUID()}`;
  const required = args.required ?? false;

  const [form] = await db
    .insert(schema.requirementForms)
    .values({
      organizationId: args.organizationId,
      organizationUnitId: args.organizationUnitId,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      description: 'Test form description',
      shareToken: crypto.randomUUID(),
      createdBy: args.createdById,
      updatedBy: args.createdById,
    })
    .returning();

  if (!form) throw new Error('Failed to create requirement form');

  const [block] = await db
    .insert(schema.formBlocks)
    .values({
      organizationId: args.organizationId,
      title: `Test Block ${crypto.randomUUID()}`,
      description: 'Test block',
      required,
      createdBy: args.createdById,
      updatedBy: args.createdById,
    })
    .returning();

  if (!block) throw new Error('Failed to create form block');

  const [field] = await db
    .insert(schema.formBlockFields)
    .values({
      blockId: block.id,
      type: 'text',
      label: 'Test field',
      required,
      fieldOrder: 0,
    })
    .returning();

  if (!field) throw new Error('Failed to create form block field');

  await db.insert(schema.requirementFormBlockRefs).values({
    formId: form.id,
    blockId: block.id,
    fieldOrder: 0,
    required,
  });

  return { form, block, field };
};

export const createFormSubmission = async (
  db: Database,
  args: {
    formId: string;
    userId: string;
    status?: 'submitted' | 'rejected';
  },
) => {
  const [submission] = await db
    .insert(schema.formSubmissions)
    .values({
      formId: args.formId,
      userId: args.userId,
      status:
        args.status === 'rejected'
          ? FormSubmissionStatus.REJECTED
          : FormSubmissionStatus.SUBMITTED,
      submittedAt: new Date(),
    })
    .returning();

  if (!submission) throw new Error('Failed to create form submission');
  return submission;
};

export const setRequiredForms = async (
  db: Database,
  args: {
    organizationUnitId: string;
    formIds: string[];
  },
) => {
  await db.transaction(async (tx) => {
    await tx
      .delete(schema.organizationUnitRequiredForms)
      .where(
        eq(
          schema.organizationUnitRequiredForms.organizationUnitId,
          args.organizationUnitId,
        ),
      );

    if (args.formIds.length > 0) {
      await tx.insert(schema.organizationUnitRequiredForms).values(
        args.formIds.map((formId, index) => ({
          organizationUnitId: args.organizationUnitId,
          formId,
          order: index,
        })),
      );
    }
  });
};

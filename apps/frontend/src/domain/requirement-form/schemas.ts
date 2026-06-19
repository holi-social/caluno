import z from 'zod';

interface CreateFormSchemaMessages {
  nameRequired: string;
}

export function createFormSchema(t: CreateFormSchemaMessages) {
  return z.object({
    organizationUnitId: z.string().min(1),
    organizationId: z.string().min(1),
    name: z.string().trim().min(1, t.nameRequired),
    description: z.string().trim().optional(),
  });
}

export const serverCreateFormSchema = createFormSchema({
  nameRequired: 'Name is required',
});

export type CreateFormValues = z.infer<typeof serverCreateFormSchema>;

interface CreateBlockSchemaMessages {
  titleRequired: string;
}

export function createBlockSchema(t: CreateBlockSchemaMessages) {
  return z.object({
    organizationUnitId: z.string().min(1),
    organizationId: z.string().min(1),
    title: z.string().trim().min(1, t.titleRequired),
    description: z.string().trim().optional(),
    icon: z.string().trim().optional(),
    required: z.boolean().optional(),
  });
}

export const serverCreateBlockSchema = createBlockSchema({
  titleRequired: 'Title is required',
});

export type CreateBlockValues = z.infer<typeof serverCreateBlockSchema>;

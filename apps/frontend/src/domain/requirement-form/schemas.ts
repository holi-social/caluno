import z from 'zod';

export const createFormSchema = z.object({
  organizationUnitId: z.string().min(1),
  organizationId: z.string().min(1),
  name: z.string().trim().min(1, 'Name is required'),
  description: z.string().trim().optional(),
});

export type CreateFormValues = z.infer<typeof createFormSchema>;

export const createBlockSchema = z.object({
  organizationUnitId: z.string().min(1),
  organizationId: z.string().min(1),
  title: z.string().trim().min(1, 'Title is required'),
  description: z.string().trim().optional(),
  icon: z.string().trim().optional(),
  required: z.boolean().optional(),
});

export type CreateBlockValues = z.infer<typeof createBlockSchema>;

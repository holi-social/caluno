import * as z from 'zod';
import type { CreateProjectInput } from '../../generated/graphql';
import { ProjectStatus } from '../../generated/graphql';

const CreateProjectInputSchema = z
  .object({
    title: z.string().min(2, 'Title must be at least 2 characters'),
    description: z.string().min(2, 'Description must be at least 2 characters'),
    location: z.string().min(2, 'Location must be at least 2 characters'),
    organizationId: z.uuid(),
    startsAt: z.coerce.string().nonempty('Start date is required'),
    endsAt: z.coerce.string().nonempty('End date is required'),
    status: z.enum(ProjectStatus).optional(),
  })
  .refine((data) => new Date(data.endsAt) >= new Date(data.startsAt), {
    message: 'End date must be later than or equal to start date',
    path: ['endsAt'],
  });

// Type utility to ensure two types are exactly equal
type AssertEqual<T, U> =
  (<G>() => G extends T ? 1 : 2) extends <G>() => G extends U ? 1 : 2
    ? true
    : { error: 'Types are not equal'; type1: T; type2: U };

type ZodCreateProjectInput = z.infer<typeof CreateProjectInputSchema>;
// Compile-time assertion: it will fail if CreateProjectInput does not match the ProjectInputSchema schema
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _projectInputSchemaTypeCheck: AssertEqual<
  CreateProjectInput,
  ZodCreateProjectInput
> = true;

export { CreateProjectInputSchema as ProjectInputSchema };

export function validateCreateProjectInput(input: CreateProjectInput) {
  const result = CreateProjectInputSchema.safeParse(input);
  if (result.success) {
    return { success: true, errors: undefined } as const;
  } else {
    return { success: false, errors: z.flattenError(result.error) } as const;
  }
}

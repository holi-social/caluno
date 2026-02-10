'use server';

import {
  type CreateProjectInput,
  type ProjectRepository,
  ProjectStatus,
} from '@repo/data';
import { redirect } from 'next/navigation';
import { getDataClient } from '@/lib/data-client';

interface CreateProjectResult {
  success: boolean;
  data?: Partial<CreateProjectInput>;
  error?: string;
  validationErrors?: ReturnType<
    (typeof ProjectRepository)['prototype']['validateCreateProjectInput']
  >['errors'];
}

export async function createProject(
  _prevState: CreateProjectResult | null,
  formData: FormData,
): Promise<CreateProjectResult> {
  const input: CreateProjectInput = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    location: formData.get('location') as string,
    startsAt: formData.get('startsAt') as string,
    endsAt: formData.get('endsAt') as string,
    organizationId: formData.get('organizationId') as string,
    status: (formData.get('status') as ProjectStatus) ?? ProjectStatus.Draft,
  };

  const orgSlug = formData.get('orgSlug') as string;

  const data = await getDataClient();

  const { success, errors: validationErrors } =
    data.project.validateCreateProjectInput(input);
  if (!success) {
    return {
      success: false,
      data: input,
      validationErrors,
    };
  }

  return await data.project.create(input).then(() => {
    return redirect(`/${orgSlug}/projects`);
  });
}

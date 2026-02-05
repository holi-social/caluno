'use server';

import { type CreateProjectInput, ProjectStatus } from '@repo/data';
import { redirect } from 'next/navigation';
import { getDataClient } from '@/lib/data-client';

interface CreateProjectResult {
  success: boolean;
  error?: string;
}

export async function createProject(
  _prevState: CreateProjectResult | null,
  formData: FormData,
): Promise<CreateProjectResult> {
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const location = formData.get('location') as string;
  const startsAt = formData.get('startsAt') as string;
  const endsAt = formData.get('endsAt') as string;
  const organizationId = formData.get('organizationId') as string;
  const status = formData.get('status') as ProjectStatus;
  const orgSlug = formData.get('orgSlug') as string;

  // Validate required fields
  if (!title) {
    return {
      success: false,
      error: 'Project title is required',
    };
  }

  if (!description) {
    return {
      success: false,
      error: 'Project description is required',
    };
  }

  if (!location) {
    return {
      success: false,
      error: 'Project location is required',
    };
  }

  if (!startsAt) {
    return {
      success: false,
      error: 'Start date is required',
    };
  }

  if (!endsAt) {
    return {
      success: false,
      error: 'End date is required',
    };
  }

  if (!organizationId) {
    return {
      success: false,
      error: 'Organization ID is required',
    };
  }

  // Validate date logic
  const startDate = new Date(startsAt);
  const endDate = new Date(endsAt);

  if (endDate <= startDate) {
    return {
      success: false,
      error: 'End date must be after start date',
    };
  }

  // Build input object
  const input: CreateProjectInput = {
    title,
    description,
    location,
    startsAt,
    endsAt,
    organizationId,
    status: status || ProjectStatus.Draft,
  };

  const data = await getDataClient();
  return await data.project.create(input).then(() => {
    return redirect(`/${orgSlug}/projects`);
  });
}

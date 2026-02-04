'use server';

import type { CreateShiftInput } from '@repo/data';
import { ShiftVisibility } from '@repo/data';
import { redirect } from 'next/navigation';
import { getDataClient } from '@/lib/data-client';
import type { CreateShiftFormValues } from './schema';

interface CreateShiftResult {
  success: boolean;
  error?: string;
}

export async function createShift(
  orgSlug: string,
  formData: CreateShiftFormValues,
): Promise<CreateShiftResult> {
  if (!formData.title) {
    return {
      success: false,
      error: 'Shift title is required',
    };
  }

  if (!formData.startsAt) {
    return {
      success: false,
      error: 'Start time is required',
    };
  }

  if (!formData.endsAt) {
    return {
      success: false,
      error: 'End time is required',
    };
  }

  if (!formData.instructions) {
    return {
      success: false,
      error: 'Instructions are required',
    };
  }

  try {
    const data = await getDataClient();

    const input: CreateShiftInput = {
      title: formData.title,
      startsAt: new Date(formData.startsAt).toISOString(),
      endsAt: new Date(formData.endsAt).toISOString(),
      instructions: formData.instructions,
      location: formData.location,
      visibility:
        (formData.visibility as ShiftVisibility) || ShiftVisibility.AllMembers,
      projectId: formData.projectId,
    };

    await data.shift.create(input);

    redirect(`/${orgSlug}/shifts`);
  } catch (error) {
    console.error('Create shift error:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to create shift. Please try again.',
    };
  }
}

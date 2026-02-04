'use server';

import type { CreateOrganizationInput } from '@repo/data';
import { redirect } from 'next/navigation';
import { getDataClient } from '@/lib/data-client';

interface CreateOrganizationResult {
  success: boolean;
  error?: string;
}

export async function createOrganization(
  _prevState: CreateOrganizationResult | null,
  formData: FormData,
): Promise<CreateOrganizationResult> {
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string;
  const websiteUrl = formData.get('websiteUrl') as string;
  const address = formData.get('address') as string;

  if (!name) {
    return {
      success: false,
      error: 'Organization name is required',
    };
  }

  const input: CreateOrganizationInput = {
    name,
    description: description || undefined,
    email: email || undefined,
    phone: phone || undefined,
    websiteUrl: websiteUrl || undefined,
    address: address || undefined,
  };

  const data = await getDataClient();
  return await data.organization
    .create(input)
    .then((org) => {
      return redirect(`/${org.slug}/shifts`);
    })
    .catch((error) => {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create organization. Please try again.',
      };
    });
}

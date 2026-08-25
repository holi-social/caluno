'use server';

import type { CreateOrganizationInput } from '@repo/data';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getDataClient } from '@/lib/data-client';

interface CreateOrganizationResult {
  success: boolean;
  error?: string;
}

export async function createOrganization(
  _prevState: CreateOrganizationResult | null,
  formData: FormData,
): Promise<CreateOrganizationResult> {
  const t = await getTranslations('Organization.create');
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const contactEmail = formData.get('contactEmail') as string;
  const phone = formData.get('phone') as string;
  const websiteUrl = formData.get('websiteUrl') as string;
  const address = formData.get('address') as string;
  const logoFileId = (formData.get('logoFileId') as string) || undefined;

  if (!name) {
    return { success: false, error: t('errors.nameRequired') };
  }

  const input: CreateOrganizationInput = {
    name,
    description: description || undefined,
    contactEmail: contactEmail || undefined,
    phone: phone || undefined,
    websiteUrl: websiteUrl || undefined,
    address: address || undefined,
    logoFileId: logoFileId || null,
  };

  const data = await getDataClient();

  let org: { id: string; root: { id: string } };

  try {
    org = await data.organization.create(input);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : t('errors.generic'),
    };
  }

  if (!org.root.id) {
    return {
      success: false,
      error: t('errors.rootNotResolved'),
    };
  }

  redirect(`/admin/${org.root.id}`);
}

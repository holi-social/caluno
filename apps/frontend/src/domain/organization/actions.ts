'use server';

import type {
  CreateOrganizationInput,
  UpdateOrganizationUnitInput,
} from '@repo/data';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getDataClient } from '@/lib/data-client';
import { actionClient } from '@/lib/safe-action';
import { updateOrganizationSchema } from './schemas';

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

export const updateOrganizationProfile = actionClient
  .inputSchema(updateOrganizationSchema)
  .action(async ({ parsedInput }) => {
    const data = await getDataClient({
      orgUId: parsedInput.organizationUnitId,
    });

    // Only the profile fields: the unit update leaves omitted fields (name,
    // type, description, logo) untouched.
    const input: UpdateOrganizationUnitInput = {
      organizationId: parsedInput.organizationId,
      address: parsedInput.address || null,
      city: parsedInput.city || null,
      zipCode: parsedInput.zipCode || null,
      legalRep: parsedInput.legalRep || null,
      contactEmail: parsedInput.contactEmail || null,
      phone: parsedInput.phone || null,
      websiteUrl: parsedInput.websiteUrl || null,
    };

    const unit = await data.organizationUnit.update(
      parsedInput.rootUnitId,
      input,
    );

    // Settings isn't a logo editor, but the organization row's logo is still
    // read elsewhere (e.g. the join header). Carry the existing value through
    // so saving the profile doesn't silently drop it.
    await data.organization.update(parsedInput.organizationId, {
      logoUrl: parsedInput.logoUrl ?? null,
    });

    return unit;
  });

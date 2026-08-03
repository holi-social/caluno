'use client';

import { Button, Input } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { useActionState, useState } from 'react';
import { FileUpload } from '@/components/storage/file-upload';
import { createOrganization } from '@/domain/organization/actions';

export function CreateOrganizationForm() {
  const [state, formAction, isPending] = useActionState(
    createOrganization,
    null,
  );
  const [logoFileId, setLogoFileId] = useState<string | undefined>();
  const t = useTranslations('Organization.create');
  const tUpload = useTranslations('Storage.upload');

  return (
    <form action={formAction} className="mt-8 space-y-6">
      {state?.error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <input type="hidden" name="logoFileId" value={logoFileId ?? ''} />

      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            {t('nameLabel')} <span className="text-destructive">*</span>
          </label>
          <Input
            id="name"
            name="name"
            type="text"
            required
            className="mt-1"
            placeholder={t('namePlaceholder')}
            disabled={isPending}
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium">
            {t('descriptionLabel')}
          </label>
          <Input
            id="description"
            name="description"
            type="text"
            className="mt-1"
            placeholder={t('descriptionPlaceholder')}
            disabled={isPending}
          />
        </div>

        <FileUpload
          purpose="organization_logo"
          label={t('logoLabel')}
          description={tUpload('imageHint')}
          value={logoFileId}
          disabled={isPending}
          onUploaded={(result) => setLogoFileId(result.fileId)}
          onClear={() => setLogoFileId(undefined)}
        />

        <div>
          <label htmlFor="contactEmail" className="block text-sm font-medium">
            {t('emailLabel')}
          </label>
          <Input
            id="contactEmail"
            name="contactEmail"
            type="email"
            className="mt-1"
            placeholder={t('emailPlaceholder')}
            disabled={isPending}
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium">
            {t('phoneLabel')}
          </label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            className="mt-1"
            placeholder={t('phonePlaceholder')}
            disabled={isPending}
          />
        </div>

        <div>
          <label htmlFor="websiteUrl" className="block text-sm font-medium">
            {t('websiteLabel')}
          </label>
          <Input
            id="websiteUrl"
            name="websiteUrl"
            type="url"
            className="mt-1"
            placeholder={t('websitePlaceholder')}
            disabled={isPending}
          />
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium">
            {t('addressLabel')}
          </label>
          <Input
            id="address"
            name="address"
            type="text"
            className="mt-1"
            placeholder={t('addressPlaceholder')}
            disabled={isPending}
          />
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? t('submitting') : t('submit')}
      </Button>
    </form>
  );
}

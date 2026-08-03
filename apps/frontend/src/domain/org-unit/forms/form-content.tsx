'use client';

import type { OrganizationUnitType } from '@repo/data';
import { Field, FieldError, FieldLabel, Input, Textarea } from '@repo/ui';
import { useTranslations } from 'next-intl';
import type { UseFormReturn } from 'react-hook-form';
import { FileUpload } from '@/components/storage/file-upload';
import type { CreateOrgUnitFormValues } from '../schemas';

interface Props {
  types: OrganizationUnitType[];
  isPending?: boolean;
  logoPreviewUrl?: string | null;
  formReturnValues: UseFormReturn<CreateOrgUnitFormValues>;
}

export function OrgUnitFormContent({
  types: _types,
  isPending,
  logoPreviewUrl,
  formReturnValues,
}: Props) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = formReturnValues;
  const t = useTranslations('OrgUnit.form');
  const tUpload = useTranslations('Storage.upload');

  return (
    <>
      <Field>
        <FieldLabel htmlFor="name">
          {t('nameLabel')} <span className="text-destructive">*</span>
        </FieldLabel>
        <Input
          id="name"
          placeholder={t('namePlaceholder')}
          disabled={isPending}
          aria-invalid={!!errors.name}
          {...register('name')}
        />
        {errors.name && <FieldError>{errors.name.message}</FieldError>}
      </Field>

      {/* Can be re-integrated later when OrgUnitTypes are implemented
      <Field>
        <FieldLabel htmlFor="type">
          {t('typeLabel')} <span className="text-destructive">*</span>
        </FieldLabel>

        <Select
          {...register('typeId')}
          value={watch('typeId')}
          onValueChange={(value) =>
            setValue('typeId', value, { shouldValidate: true })
          }
          disabled={isPending}
        >
          <SelectTrigger id="type" aria-invalid={!!errors.typeId}>
            <SelectValue placeholder={t('typePlaceholder')} />
          </SelectTrigger>

          <SelectContent>
            {types.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {errors.typeId && <FieldError>{errors.typeId.message}</FieldError>}
      </Field>
      */}

      <input type="hidden" {...register('typeId')} />
      {errors.typeId && <FieldError>{errors.typeId.message}</FieldError>}

      <Field>
        <FieldLabel htmlFor="contactEmail">{t('emailLabel')}</FieldLabel>
        <Input
          id="contactEmail"
          type="email"
          placeholder={t('emailPlaceholder')}
          disabled={isPending}
          aria-invalid={!!errors.contactEmail}
          {...register('contactEmail')}
        />
        {errors.contactEmail && (
          <FieldError>{errors.contactEmail.message}</FieldError>
        )}
      </Field>

      <Field>
        <FieldLabel htmlFor="phone">{t('phoneLabel')}</FieldLabel>
        <Input
          id="phone"
          type="tel"
          placeholder={t('phonePlaceholder')}
          disabled={isPending}
          aria-invalid={!!errors.phone}
          {...register('phone')}
        />
        {errors.phone && <FieldError>{errors.phone.message}</FieldError>}
      </Field>

      <Field>
        <FieldLabel htmlFor="website">{t('websiteLabel')}</FieldLabel>
        <Input
          id="website"
          type="url"
          placeholder={t('websitePlaceholder')}
          disabled={isPending}
          aria-invalid={!!errors.websiteUrl}
          {...register('websiteUrl')}
        />
        {errors.websiteUrl && (
          <FieldError>{errors.websiteUrl.message}</FieldError>
        )}
      </Field>

      <FileUpload
        purpose="org_logo"
        organizationUnitId={watch('organizationUnitId')}
        label={t('logoLabel')}
        description={tUpload('imageHint')}
        value={watch('logoFileId')}
        initialPreviewUrl={logoPreviewUrl}
        disabled={isPending}
        error={errors.logoFileId?.message}
        onUploaded={(result) => {
          setValue('logoFileId', result.fileId, { shouldValidate: true });
        }}
        onClear={() => {
          setValue('logoFileId', null, { shouldValidate: true });
        }}
      />

      <Field>
        <FieldLabel htmlFor="address">{t('addressLabel')}</FieldLabel>
        <Input
          id="address"
          placeholder={t('addressPlaceholder')}
          disabled={isPending}
          aria-invalid={!!errors.address}
          {...register('address')}
        />
        {errors.address && <FieldError>{errors.address.message}</FieldError>}
      </Field>

      <Field>
        <FieldLabel htmlFor="description">{t('descriptionLabel')}</FieldLabel>
        <Textarea
          id="description"
          placeholder={t('descriptionPlaceholder')}
          disabled={isPending}
          aria-invalid={!!errors.description}
          {...register('description')}
        />
        {errors.description && (
          <FieldError>{errors.description.message}</FieldError>
        )}
      </Field>
    </>
  );
}

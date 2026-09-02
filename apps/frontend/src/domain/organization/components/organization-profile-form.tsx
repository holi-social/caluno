'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useCurrentOrg, useOrgUId } from '@repo/data/react';
import { Button, Field, FieldError, FieldLabel, Input } from '@repo/ui';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { updateOrganization } from '@/domain/organization/actions';
import {
  type UpdateOrganizationFormValues,
  updateOrganizationSchema,
} from '@/domain/organization/schemas';

interface OrganizationProfileFormProps {
  organization: {
    address?: string | null;
    city?: string | null;
    zipCode?: string | null;
    contactEmail?: string | null;
    phone?: string | null;
    websiteUrl?: string | null;
    logoUrl?: string | null;
  };
}

export function OrganizationProfileForm({
  organization,
}: OrganizationProfileFormProps) {
  const organizationId = useCurrentOrg().organizationId;
  const organizationUnitId = useOrgUId();
  const t = useTranslations('Settings.organizationProfile');
  const tCommon = useTranslations('Common');
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateOrganizationFormValues>({
    resolver: zodResolver(updateOrganizationSchema),
    defaultValues: {
      organizationId,
      organizationUnitId,
      address: organization.address ?? '',
      city: organization.city ?? '',
      zipCode: organization.zipCode ?? '',
      contactEmail: organization.contactEmail ?? '',
      phone: organization.phone ?? '',
      websiteUrl: organization.websiteUrl ?? '',
    },
  });

  const onSubmit = (values: UpdateOrganizationFormValues) => {
    startTransition(async () => {
      const result = await updateOrganization({
        ...values,
        logoUrl: organization.logoUrl ?? null,
      });

      if (result?.serverError) {
        toast.error(result.serverError);
      } else {
        toast.success(t('saved'));
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4 rounded-lg border bg-card p-6">
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

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="city">{t('cityLabel')}</FieldLabel>
            <Input
              id="city"
              placeholder={t('cityPlaceholder')}
              disabled={isPending}
              aria-invalid={!!errors.city}
              {...register('city')}
            />
            {errors.city && <FieldError>{errors.city.message}</FieldError>}
          </Field>

          <Field>
            <FieldLabel htmlFor="zipCode">{t('zipCodeLabel')}</FieldLabel>
            <Input
              id="zipCode"
              placeholder={t('zipCodePlaceholder')}
              disabled={isPending}
              aria-invalid={!!errors.zipCode}
              {...register('zipCode')}
            />
            {errors.zipCode && (
              <FieldError>{errors.zipCode.message}</FieldError>
            )}
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="contactEmail">
            {t('contactEmailLabel')}
          </FieldLabel>
          <Input
            id="contactEmail"
            type="email"
            placeholder={t('contactEmailPlaceholder')}
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
          <FieldLabel htmlFor="websiteUrl">{t('websiteLabel')}</FieldLabel>
          <Input
            id="websiteUrl"
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
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          {isPending ? tCommon('saving') : tCommon('save')}
        </Button>
      </div>
    </form>
  );
}

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { GetPermissionGroupsQuery } from '@repo/data';
import { Field, FieldError, FieldLabel, Input, Textarea } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FormSheet, useFormSheet } from '@/components/form-sheet';
import { useRouter } from '@/i18n/navigation';
import { type RoleFormValues, roleSchema } from '../schemas';
import { PermissionPicker } from './permission-picker';

type PermissionGroup = GetPermissionGroupsQuery['permissionGroups'][number];

interface RoleFormProps {
  organizationUnitId: string;
  permissionGroups: PermissionGroup[];
  initialValues?: Partial<RoleFormValues>;
  mutate: (formData: RoleFormValues) => Promise<{ serverError?: string }>;
  title: string;
  description: string;
}

export function RoleForm({
  organizationUnitId,
  permissionGroups,
  mutate,
  initialValues,
  title,
  description,
}: RoleFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string>();
  const { open, setOpen } = useFormSheet();
  const t = useTranslations('Role.form');
  const tValidation = useTranslations('Role.validation');

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RoleFormValues>({
    resolver: zodResolver(
      roleSchema({
        nameMin: tValidation('nameMin'),
        permissionsRequired: tValidation('permissionsRequired'),
      }),
    ),
    defaultValues: {
      organizationUnitId,
      name: '',
      description: '',
      permissionIds: [],
      ...initialValues,
    },
  });

  const onSubmit = async (formData: RoleFormValues) => {
    setServerError(undefined);

    startTransition(async () => {
      const result = await mutate(formData);
      if (result.serverError) {
        setServerError(result.serverError);
      } else {
        await setOpen(false);
        router.refresh();
      }
    });
  };

  return (
    <FormSheet
      onSubmit={handleSubmit(onSubmit)}
      title={title}
      description={description}
      pending={pending}
      open={open}
      onOpenChange={setOpen}
      formError={serverError}
    >
      <Field>
        <FieldLabel htmlFor="name">
          {t('nameLabel')} <span className="text-destructive">*</span>
        </FieldLabel>
        <Input
          id="name"
          type="text"
          disabled={pending}
          placeholder={t('namePlaceholder')}
          aria-invalid={!!errors.name}
          {...register('name')}
        />
        {errors.name && <FieldError>{errors.name.message}</FieldError>}
      </Field>

      <Field>
        <FieldLabel htmlFor="description">{t('descriptionLabel')}</FieldLabel>
        <Textarea
          id="description"
          disabled={pending}
          placeholder={t('descriptionPlaceholder')}
          aria-invalid={!!errors.description}
          {...register('description')}
        />
        {errors.description && (
          <FieldError>{errors.description.message}</FieldError>
        )}
      </Field>

      <Field>
        <FieldLabel>
          {t('permissionsLabel')} <span className="text-destructive">*</span>
        </FieldLabel>
        <p className="text-sm text-muted-foreground">{t('permissionsHint')}</p>

        <Controller
          control={control}
          name="permissionIds"
          render={({ field }) => (
            <PermissionPicker
              groups={permissionGroups}
              selectedIds={field.value}
              onChange={field.onChange}
              disabled={pending}
            />
          )}
        />
        {errors.permissionIds && (
          <FieldError>{errors.permissionIds.message}</FieldError>
        )}
      </Field>
    </FormSheet>
  );
}

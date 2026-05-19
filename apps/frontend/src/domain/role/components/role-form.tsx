'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { GetPermissionGroupsQuery } from '@repo/data';
import { Field, FieldError, FieldLabel, Input, Textarea } from '@repo/ui';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FormSheet, useFormSheet } from '@/components/form-sheet';
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

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
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
          Name <span className="text-destructive">*</span>
        </FieldLabel>
        <Input
          id="name"
          type="text"
          disabled={pending}
          placeholder="e.g. Project Manager"
          aria-invalid={!!errors.name}
          {...register('name')}
        />
        {errors.name && <FieldError>{errors.name.message}</FieldError>}
      </Field>

      <Field>
        <FieldLabel htmlFor="description">Description</FieldLabel>
        <Textarea
          id="description"
          disabled={pending}
          placeholder="What is this role for?"
          aria-invalid={!!errors.description}
          {...register('description')}
        />
        {errors.description && (
          <FieldError>{errors.description.message}</FieldError>
        )}
      </Field>

      <Field>
        <FieldLabel>
          Permissions <span className="text-destructive">*</span>
        </FieldLabel>
        <p className="text-sm text-muted-foreground">
          Select what users with this role can do.
        </p>

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

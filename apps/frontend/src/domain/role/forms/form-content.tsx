'use client';

import { usePermissionGroups } from '@repo/data/react';
import { Field, FieldError, FieldLabel, Input, Textarea } from '@repo/ui';
import { Controller, type UseFormReturn } from 'react-hook-form';
import { PermissionPicker } from '../components/permission-picker';
import type { CreateRoleFormValues } from '../schemas';

interface FormContentProps {
  isPending?: boolean;
  formReturnValues: UseFormReturn<CreateRoleFormValues>;
}

export function FormContent({ isPending, formReturnValues }: FormContentProps) {
  const {
    register,
    control,
    formState: { errors },
  } = formReturnValues;

  const { data: permissionGroups, isLoading: permissionsLoading } =
    usePermissionGroups();

  return (
    <>
      <Field>
        <FieldLabel htmlFor="name">
          Name <span className="text-destructive">*</span>
        </FieldLabel>
        <Input
          id="name"
          type="text"
          disabled={isPending}
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
          disabled={isPending}
          placeholder="What is this role for?"
          aria-invalid={!!errors.description}
          {...register('description')}
        />
      </Field>

      <Field>
        <FieldLabel>
          Permissions <span className="text-destructive">*</span>
        </FieldLabel>
        <p className="text-sm text-muted-foreground">
          Select what users with this role can do.
        </p>
        {permissionsLoading ? (
          <div className="text-sm text-muted-foreground">
            Loading permissions...
          </div>
        ) : permissionGroups ? (
          <Controller
            control={control}
            name="permissionIds"
            render={({ field }) => (
              <PermissionPicker
                groups={permissionGroups}
                selectedIds={field.value}
                onChange={field.onChange}
                disabled={isPending}
              />
            )}
          />
        ) : null}
        {errors.permissionIds && (
          <FieldError>{errors.permissionIds.message}</FieldError>
        )}
      </Field>
    </>
  );
}

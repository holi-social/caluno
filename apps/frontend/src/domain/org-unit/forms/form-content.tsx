'use client';

import type { OrganizationUnitType } from '@repo/data';
import {
  Field,
  FieldError,
  FieldLabel,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@repo/ui';
import type { UseFormReturn } from 'react-hook-form';
import type { CreateOrgUnitFormValues } from '../schemas';

interface Props {
  types: OrganizationUnitType[];
  isPending?: boolean;
  formReturnValues: UseFormReturn<CreateOrgUnitFormValues>;
}

export function OrgUnitFormContent({
  types,
  isPending,
  formReturnValues,
}: Props) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = formReturnValues;

  return (
    <>
      <Field>
        <FieldLabel htmlFor="name">
          Name <span className="text-destructive">*</span>
        </FieldLabel>
        <Input
          id="name"
          placeholder="e.g. Marketing"
          disabled={isPending}
          aria-invalid={!!errors.name}
          {...register('name')}
        />
        {errors.name && <FieldError>{errors.name.message}</FieldError>}
      </Field>

      <Field>
        <FieldLabel htmlFor="type">
          Type <span className="text-destructive">*</span>
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
            <SelectValue placeholder="Select a type" />
          </SelectTrigger>

          <SelectContent>
            {types.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {errors.typeId && <FieldError>{errors.typeId.message}</FieldError>}
      </Field>

      <Field>
        <FieldLabel htmlFor="email">Email</FieldLabel>
        <Input
          id="email"
          type="email"
          placeholder="e.g. contact@example.com"
          disabled={isPending}
          aria-invalid={!!errors.email}
          {...register('email')}
        />
        {errors.email && <FieldError>{errors.email.message}</FieldError>}
      </Field>

      <Field>
        <FieldLabel htmlFor="phone">Phone</FieldLabel>
        <Input
          id="phone"
          type="tel"
          placeholder="e.g. +1 555 000 0000"
          disabled={isPending}
          aria-invalid={!!errors.phone}
          {...register('phone')}
        />
        {errors.phone && <FieldError>{errors.phone.message}</FieldError>}
      </Field>

      <Field>
        <FieldLabel htmlFor="website">Website URL</FieldLabel>
        <Input
          id="website"
          type="url"
          placeholder="e.g. https://example.com"
          disabled={isPending}
          aria-invalid={!!errors.websiteUrl}
          {...register('websiteUrl')}
        />
        {errors.websiteUrl && (
          <FieldError>{errors.websiteUrl.message}</FieldError>
        )}
      </Field>

      <Field>
        <FieldLabel htmlFor="logo">Logo URL</FieldLabel>
        <Input
          id="logo"
          type="url"
          placeholder="e.g. https://example.com/logo.png"
          disabled={isPending}
          aria-invalid={!!errors.logoUrl}
          {...register('logoUrl')}
        />
        {errors.logoUrl && <FieldError>{errors.logoUrl.message}</FieldError>}
      </Field>

      <Field>
        <FieldLabel htmlFor="address">Address</FieldLabel>
        <Input
          id="address"
          placeholder="e.g. 123 Main St, City"
          disabled={isPending}
          aria-invalid={!!errors.address}
          {...register('address')}
        />
        {errors.address && <FieldError>{errors.address.message}</FieldError>}
      </Field>

      <Field>
        <FieldLabel htmlFor="description">Description</FieldLabel>
        <Textarea
          id="description"
          placeholder="Describe this organizational unit..."
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

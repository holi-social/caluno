'use client';

import type { ProjectStatus } from '@repo/data';
import {
  DatePickerWithRange,
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
import type { CreateProjectFormValues } from '../schemas';

interface FormContentProps {
  isPending?: boolean;
  formReturnValues: UseFormReturn<CreateProjectFormValues>;
}

export function FormContent({ isPending, formReturnValues }: FormContentProps) {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = formReturnValues;

  return (
    <>
      {/* Title field */}
      <Field>
        <FieldLabel htmlFor="title">
          Project Title <span className="text-destructive">*</span>
        </FieldLabel>
        <Input
          id="title"
          type="text"
          disabled={isPending}
          placeholder="Project Title"
          aria-invalid={!!errors.title}
          {...register('title')}
        />
        {errors.title && <FieldError>{errors.title.message}</FieldError>}
      </Field>

      {/* Description field */}
      <Field>
        <FieldLabel htmlFor="description">
          Description <span className="text-destructive">*</span>
        </FieldLabel>
        <Textarea
          id="description"
          rows={8}
          disabled={isPending}
          placeholder="Provide a detailed description of the project..."
          aria-invalid={!!errors.description}
          {...register('description')}
        />
        {errors.description && (
          <FieldError>{errors.description.message}</FieldError>
        )}
      </Field>

      {/* Location field */}
      <Field>
        <FieldLabel htmlFor="location">
          Location <span className="text-destructive">*</span>
        </FieldLabel>
        <Input
          id="location"
          type="text"
          disabled={isPending}
          placeholder="123 Main Street, City, State"
          aria-invalid={!!errors.location}
          {...register('location')}
        />
        {errors.location && <FieldError>{errors.location.message}</FieldError>}
      </Field>

      {/* Date range field */}
      <Field>
        <FieldLabel htmlFor="date-picker-range">
          Date Picker Range <span className="text-destructive">*</span>
        </FieldLabel>
        <DatePickerWithRange
          id="date-picker-range"
          value={{
            from: watch('startsAt') ? watch('startsAt') : undefined,
            to: watch('endsAt') ? watch('endsAt') : undefined,
          }}
          aria-invalid={!!errors.startsAt || !!errors.endsAt}
          onChange={(dateRange) => {
            setValue('startsAt', dateRange?.from as Date, {
              shouldValidate: true,
            });
            setValue('endsAt', dateRange?.to as Date, {
              shouldValidate: true,
            });
          }}
        />
        {errors.startsAt && <FieldError>{errors.startsAt.message}</FieldError>}
        {errors.endsAt && <FieldError>{errors.endsAt.message}</FieldError>}
      </Field>

      {/* Status field */}
      <Field>
        <FieldLabel htmlFor="status">Status</FieldLabel>
        <Select
          name="status"
          defaultValue="DRAFT"
          value={watch('status')}
          onValueChange={(value) => setValue('status', value as ProjectStatus)}
          disabled={isPending}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
            <SelectItem value="EXPIRED">Expired</SelectItem>
          </SelectContent>
        </Select>
      </Field>
    </>
  );
}

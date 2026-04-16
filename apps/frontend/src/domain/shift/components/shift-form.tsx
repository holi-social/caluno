'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  Card,
  DatePickerWithTimeRange,
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  Switch,
  Textarea,
} from '@repo/ui';
import { type Resolver, useForm } from 'react-hook-form';
import { type ShiftFormValues, shiftFormSchema } from '../schemas';
import { RecurrenceSelect } from './recurrence-select';

type FormProps = {
  organizationUnitId: string;
  onSubmit: (formData: ShiftFormValues) => void;
  isPending?: boolean;
  initialValues?: Partial<ShiftFormValues>;
  formId?: string;
  defaultLocation?: string;
};

export const ShiftForm = ({
  organizationUnitId,
  isPending = false,
  onSubmit,
  initialValues,
  formId,
  defaultLocation,
}: FormProps) => {
  const form = useForm<ShiftFormValues>({
    resolver: zodResolver(shiftFormSchema) as Resolver<ShiftFormValues>,
    defaultValues: {
      name: '',
      location: defaultLocation ?? '',
      instructions: '',
      openShift: true,
      organizationUnitId,
      invitedMemberIds: [],
      recurrenceDays: [],
      ...initialValues,
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const startsAt = watch('startsAt');
  const endsAt = watch('endsAt');

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field>
        <FieldLabel htmlFor="name">
          Shift name <span className="text-destructive">*</span>
        </FieldLabel>
        <Input
          id="name"
          disabled={isPending}
          placeholder="e.g. Morning cashier shift"
          aria-invalid={!!errors.name}
          {...register('name')}
        />
        {errors.name && <FieldError>{errors.name.message}</FieldError>}
      </Field>

      <Field>
        <FieldLabel>
          Date and time<span className="text-destructive"> *</span>
        </FieldLabel>
        <DatePickerWithTimeRange
          value={{ start: startsAt ?? null, end: endsAt ?? null }}
          onChange={(start, end) => {
            setValue('startsAt', start as Date, { shouldValidate: true });
            setValue('endsAt', end as Date, { shouldValidate: true });
          }}
          errors={[errors.startsAt?.message, errors.endsAt?.message]}
          disabled={isPending}
        />
      </Field>

      <RecurrenceSelect
        value={watch('recurrenceDays')}
        onChange={(days) =>
          setValue('recurrenceDays', days as ShiftFormValues['recurrenceDays'])
        }
        disabled={isPending}
      />

      <Field>
        <FieldLabel htmlFor="location">Location</FieldLabel>
        <Input
          id="location"
          disabled={isPending}
          placeholder="Main Hall, 123 Main St"
          aria-invalid={!!errors.location}
          {...register('location')}
        />
        {errors.location && <FieldError>{errors.location.message}</FieldError>}
      </Field>

      <Field>
        <FieldLabel htmlFor="instructions">Instructions</FieldLabel>
        <Textarea
          id="instructions"
          rows={4}
          placeholder="Describe volunteers' responsibilities and requirements for this shift"
          disabled={isPending}
          aria-invalid={!!errors.instructions}
          {...register('instructions')}
        />
        {errors.instructions && (
          <FieldError>{errors.instructions.message}</FieldError>
        )}
      </Field>

      <Card className="rounded-md p-4 space-y-3">
        <Field orientation="horizontal">
          <FieldContent>
            <FieldLabel htmlFor="openShift">Open shift</FieldLabel>
            <FieldDescription>
              Any volunteer can sign up for this shift
            </FieldDescription>
          </FieldContent>
          <Switch
            id="openShift"
            checked={watch('openShift')}
            onCheckedChange={(checked) => setValue('openShift', checked)}
            disabled={isPending}
          />
        </Field>

        {watch('openShift') && (
          <Field>
            <FieldLabel htmlFor="maxVolunteers">Max volunteers</FieldLabel>
            <Input
              id="maxVolunteers"
              type="number"
              min={1}
              disabled={isPending}
              placeholder="e.g. 50"
              aria-invalid={!!errors.maxVolunteers}
              {...register('maxVolunteers')}
            />
            <FieldDescription>
              Maximum number of people allowed to sign up
            </FieldDescription>
            {errors.maxVolunteers && (
              <FieldError>{errors.maxVolunteers.message}</FieldError>
            )}
          </Field>
        )}
      </Card>
    </form>
  );
};

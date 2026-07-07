'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  DatePickerWithTimeRange,
  Field,
  FieldError,
  FieldLabel,
  Input,
  Textarea,
} from '@repo/ui';
import { useTranslations } from 'next-intl';
import { type Resolver, useForm } from 'react-hook-form';
import {
  type ShiftInstanceFormValues,
  shiftInstanceFormSchema,
} from '../schemas';

type ShiftInstanceFormProps = {
  onSubmit: (formData: ShiftInstanceFormValues) => void;
  isPending?: boolean;
  initialValues?: Partial<ShiftInstanceFormValues>;
  formId?: string;
};

export function ShiftInstanceForm({
  isPending = false,
  onSubmit,
  initialValues,
  formId,
}: ShiftInstanceFormProps) {
  const t = useTranslations('Shift');

  const schema = shiftInstanceFormSchema({
    nameRequired: t('validation.nameRequired'),
    startTimeRequired: t('validation.startTimeRequired'),
    endTimeRequired: t('validation.endTimeRequired'),
    minMaxVolunteers: t('validation.minMaxVolunteers'),
  });

  const form = useForm<ShiftInstanceFormValues>({
    resolver: zodResolver(schema) as Resolver<ShiftInstanceFormValues>,
    defaultValues: {
      name: '',
      location: '',
      instructions: '',
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
          {t('form.nameLabel')} <span className="text-destructive">*</span>
        </FieldLabel>
        <Input
          id="name"
          disabled={isPending}
          placeholder={t('form.namePlaceholder')}
          aria-invalid={!!errors.name}
          {...register('name')}
        />
        {errors.name && <FieldError>{errors.name.message}</FieldError>}
      </Field>

      <Field>
        <FieldLabel>
          {t('form.dateTimeLabel')}
          <span className="text-destructive"> *</span>
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

      <Field>
        <FieldLabel htmlFor="location">{t('form.locationLabel')}</FieldLabel>
        <Input
          id="location"
          disabled={isPending}
          placeholder={t('form.locationPlaceholder')}
          aria-invalid={!!errors.location}
          {...register('location')}
        />
        {errors.location && <FieldError>{errors.location.message}</FieldError>}
      </Field>

      <Field>
        <FieldLabel htmlFor="instructions">
          {t('form.instructionsLabel')}
        </FieldLabel>
        <Textarea
          id="instructions"
          rows={4}
          placeholder={t('form.instructionsPlaceholder')}
          disabled={isPending}
          aria-invalid={!!errors.instructions}
          {...register('instructions')}
        />
        {errors.instructions && (
          <FieldError>{errors.instructions.message}</FieldError>
        )}
      </Field>
    </form>
  );
}

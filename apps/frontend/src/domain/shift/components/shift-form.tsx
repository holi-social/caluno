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
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('Shift');

  const schema = shiftFormSchema({
    nameRequired: t('validation.nameRequired'),
    startTimeRequired: t('validation.startTimeRequired'),
    endTimeRequired: t('validation.endTimeRequired'),
    organizationUnitRequired: t('validation.organizationUnitRequired'),
    organizationUnitIdRequired: t('validation.organizationUnitRequired'),
    shiftIdRequired: t('validation.shiftIdRequired'),
    minMaxVolunteers: t('validation.minMaxVolunteers'),
  });

  const form = useForm<ShiftFormValues>({
    resolver: zodResolver(schema) as Resolver<ShiftFormValues>,
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

      <RecurrenceSelect
        value={watch('recurrenceDays')}
        onChange={(days) =>
          setValue('recurrenceDays', days as ShiftFormValues['recurrenceDays'])
        }
        disabled={isPending}
      />

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
      <Card className="rounded-md p-4 space-y-3">
        <Field orientation="horizontal">
          <FieldContent>
            <FieldLabel htmlFor="openShift">
              {t('form.openShiftLabel')}
            </FieldLabel>

            <FieldDescription>
              {t('form.openShiftDescription')}
            </FieldDescription>
          </FieldContent>

          <Switch
            id="openShift"
            checked={watch('openShift')}
            onCheckedChange={(checked) => setValue('openShift', checked)}
            disabled={isPending}
          />
        </Field>
      </Card>
    </form>
  );
};

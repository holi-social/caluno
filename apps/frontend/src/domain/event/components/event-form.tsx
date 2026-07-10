'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  DatePickerWithTimeRange,
  Field,
  FieldError,
  FieldLabel,
  Input,
} from '@repo/ui';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { FormSheet, useFormSheet } from '@/components/form-sheet';
import { useRouter } from '@/i18n/navigation';
import { type EventFormValues, eventFormSchema } from '../schemas';

interface EventFormProps {
  title: string;
  description: string;
  initialValues?: Partial<EventFormValues>;
  mutate: (data: EventFormValues) => Promise<{ serverError?: string }>;
}

export const EventForm = ({
  title,
  description,
  initialValues,
  mutate,
}: EventFormProps) => {
  const router = useRouter();
  const t = useTranslations('Event.form');
  const tValidation = useTranslations('Event.form.validation');
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string>();

  const { open, setOpen } = useFormSheet();

  const schema = eventFormSchema({
    titleRequired: tValidation('titleRequired'),
    startRequired: tValidation('startRequired'),
    endRequired: tValidation('endRequired'),
    endAfterStart: tValidation('endAfterStart'),
    invalidUrl: tValidation('invalidUrl'),
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EventFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      location: '',
      logoUrl: '',
      coverUrl: '',
      ...initialValues,
    },
  });

  const startsAt = watch('startsAt');
  const endsAt = watch('endsAt');

  const onSubmit = async (formData: EventFormValues) => {
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
        <FieldLabel htmlFor="event-title">
          {t('titleLabel')} <span className="text-destructive">*</span>
        </FieldLabel>
        <Input
          id="event-title"
          disabled={pending}
          placeholder={t('titlePlaceholder')}
          aria-invalid={!!errors.title}
          {...register('title')}
        />
        {errors.title && <FieldError>{errors.title.message}</FieldError>}
      </Field>

      <Field>
        <FieldLabel>
          {t('startsAtLabel')} / {t('endsAtLabel')}
          <span className="text-destructive"> *</span>
        </FieldLabel>
        <DatePickerWithTimeRange
          value={{ start: startsAt ?? null, end: endsAt ?? null }}
          onChange={(start, end) => {
            setValue('startsAt', start as Date, { shouldValidate: true });
            setValue('endsAt', end as Date, { shouldValidate: true });
          }}
          errors={[errors.startsAt?.message, errors.endsAt?.message]}
          disabled={pending}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="event-location">{t('locationLabel')}</FieldLabel>
        <Input
          id="event-location"
          disabled={pending}
          placeholder={t('locationLabel')}
          aria-invalid={!!errors.location}
          {...register('location')}
        />
        {errors.location && <FieldError>{errors.location.message}</FieldError>}
      </Field>

      <Field>
        <FieldLabel htmlFor="event-logo-url">{t('logoUrlLabel')}</FieldLabel>
        <Input
          id="event-logo-url"
          disabled={pending}
          placeholder="https://"
          aria-invalid={!!errors.logoUrl}
          {...register('logoUrl')}
        />
        {errors.logoUrl && <FieldError>{errors.logoUrl.message}</FieldError>}
      </Field>

      <Field>
        <FieldLabel htmlFor="event-cover-url">{t('coverUrlLabel')}</FieldLabel>
        <Input
          id="event-cover-url"
          disabled={pending}
          placeholder="https://"
          aria-invalid={!!errors.coverUrl}
          {...register('coverUrl')}
        />
        {errors.coverUrl && <FieldError>{errors.coverUrl.message}</FieldError>}
      </Field>
    </FormSheet>
  );
};

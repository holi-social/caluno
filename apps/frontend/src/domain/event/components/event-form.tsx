'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useOrgUId } from '@repo/data/react';
import {
  DatePickerWithRange,
  Field,
  FieldError,
  FieldLabel,
  Input,
} from '@repo/ui';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { FormSheet, useFormSheet } from '@/components/form-sheet';
import { FileUpload } from '@/domain/storage/components/file-upload';
import { useRouter } from '@/i18n/navigation';
import { inviteEventPath } from '../routes';
import { type EventFormValues, eventFormSchema } from '../schemas';

interface EventFormProps {
  title: string;
  description: string;
  orgUId: string;
  initialValues?: Partial<EventFormValues>;
  logoPreviewUrl?: string | null;
  coverPreviewUrl?: string | null;
  mutate: (
    data: EventFormValues,
  ) => Promise<{ serverError?: string; data?: { id: string } }>;
  redirectToInviteOnCreate?: boolean;
}

export const EventForm = ({
  title,
  description,
  orgUId,
  initialValues = {},
  logoPreviewUrl,
  coverPreviewUrl,
  mutate,
  redirectToInviteOnCreate = false,
}: EventFormProps) => {
  const router = useRouter();
  const organizationUnitId = useOrgUId();
  const t = useTranslations('Event.form');
  const tValidation = useTranslations('Event.form.validation');
  const tUpload = useTranslations('Storage.upload');
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string>();

  const { open, setOpen } = useFormSheet();

  const schema = eventFormSchema({
    titleRequired: tValidation('titleRequired'),
    startRequired: tValidation('startRequired'),
    endRequired: tValidation('endRequired'),
    endAfterStart: tValidation('endAfterStart'),
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
      logoFileId: undefined,
      coverFileId: undefined,
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
      } else if (redirectToInviteOnCreate && result.data?.id) {
        await setOpen(false, () => null);
        router.replace(inviteEventPath(orgUId, result.data.id));
        router.refresh();
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
        <DatePickerWithRange
          id="event-dates"
          value={{ start: startsAt ?? null, end: endsAt ?? null }}
          onChange={(start, end) => {
            setValue('startsAt', start as Date, { shouldValidate: true });
            setValue('endsAt', end as Date, { shouldValidate: true });
          }}
          errors={[errors.startsAt?.message, errors.endsAt?.message]}
          includeTime
          disabled={pending}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="event-location">{t('locationLabel')}</FieldLabel>
        <Input
          id="event-location"
          disabled={pending}
          placeholder={t('locationPlaceholder')}
          aria-invalid={!!errors.location}
          {...register('location')}
        />
        {errors.location && <FieldError>{errors.location.message}</FieldError>}
      </Field>

      <FileUpload
        purpose="event_image"
        organizationUnitId={organizationUnitId}
        label={t('logoUrlLabel')}
        description={tUpload('imageHint')}
        value={watch('logoFileId')}
        initialPreviewUrl={logoPreviewUrl}
        disabled={pending}
        onUploaded={(result) => {
          setValue('logoFileId', result.fileId, { shouldValidate: true });
        }}
        onClear={() => {
          setValue('logoFileId', null, { shouldValidate: true });
        }}
      />

      <FileUpload
        purpose="event_image"
        organizationUnitId={organizationUnitId}
        label={t('coverUrlLabel')}
        description={tUpload('imageHint')}
        value={watch('coverFileId')}
        initialPreviewUrl={coverPreviewUrl}
        disabled={pending}
        onUploaded={(result) => {
          setValue('coverFileId', result.fileId, { shouldValidate: true });
        }}
        onClear={() => {
          setValue('coverFileId', null, { shouldValidate: true });
        }}
      />
    </FormSheet>
  );
};

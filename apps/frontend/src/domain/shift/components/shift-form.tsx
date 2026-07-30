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
import { CalendarClockIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { type Resolver, useForm } from 'react-hook-form';
import { FormSheet, useFormSheet } from '@/components/form-sheet';
import { FileUpload } from '@/domain/storage/components/file-upload';
import { useRouter } from '@/i18n/navigation';
import { useFormatting } from '@/lib/formatting/use-formatting';
import { resolveCreateShiftSuccessNavigation } from '../create-shift-flow';
import { shiftInvitePath } from '../routes';
import { type ShiftFormValues, shiftFormSchema } from '../schemas';
import { RecurrenceSelect } from './recurrence-select';

interface ShiftFormProps {
  title: string;
  description: string;
  orgUId: string;
  initialValues?: Partial<ShiftFormValues>;
  mutate: (data: ShiftFormValues) => Promise<{
    serverError?: string;
    data?: { id: string; instanceId?: string };
  }>;
  defaultLocation?: string;
  redirectToInviteOnCreate?: boolean;
  event?: { title: string; startsAt: Date; endsAt: Date };
  imagePreviewUrl?: string | null;
}

export const ShiftForm = ({
  title,
  description,
  orgUId,
  initialValues,
  mutate,
  defaultLocation,
  redirectToInviteOnCreate = false,
  event,
  imagePreviewUrl,
}: ShiftFormProps) => {
  const router = useRouter();
  const t = useTranslations('Shift');
  const tUpload = useTranslations('Storage.upload');
  const { formatRange } = useFormatting();
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string>();

  const { open, setOpen } = useFormSheet();

  const schema = shiftFormSchema(
    {
      nameRequired: t('validation.nameRequired'),
      startTimeRequired: t('validation.startTimeRequired'),
      endTimeRequired: t('validation.endTimeRequired'),
      windowViolation: t('validation.windowViolation'),
      minMaxVolunteers: t('validation.minMaxVolunteers'),
    },
    event,
  );

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    formState: { errors },
  } = useForm<ShiftFormValues>({
    resolver: zodResolver(schema) as Resolver<ShiftFormValues>,
    defaultValues: {
      name: '',
      location: defaultLocation ?? '',
      instructions: '',
      openShift: true,
      invitedMemberIds: [],
      recurrenceDays: [],
      imageFileId: undefined,
      ...initialValues,
    },
  });

  const startsAt = watch('startsAt');
  const endsAt = watch('endsAt');

  const onSubmit = async (formData: ShiftFormValues) => {
    setServerError(undefined);

    startTransition(async () => {
      const result = await mutate(formData);

      if (result.serverError === 'shift_window_violation') {
        setError('endsAt', { message: t('validation.windowViolation') });
        return;
      }

      if (result.serverError) {
        setServerError(result.serverError);
        return;
      }

      if (redirectToInviteOnCreate && result.data) {
        const navigation = resolveCreateShiftSuccessNavigation({
          shiftId: result.data.id,
          instanceId: result.data.instanceId,
        });

        if (navigation.action === 'open-invite') {
          await setOpen(false, () => null);
          router.replace(
            shiftInvitePath(orgUId, navigation.shiftId, navigation.instanceId),
          );
          router.refresh();
          return;
        }
      }

      await setOpen(false);
      router.refresh();
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
      {event && (
        <div className="flex gap-2 items-center rounded-md border bg-muted/50 p-3">
          <CalendarClockIcon />
          <div>
            <p className="font-bold">{event.title}</p>
            <p className="text-xs text-muted-foreground">
              {t('form.timeRangeConstraint', {
                window: formatRange(event.startsAt, event.endsAt),
              })}
            </p>
          </div>
        </div>
      )}

      <Field>
        <FieldLabel htmlFor="name">
          {t('form.nameLabel')} <span className="text-destructive">*</span>
        </FieldLabel>
        <Input
          id="name"
          disabled={pending}
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
          disabled={pending}
          minDate={event?.startsAt}
          maxDate={event?.endsAt}
        />
      </Field>

      <RecurrenceSelect
        value={watch('recurrenceDays')}
        onChange={(days) => {
          if (event) return;
          setValue('recurrenceDays', days as ShiftFormValues['recurrenceDays']);
        }}
        disabled={!!event || pending}
      />

      <Field>
        <FieldLabel htmlFor="location">{t('form.locationLabel')}</FieldLabel>
        <Input
          id="location"
          disabled={pending}
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
          disabled={pending}
          aria-invalid={!!errors.instructions}
          {...register('instructions')}
        />
        {errors.instructions && (
          <FieldError>{errors.instructions.message}</FieldError>
        )}
      </Field>

      <FileUpload
        purpose="shift_image"
        organizationUnitId={orgUId}
        label={t('form.imageLabel')}
        description={tUpload('imageHint')}
        value={watch('imageFileId')}
        initialPreviewUrl={imagePreviewUrl}
        disabled={pending}
        onUploaded={(result) => {
          setValue('imageFileId', result.fileId, { shouldValidate: true });
        }}
        onClear={() => {
          setValue('imageFileId', null, { shouldValidate: true });
        }}
      />

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
            disabled={pending}
          />
        </Field>
      </Card>

      <div className="flex gap-3">
        <Field className="flex-1">
          <FieldLabel htmlFor="minVolunteers">
            {t('form.minVolunteersLabel')}
          </FieldLabel>
          <Input
            id="minVolunteers"
            type="number"
            min={0}
            placeholder={t('form.minVolunteersPlaceholder')}
            disabled={pending}
            {...register('minVolunteers', {
              setValueAs: (v) => (v === '' || v == null ? null : Number(v)),
            })}
          />
          <FieldDescription>
            {t('form.minVolunteersDescription')}
          </FieldDescription>
        </Field>
        <Field className="flex-1">
          <FieldLabel htmlFor="maxVolunteers">
            {t('form.maxVolunteersLabel')}
          </FieldLabel>
          <Input
            id="maxVolunteers"
            type="number"
            min={0}
            placeholder={t('form.maxVolunteersPlaceholder')}
            disabled={pending}
            {...register('maxVolunteers', {
              setValueAs: (v) => (v === '' || v == null ? null : Number(v)),
            })}
          />
          <FieldDescription>
            {t('form.maxVolunteersDescription')}
          </FieldDescription>
          <FieldError errors={[errors.maxVolunteers]} />
        </Field>
      </div>
    </FormSheet>
  );
};

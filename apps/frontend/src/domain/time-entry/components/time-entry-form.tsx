'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { GetShiftsQuery, ShiftInstanceItem } from '@repo/data';
import {
  Checkbox,
  DatePickerWithTimeRange,
  Field,
  FieldError,
  FieldLabel,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@repo/ui';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { FormSheet, useFormSheet } from '@/components/form-sheet';
import { useRouter } from '@/i18n/navigation';
import { clientTimeEntrySchema, type TimeEntryFormValues } from '../schemas';

import {
  type PickerValue,
  ShiftPicker,
} from './shift-instance-picker/shift-instance-picker';

type Shift = GetShiftsQuery['shifts']['items'][0];

interface TimeEntryFormProps {
  organizationUnitId: string;
  shifts: Shift[];
  volunteers?: Array<{ id: string; name: string; email: string }>;
  initialValues?: Partial<TimeEntryFormValues>;
  mutate: (formData: TimeEntryFormValues) => Promise<{ serverError?: string }>;
  title: string;
  description: string;
}

export const TimeEntryForm = ({
  organizationUnitId,
  shifts,
  volunteers = [],
  mutate,
  initialValues,
  title,
  description,
}: TimeEntryFormProps) => {
  const router = useRouter();
  const t = useTranslations('TimeEntry.form');
  const tValidation = useTranslations('TimeEntry.validation');
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string>();
  const [selectedInstance, setSelectedInstance] = useState<ShiftInstanceItem>();

  const { open, setOpen } = useFormSheet();

  const schema = clientTimeEntrySchema({
    organizationUnitRequired: tValidation('organizationUnitRequired'),
    shiftInstanceRequired: tValidation('shiftInstanceRequired'),
    volunteerRequired: tValidation('volunteerRequired'),
    startedAtRequired: tValidation('startedAtRequired'),
    endedAtRequired: tValidation('endedAtRequired'),
    timeEntryIdRequired: tValidation('timeEntryIdRequired'),
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TimeEntryFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      organizationUnitId,
      shiftId: '',
      shiftInstanceId: '',
      volunteerId: '',
      hasShift: initialValues?.hasShift ?? true,
      ...initialValues,
    },
  });

  const shiftId = watch('shiftId');
  const shiftInstanceId = watch('shiftInstanceId');
  const startedAt = watch('startedAt');
  const endedAt = watch('endedAt');

  //  When an instance is selected, default the time entry to the instances date range
  //  But don't overwrite any initial range that would be set via the Edit form
  useEffect(() => {
    if (
      selectedInstance &&
      !initialValues?.startedAt &&
      !initialValues?.endedAt
    ) {
      setValue('startedAt', new Date(selectedInstance.actualStartsAt));
      setValue('endedAt', new Date(selectedInstance.actualEndsAt));
    }
  }, [
    selectedInstance,
    setValue,
    initialValues?.endedAt,
    initialValues?.startedAt,
  ]);

  const handleInstanceSelect = useCallback(
    (value: PickerValue, instance?: ShiftInstanceItem) => {
      setValue('shiftId', value.shiftId);
      setValue('shiftInstanceId', value.shiftInstanceId ?? '');
      setSelectedInstance(instance);
    },
    [setValue],
  );

  const onSubmit = async (formData: TimeEntryFormValues) => {
    setServerError(undefined);

    const payload = formData.hasShift
      ? formData
      : { ...formData, shiftId: undefined, shiftInstanceId: undefined };

    startTransition(async () => {
      const result = await mutate(payload);
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
        <label
          className="flex items-center gap-2 text-sm"
          htmlFor="not-tied-to-shift"
        >
          <Checkbox
            id="not-tied-to-shift"
            checked={!watch('hasShift')}
            onCheckedChange={(checked) => {
              setValue('hasShift', !checked);
              if (checked) {
                setValue('shiftId', '');
                setValue('shiftInstanceId', '');
                setSelectedInstance(undefined);
              }
            }}
            disabled={pending}
          />
          {t('notTiedToShiftLabel')}
        </label>
      </Field>

      {watch('hasShift') && (
        <>
          <ShiftPicker
            shifts={shifts}
            value={{ shiftId, shiftInstanceId }}
            onChange={handleInstanceSelect}
            disabled={pending}
          />
          {errors.shiftInstanceId && (
            <FieldError>{errors.shiftInstanceId.message}</FieldError>
          )}
        </>
      )}

      <Field>
        <FieldLabel htmlFor="volunteerId">
          {t('selectVolunteerLabel')}{' '}
          <span className="text-destructive">*</span>
        </FieldLabel>
        <Select
          value={watch('volunteerId')}
          onValueChange={(value) => setValue('volunteerId', value)}
          disabled={pending}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('selectVolunteerPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            {volunteers.map((volunteer) => (
              <SelectItem key={volunteer.id} value={volunteer.id}>
                {volunteer.name || volunteer.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.volunteerId && (
          <FieldError>{errors.volunteerId.message}</FieldError>
        )}
      </Field>

      <Field>
        <FieldLabel>
          {t('startEndTimeLabel')}
          <span className="text-destructive"> *</span>
        </FieldLabel>
        <DatePickerWithTimeRange
          value={{
            start: startedAt ? new Date(startedAt) : null,
            end: endedAt ? new Date(endedAt) : null,
          }}
          onChange={(start, end) => {
            setValue('startedAt', start as Date, { shouldValidate: true });
            setValue('endedAt', end as Date, { shouldValidate: true });
          }}
          errors={[errors.startedAt?.message, errors.endedAt?.message]}
          disabled={pending}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="notes">{t('notesLabel')}</FieldLabel>
        <Textarea
          id="notes"
          rows={4}
          placeholder={t('notesPlaceholder')}
          disabled={pending}
          {...register('notes')}
        />
        {errors.notes && <FieldError>{errors.notes.message}</FieldError>}
      </Field>
    </FormSheet>
  );
};

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { GetShiftsQuery } from '@repo/data';
import {
  DatePickerWithTimeRange,
  Field,
  FieldError,
  FieldLabel,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@repo/ui';
import { useRouter } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { FormSheet, useFormSheet } from '@/components/form-sheet';
import { type TimeEntryFormValues, timeEntrySchema } from '../schemas';
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
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string>();
  const { open, setOpen } = useFormSheet();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TimeEntryFormValues>({
    resolver: zodResolver(timeEntrySchema),
    defaultValues: {
      organizationUnitId,
      shiftId: '',
      shiftInstanceId: '',
      volunteerId: '',
      ...initialValues,
    },
  });

  const shiftId = watch('shiftId');
  const shiftInstanceId = watch('shiftInstanceId');
  const startedAt = watch('startedAt');
  const endedAt = watch('endedAt');

  //const selectedShift = shifts.find((s) => s.id === shiftInstanceId);
  //const shiftVolunteers = selectedShift?. || [];
  //const otherVolunteers = volunteers.filter(
  //  (v) => !shiftVolunteers.some((sv) => sv.id === v.id),
  //);
  const otherVolunteers = volunteers;

  const handleInstanceSelect = useCallback(
    (value: PickerValue) => {
      setValue('shiftId', value.shiftId);
      setValue('shiftInstanceId', value.shiftInstanceId ?? '', {
        shouldValidate: true,
      });
      setValue('volunteerId', '');
    },
    [setValue],
  );

  const onSubmit = async (formData: TimeEntryFormValues) => {
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
      <ShiftPicker
        shifts={shifts}
        value={{ shiftId, shiftInstanceId }}
        onChange={handleInstanceSelect}
        disabled={pending}
      />
      {errors.shiftInstanceId && (
        <FieldError>{errors.shiftInstanceId.message}</FieldError>
      )}

      <Field>
        <FieldLabel htmlFor="volunteerId">
          Select Volunteer <span className="text-destructive">*</span>
        </FieldLabel>
        <Select
          value={watch('volunteerId')}
          onValueChange={(value) => setValue('volunteerId', value)}
          disabled={pending || !shiftInstanceId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a volunteer" />
          </SelectTrigger>
          <SelectContent>
            {otherVolunteers.length > 0 && (
              <SelectGroup>
                <SelectLabel>Volunteers</SelectLabel>
                {otherVolunteers.map((volunteer) => (
                  <SelectItem key={volunteer.id} value={volunteer.id}>
                    {volunteer.name || volunteer.email}
                  </SelectItem>
                ))}
              </SelectGroup>
            )}
          </SelectContent>
        </Select>
        {errors.volunteerId && (
          <FieldError>{errors.volunteerId.message}</FieldError>
        )}
      </Field>

      <Field>
        <FieldLabel>
          Start and end time<span className="text-destructive">*</span>
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
        <FieldLabel htmlFor="notes">Notes</FieldLabel>
        <Textarea
          id="notes"
          rows={4}
          placeholder="Add any notes about this time entry..."
          disabled={pending}
          {...register('notes')}
        />
        {errors.notes && <FieldError>{errors.notes.message}</FieldError>}
      </Field>
    </FormSheet>
  );
};

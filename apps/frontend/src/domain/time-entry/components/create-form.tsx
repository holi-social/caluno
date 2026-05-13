'use client';

import { zodResolver } from '@hookform/resolvers/zod';
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
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { FormSheet, useFormSheet } from '@/components/form-sheet';
import { createTimeEntry } from '../actions';
import {
  type CreateTimeEntryFormValues,
  createTimeEntrySchema,
} from '../schemas';

interface ShiftInstance {
  id: string;
  title: string;
  volunteers?: Array<{ id: string; name: string; email: string }>;
}

interface CreateTimeEntryFormProps {
  organizationUnitId: string;
  sessionId?: string;
  shiftInstances?: ShiftInstance[];
  allVolunteers?: Array<{ id: string; name: string; email: string }>;
}

export function CreateTimeEntryForm({
  organizationUnitId,
  shiftInstances = [],
  allVolunteers = [],
}: CreateTimeEntryFormProps) {
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
  } = useForm<CreateTimeEntryFormValues>({
    resolver: zodResolver(createTimeEntrySchema),
    defaultValues: {
      organizationUnitId,
      shiftInstanceId: '',
      volunteerId: '',
      notes: '',
    },
  });

  const shiftInstanceId = watch('shiftInstanceId');
  const startedAt = watch('startedAt');
  const endedAt = watch('endedAt');
  const selectedShift = shiftInstances.find((s) => s.id === shiftInstanceId);
  const shiftVolunteers = selectedShift?.volunteers || [];
  const otherVolunteers = allVolunteers.filter(
    (v) => !shiftVolunteers.some((sv) => sv.id === v.id),
  );

  const onSubmit = async (formData: CreateTimeEntryFormValues) => {
    setServerError(undefined);

    startTransition(async () => {
      const result = await createTimeEntry(formData);
      if (result?.serverError) {
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
      title="Add Time Entry"
      description="Record a new time entry for a volunteer shift session."
      pending={pending}
      open={open}
      onOpenChange={setOpen}
      formError={serverError}
    >
      <Field>
        <FieldLabel htmlFor="shiftInstanceId">
          Select Shift <span className="text-destructive">*</span>
        </FieldLabel>
        <Select
          value={watch('shiftInstanceId')}
          onValueChange={(value) => {
            setValue('shiftInstanceId', value);
            setValue('volunteerId', '');
          }}
          disabled={pending}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a shift" />
          </SelectTrigger>
          <SelectContent>
            {shiftInstances.map((shift) => (
              <SelectItem key={shift.id} value={shift.id}>
                {shift.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.shiftInstanceId && (
          <FieldError>{errors.shiftInstanceId.message}</FieldError>
        )}
      </Field>

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
            {shiftVolunteers.length > 0 && (
              <SelectGroup>
                <SelectLabel>Shift Volunteers</SelectLabel>
                {shiftVolunteers.map((volunteer) => (
                  <SelectItem key={volunteer.id} value={volunteer.id}>
                    {volunteer.name || volunteer.email}
                  </SelectItem>
                ))}
              </SelectGroup>
            )}
            {otherVolunteers.length > 0 && (
              <SelectGroup>
                <SelectLabel>Other Volunteers</SelectLabel>
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
          Start and end time<span className="text-destructive"> *</span>
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
}

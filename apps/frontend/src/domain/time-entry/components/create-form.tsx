'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  Field,
  FieldError,
  FieldLabel,
  Input,
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
import { useEffect, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
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
  sessionId?: string;
  shiftInstances?: ShiftInstance[];
  allVolunteers?: Array<{ id: string; name: string; email: string }>;
  onSuccess?: () => void;
  onPendingChange?: (isPending: boolean) => void;
  formId?: string;
}

export function CreateTimeEntryForm({
  shiftInstances = [],
  allVolunteers = [],
  onSuccess,
  onPendingChange,
  formId,
}: CreateTimeEntryFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    onPendingChange?.(isPending);
  }, [isPending, onPendingChange]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateTimeEntryFormValues>({
    resolver: zodResolver(createTimeEntrySchema),
    defaultValues: {
      shiftInstanceId: '',
      volunteerId: '',
      startedAt: '',
      endedAt: '',
      notes: '',
    },
  });

  const shiftInstanceId = watch('shiftInstanceId');
  const selectedShift = shiftInstances.find((s) => s.id === shiftInstanceId);
  const shiftVolunteers = selectedShift?.volunteers || [];
  const otherVolunteers = allVolunteers.filter(
    (v) => !shiftVolunteers.some((sv) => sv.id === v.id),
  );

  const onSubmit = async (formData: CreateTimeEntryFormValues) => {
    setServerError(null);

    startTransition(async () => {
      const result = await createTimeEntry(formData);
      if (result?.serverError) {
        setServerError(result.serverError);
      } else {
        onSuccess?.();
        router.refresh();
      }
    });
  };

  return (
    <form
      id={formId}
      onSubmit={handleSubmit(onSubmit)}
      className="relative flex flex-col h-full"
    >
      <div>
        {serverError && (
          <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
            {serverError}
          </div>
        )}

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
            disabled={isPending}
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
            disabled={isPending || !shiftInstanceId}
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
          <FieldLabel htmlFor="startedAt">
            Start Time <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            id="startedAt"
            type="datetime-local"
            disabled={isPending}
            {...register('startedAt')}
          />
          {errors.startedAt && (
            <FieldError>{errors.startedAt.message}</FieldError>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="endedAt">End Time</FieldLabel>
          <Input
            id="endedAt"
            type="datetime-local"
            disabled={isPending}
            {...register('endedAt')}
          />
          {errors.endedAt && <FieldError>{errors.endedAt.message}</FieldError>}
        </Field>

        <Field>
          <FieldLabel htmlFor="notes">Notes</FieldLabel>
          <Textarea
            id="notes"
            rows={4}
            placeholder="Add any notes about this time entry..."
            disabled={isPending}
            {...register('notes')}
          />
          {errors.notes && <FieldError>{errors.notes.message}</FieldError>}
        </Field>
      </div>
    </form>
  );
}

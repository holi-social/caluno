'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Calendar,
  Card,
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Switch,
  Textarea,
} from '@repo/ui';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
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

const setTimeOnDate = (date: Date, time: string): Date => {
  const [hours, minutes] = time.split(':').map(Number);
  const newDate = new Date(date);
  newDate.setHours(hours ?? 0, minutes ?? 0, 0, 0);
  return newDate;
};

const getTimeString = (date: Date | undefined): string => {
  if (!date) return '';
  return format(date, 'HH:mm');
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
  const selectedDate = startsAt ? new Date(startsAt) : undefined;

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    const now = new Date();
    const newStart = new Date(date);
    newStart.setHours(now.getHours(), now.getMinutes(), 0, 0);
    setValue('startsAt', newStart, { shouldValidate: true });
    const newEnd = new Date(date);
    newEnd.setHours(now.getHours() + 1, now.getMinutes(), 0, 0);
    setValue('endsAt', newEnd, { shouldValidate: true });
  };

  const handleStartTimeChange = (time: string) => {
    const base = startsAt ?? new Date();
    setValue('startsAt', setTimeOnDate(base, time), { shouldValidate: true });
  };

  const handleEndTimeChange = (time: string) => {
    const base = endsAt ?? startsAt ?? new Date();
    setValue('endsAt', setTimeOnDate(base, time), { shouldValidate: true });
  };

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
          Date and time <span className="text-destructive">*</span>
        </FieldLabel>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="flex-1 justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 size-4" />
                {selectedDate ? format(selectedDate, 'dd.MM.yyyy') : 'Date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
              />
            </PopoverContent>
          </Popover>

          <Input
            type="time"
            className="w-28"
            value={getTimeString(startsAt)}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleStartTimeChange(e.target.value)
            }
            disabled={isPending}
          />

          <Input
            type="time"
            className="w-28"
            value={getTimeString(endsAt)}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleEndTimeChange(e.target.value)
            }
            disabled={isPending}
          />
        </div>
        {errors.startsAt && <FieldError>{errors.startsAt.message}</FieldError>}
        {errors.endsAt && <FieldError>{errors.endsAt.message}</FieldError>}
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

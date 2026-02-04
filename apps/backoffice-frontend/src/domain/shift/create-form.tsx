'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ShiftVisibility, useOrgId } from '@repo/data/react';
import {
  Button,
  Field,
  FieldError,
  FieldLabel,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@repo/ui';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { createShift } from './actions';
import { type CreateShiftFormValues, createShiftSchema } from './schemas';

interface CreateShiftFormProps {
  orgSlug: string;
}

export function CreateShiftForm({ orgSlug }: CreateShiftFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const orgId = useOrgId();

  const form = useForm<CreateShiftFormValues>({
    resolver: zodResolver(createShiftSchema),
    defaultValues: {
      name: '',
      startsAt: '',
      endsAt: '',
      location: '',
      instructions: '',
      visibility: ShiftVisibility.AllMembers,
      projectId: '1567a68b-5819-4e71-8566-088cc09ede21',
      organizationId: orgId,
    },
  });

  const onSubmit = async (formData: CreateShiftFormValues) => {
    setServerError(null);

    startTransition(async () => {
      const result = await createShift(formData);
      if (result?.serverError) {
        setServerError(result.serverError);
      } else {
        router.push(`/${orgSlug}/shifts/${result.data?.id}`);
      }
    });
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {serverError && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {serverError}
        </div>
      )}

      <Field>
        <FieldLabel htmlFor="title">
          Title <span className="text-destructive">*</span>
        </FieldLabel>
        <Input
          id="title"
          disabled={isPending}
          placeholder="Morning Shift"
          {...register('title')}
        />
        {errors.title && <FieldError>{errors.title.message}</FieldError>}
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field>
          <Label htmlFor="startsAt">
            Start Time <span className="text-destructive">*</span>
          </Label>
          <Input
            id="startsAt"
            type="datetime-local"
            disabled={isPending}
            {...register('startsAt')}
          />
          {errors.startsAt && (
            <FieldError>{errors.startsAt.message}</FieldError>
          )}
        </Field>

        <Field>
          <Label htmlFor="endsAt">
            End Time <span className="text-destructive">*</span>
          </Label>
          <Input
            id="endsAt"
            type="datetime-local"
            disabled={isPending}
            {...register('endsAt')}
          />
          {errors.endsAt && <FieldError>{errors.endsAt.message}</FieldError>}
        </Field>
      </div>

      <Field>
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          disabled={isPending}
          placeholder="Main Hall, 123 Main St"
          {...register('location')}
        />
        {errors.location && <FieldError>{errors.location.message}</FieldError>}
      </Field>

      <Field>
        <Label htmlFor="instructions">
          Instructions <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="instructions"
          rows={4}
          placeholder="Describe the shift responsibilities and requirements..."
          disabled={isPending}
          {...register('instructions')}
        />
        {errors.instructions && (
          <FieldError>{errors.instructions.message}</FieldError>
        )}
      </Field>

      <Field>
        <Label htmlFor="visibility">Visibility</Label>
        <Select disabled={isPending} {...register('visibility')}>
          <SelectTrigger className="w-xl">
            <SelectValue placeholder="Choose who can see this shift..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ShiftVisibility.AllMembers}>
              All Members
            </SelectItem>
            <SelectItem value={ShiftVisibility.InvitedMembers}>
              Invited Members Only
            </SelectItem>
          </SelectContent>
        </Select>
        {errors.visibility && (
          <FieldError>{errors.visibility.message}</FieldError>
        )}
      </Field>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Creating...' : 'Create Shift'}
        </Button>
      </div>
    </form>
  );
}

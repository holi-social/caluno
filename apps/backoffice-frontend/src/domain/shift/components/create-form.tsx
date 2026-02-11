'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useOrgId } from '@repo/data/react';
import {
  Button,
  Card,
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  Switch,
  Textarea,
} from '@repo/ui';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { createShift } from '../actions';
import { type CreateShiftFormValues, createShiftSchema } from '../schemas';
import { InviteList } from './invite-list';

interface CreateShiftFormProps {
  orgSlug: string;
}

export function CreateShiftForm({ orgSlug }: CreateShiftFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const organizationId = useOrgId();

  const form = useForm<CreateShiftFormValues>({
    resolver: zodResolver(createShiftSchema),
    defaultValues: {
      name: '',
      startsAt: '',
      endsAt: '',
      location: '',
      instructions: '',
      openShift: true,
      organizationId,
      invitedMemberIds: [],
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
    setValue,
    watch,
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
        <FieldLabel htmlFor="name">
          Name <span className="text-destructive">*</span>
        </FieldLabel>
        <Input
          id="name"
          disabled={isPending}
          placeholder="Morning Shift"
          {...register('name')}
        />
        {errors.name && <FieldError>{errors.name.message}</FieldError>}
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field>
          <FieldLabel htmlFor="startsAt">
            Start Time <span className="text-destructive">*</span>
          </FieldLabel>
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
          <FieldLabel htmlFor="endsAt">
            End Time <span className="text-destructive">*</span>
          </FieldLabel>
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
        <FieldLabel htmlFor="location">Location</FieldLabel>
        <Input
          id="location"
          disabled={isPending}
          placeholder="Main Hall, 123 Main St"
          {...register('location')}
        />
        {errors.location && <FieldError>{errors.location.message}</FieldError>}
      </Field>

      <Field>
        <FieldLabel htmlFor="instructions">Instructions</FieldLabel>
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

      <Card className="rounded-md p-4">
        <Field orientation="horizontal">
          <FieldContent>
            <FieldLabel htmlFor="openShift">Open shift</FieldLabel>
            <FieldDescription>
              Any volunteer can join the shift
            </FieldDescription>
          </FieldContent>
          <Switch
            id="openShift"
            checked={watch('openShift')}
            onCheckedChange={(checked) => setValue('openShift', checked)}
            disabled={isPending}
          />
          {errors.openShift && (
            <FieldError>{errors.openShift.message}</FieldError>
          )}
        </Field>
      </Card>

      <Field>
        <FieldLabel htmlFor="instructions">Invited volunteers</FieldLabel>

        <InviteList
          organizationId={organizationId}
          value={watch('invitedMemberIds')}
          onChange={(ids) => setValue('invitedMemberIds', ids)}
        />

        {errors.invitedMemberIds && (
          <FieldError>{errors.invitedMemberIds.message}</FieldError>
        )}
      </Field>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save & Publish'}
        </Button>
      </div>
    </form>
  );
}

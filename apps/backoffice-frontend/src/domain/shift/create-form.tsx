'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button, DialogFooter, Input, Label } from '@repo/ui';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { createShift } from './actions';
import { type CreateShiftFormValues, createShiftSchema } from './schema';

interface CreateShiftFormProps {
  orgSlug: string;
}

export function CreateShiftForm({ orgSlug }: CreateShiftFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<CreateShiftFormValues>({
    resolver: zodResolver(createShiftSchema),
    defaultValues: {
      title: '',
      startsAt: '',
      endsAt: '',
      location: '',
      instructions: '',
      visibility: 'ALL_MEMBERS',
      projectId: '',
    },
  });

  const onSubmit = async (data: CreateShiftFormValues) => {
    setServerError(null);

    startTransition(async () => {
      const result = await createShift(orgSlug, data);
      if (result?.error) {
        setServerError(result.error);
      } else {
        router.push(`/${orgSlug}/shifts`);
        router.refresh();
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

      <div className="space-y-2">
        <Label htmlFor="title">
          Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          disabled={isPending}
          placeholder="Morning Shift"
          {...register('title')}
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
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
            <p className="text-sm text-destructive">
              {errors.startsAt.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="endsAt">
            End Time <span className="text-destructive">*</span>
          </Label>
          <Input
            id="endsAt"
            type="datetime-local"
            disabled={isPending}
            {...register('endsAt')}
          />
          {errors.endsAt && (
            <p className="text-sm text-destructive">{errors.endsAt.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          disabled={isPending}
          placeholder="Main Hall, 123 Main St"
          {...register('location')}
        />
        {errors.location && (
          <p className="text-sm text-destructive">{errors.location.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="instructions">
          Instructions <span className="text-destructive">*</span>
        </Label>
        <textarea
          id="instructions"
          rows={4}
          className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Describe the shift responsibilities and requirements..."
          disabled={isPending}
          {...register('instructions')}
        />
        {errors.instructions && (
          <p className="text-sm text-destructive">
            {errors.instructions.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="visibility">Visibility</Label>
        <select
          id="visibility"
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isPending}
          {...register('visibility')}
        >
          <option value="ALL_MEMBERS">All Members</option>
          <option value="INVITED_MEMBERS">Invited Members Only</option>
        </select>
        {errors.visibility && (
          <p className="text-sm text-destructive">
            {errors.visibility.message}
          </p>
        )}
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Creating...' : 'Create Shift'}
        </Button>
      </DialogFooter>
    </form>
  );
}

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Field,
  FieldError,
  FieldLabel,
  Input,
  Textarea,
} from '@repo/ui';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { createForm } from '../actions';
import { type CreateFormValues, createFormSchema } from '../schemas';

interface CreateFormProps {
  orgUId: string;
  organizationId: string;
}

export function CreateForm({ orgUId, organizationId }: CreateFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateFormValues>({
    resolver: zodResolver(createFormSchema),
    defaultValues: {
      organizationUnitId: orgUId,
      organizationId,
      name: '',
      description: '',
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  const onSubmit = async (values: CreateFormValues) => {
    startTransition(async () => {
      const result = await createForm(values);
      if (result?.serverError) {
        toast.error(result.serverError);
      } else if (result?.data?.id) {
        router.push(`/${orgUId}/requirement-forms/${result.data.id}/builder`);
      } else {
        toast.error('Failed to create form');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field>
        <FieldLabel htmlFor="name">
          Form Name <span className="text-destructive">*</span>
        </FieldLabel>
        <Input
          id="name"
          type="text"
          placeholder="e.g. Onboarding Form"
          disabled={isPending}
          aria-invalid={!!errors.name}
          {...register('name')}
        />
        {errors.name && <FieldError>{errors.name.message}</FieldError>}
      </Field>

      <Field>
        <FieldLabel htmlFor="description">Description</FieldLabel>
        <Textarea
          id="description"
          placeholder="What is this form for?"
          disabled={isPending}
          aria-invalid={!!errors.description}
          {...register('description')}
        />
        {errors.description && (
          <FieldError>{errors.description.message}</FieldError>
        )}
      </Field>

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => router.push(`/${orgUId}/requirement-forms`)}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Creating...' : 'Create Form'}
        </Button>
      </div>
    </form>
  );
}

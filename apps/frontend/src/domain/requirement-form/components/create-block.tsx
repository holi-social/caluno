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
import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/navigation';
import { createBlock } from '../actions';
import { type CreateBlockValues, createBlockSchema } from '../schemas';

interface CreateBlockProps {
  orgUId: string;
  organizationId: string;
}

export function CreateBlock({ orgUId, organizationId }: CreateBlockProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateBlockValues>({
    resolver: zodResolver(createBlockSchema),
    defaultValues: {
      organizationUnitId: orgUId,
      organizationId,
      title: '',
      description: '',
      icon: '',
      required: true,
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  const onSubmit = async (values: CreateBlockValues) => {
    startTransition(async () => {
      const result = await createBlock(values);
      if (result?.serverError) {
        toast.error(result.serverError);
      } else if (result?.data?.id) {
        router.push(
          `/admin/${orgUId}/requirement-forms/blocks/${result.data.id}/edit`,
        );
      } else {
        toast.error('Failed to create block');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field>
        <FieldLabel htmlFor="title">
          Block Title <span className="text-destructive">*</span>
        </FieldLabel>
        <Input
          id="title"
          type="text"
          placeholder="e.g. Personal Information"
          disabled={isPending}
          aria-invalid={!!errors.title}
          {...register('title')}
        />
        {errors.title && <FieldError>{errors.title.message}</FieldError>}
      </Field>

      <Field>
        <FieldLabel htmlFor="description">Description</FieldLabel>
        <Textarea
          id="description"
          placeholder="What does this block collect?"
          disabled={isPending}
          aria-invalid={!!errors.description}
          {...register('description')}
        />
        {errors.description && (
          <FieldError>{errors.description.message}</FieldError>
        )}
      </Field>

      <Field>
        <FieldLabel htmlFor="icon">Icon</FieldLabel>
        <Input
          id="icon"
          type="text"
          placeholder="e.g. user"
          disabled={isPending}
          aria-invalid={!!errors.icon}
          {...register('icon')}
        />
        {errors.icon && <FieldError>{errors.icon.message}</FieldError>}
      </Field>

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() =>
            router.push(`/admin/${orgUId}/requirement-forms/blocks`)
          }
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Creating...' : 'Create Block'}
        </Button>
      </div>
    </form>
  );
}

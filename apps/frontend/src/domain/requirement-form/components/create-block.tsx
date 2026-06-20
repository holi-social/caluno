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
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('RequirementForm.block');
  const tActions = useTranslations('RequirementForm.actions');
  const tValidation = useTranslations('RequirementForm.validation');
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateBlockValues>({
    resolver: zodResolver(
      createBlockSchema({ titleRequired: tValidation('titleRequired') }),
    ),
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
        toast.error(tActions('failedToSaveBlock'));
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field>
        <FieldLabel htmlFor="title">
          {t('blockTitleLabel')} <span className="text-destructive">*</span>
        </FieldLabel>
        <Input
          id="title"
          type="text"
          placeholder={t('titlePlaceholder')}
          disabled={isPending}
          aria-invalid={!!errors.title}
          {...register('title')}
        />
        {errors.title && <FieldError>{errors.title.message}</FieldError>}
      </Field>

      <Field>
        <FieldLabel htmlFor="description">{t('descriptionLabel')}</FieldLabel>
        <Textarea
          id="description"
          placeholder={t('createDescriptionPlaceholder')}
          disabled={isPending}
          aria-invalid={!!errors.description}
          {...register('description')}
        />
        {errors.description && (
          <FieldError>{errors.description.message}</FieldError>
        )}
      </Field>

      <Field>
        <FieldLabel htmlFor="icon">{t('iconLabel')}</FieldLabel>
        <Input
          id="icon"
          type="text"
          placeholder={t('iconPlaceholder')}
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
          {t('cancel')}
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? t('creating') : t('createBlock')}
        </Button>
      </div>
    </form>
  );
}

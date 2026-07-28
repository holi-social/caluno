'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { RequiredFormTargetType } from '@repo/data';
import type {
  RequiredForm,
  RequiredFormBlock,
  RequiredFormField,
} from '@repo/data/react';
import { Button } from '@repo/ui';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { Controller, type Resolver, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { submitRequiredForm } from '../actions';
import {
  buildFieldSchema,
  FieldRenderer,
  type RenderableField,
} from './volunteer-form';

interface RequiredFormRendererProps {
  targetType: RequiredFormTargetType;
  targetId: string;
  form: RequiredForm;
  profileData?: Record<string, string>;
  onSubmitted?: () => void;
}

export function RequiredFormRenderer({
  targetType,
  targetId,
  form,
  profileData = {},
  onSubmitted,
}: RequiredFormRendererProps) {
  const t = useTranslations('RequirementForm.volunteerForm');
  const tActions = useTranslations('RequirementForm.actions');
  const tValidation = useTranslations('RequirementForm.validation');
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validationMessages = useMemo(
    () => ({
      fieldRequired: (label: string) => tValidation('fieldRequired', { label }),
      mustBeNumber: (label: string) => tValidation('mustBeNumber', { label }),
      mustBeValidDate: (label: string) =>
        tValidation('mustBeValidDate', { label }),
      mustBeValidEmail: (label: string) =>
        tValidation('mustBeValidEmail', { label }),
      mustBeValidPhone: (label: string) =>
        tValidation('mustBeValidPhone', { label }),
      invalidOptions: (label: string) =>
        tValidation('invalidOptions', { label }),
      maxChars: (label: string, maxLen: number) =>
        tValidation('maxChars', { label, maxLen }),
      invalidCharacters: (label: string) =>
        tValidation('invalidCharacters', { label }),
      validPostalCode: (label: string) =>
        tValidation('validPostalCode', { label }),
      minAge: (minAge: number) => tValidation('minAge', { minAge }),
    }),
    [tValidation],
  );

  const blocks = useMemo(() => {
    return (
      form.blockRefs
        ?.map((ref) => {
          const block = ref.block;
          if (!block) return null;
          return {
            ...block,
            effectiveRequired: ref.required ?? block.required,
          };
        })
        .filter(
          (b): b is RequiredFormBlock & { effectiveRequired: boolean } => !!b,
        ) ?? []
    );
  }, [form.blockRefs]);

  const currentBlock = blocks[step];
  const isLastStep = step === blocks.length - 1;
  const isFirstStep = step === 0;

  const formSchema = useMemo(() => {
    const shape: Record<string, z.ZodTypeAny> = {};
    for (const block of blocks) {
      for (const field of block.fields ?? []) {
        const isRequired = block.effectiveRequired && field.required;
        shape[field.id] = buildFieldSchema(
          field,
          isRequired,
          validationMessages,
        );
      }
    }
    return z.object(shape);
  }, [blocks, validationMessages]);

  const defaultValues = useMemo(() => {
    const vals: Record<string, string> = {};
    for (const block of blocks) {
      for (const field of block.fields ?? []) {
        if (field.systemKey && profileData[field.systemKey]) {
          vals[field.id] = profileData[field.systemKey] ?? '';
        }
      }
    }
    return vals;
  }, [blocks, profileData]);

  const {
    control,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<Record<string, string>>({
    resolver: zodResolver(formSchema) as Resolver<Record<string, string>>,
    defaultValues,
    mode: 'onChange',
  });

  async function handleNext() {
    if (!currentBlock) return;
    const fieldIds = (currentBlock.fields ?? []).map((f) => f.id);
    const valid = await trigger(fieldIds);
    if (valid) {
      setStep((s) => s + 1);
    }
  }

  async function handleSubmit() {
    if (!currentBlock) return;
    const fieldIds = (currentBlock.fields ?? []).map((f) => f.id);
    const valid = await trigger(fieldIds);
    if (!valid) return;

    const values = getValues();
    const submissionValues = Object.entries(values).map(([fieldId, value]) => {
      let blockId = '';
      for (const block of blocks) {
        const field = block.fields?.find((f) => f.id === fieldId);
        if (field) {
          blockId = block.id;
          break;
        }
      }
      return { fieldId, blockId, value: value ?? '' };
    });

    setIsSubmitting(true);
    try {
      const result = await submitRequiredForm({
        targetType,
        targetId,
        formId: form.id,
        values: submissionValues,
      });

      if (result?.serverError) {
        toast.error(result.serverError);
      } else if (result?.data) {
        setSubmitted(true);
        onSubmitted?.();
      } else {
        toast.error(tActions('failedToSubmitForm'));
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : tActions('failedToSubmitForm'),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
          <Check className="h-5 w-5 text-green-600" />
        </div>
        <h3 className="mt-3 text-lg font-semibold">
          {form.settings?.successTitle || t('successTitle')}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {form.settings?.successMessage || t('successMessage')}
        </p>
      </div>
    );
  }

  if (!currentBlock) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center">
        <p className="text-muted-foreground text-sm">{t('noBlocks')}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {t('step', { current: step + 1, total: blocks.length })}
        </span>
        <span className="text-sm font-medium">{currentBlock.title}</span>
      </div>

      <div className="space-y-4">
        {(currentBlock.fields?.length ?? 0) === 0 && (
          <p className="text-muted-foreground text-sm">{t('noFields')}</p>
        )}
        {currentBlock.fields?.map((field: RequiredFormField) => (
          <Controller
            key={field.id}
            name={field.id}
            control={control}
            defaultValue=""
            render={({ field: ctrlField }) => (
              <FieldRenderer
                field={field as unknown as RenderableField}
                value={ctrlField.value ?? ''}
                onChange={ctrlField.onChange}
                error={errors[field.id]?.message}
              />
            )}
          />
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        {!isFirstStep ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStep((s) => s - 1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('back')}
          </Button>
        ) : (
          <div />
        )}

        {isLastStep ? (
          <Button size="sm" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {form.settings?.submitButtonLabel || t('submit')}
          </Button>
        ) : (
          <Button size="sm" onClick={handleNext}>
            {t('next')}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

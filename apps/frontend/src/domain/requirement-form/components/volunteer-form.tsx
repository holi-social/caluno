'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type {
  FormBlock,
  GetRequirementFormByShareTokenQuery,
} from '@repo/data';
import { Button } from '@repo/ui';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { Controller, type Resolver, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { useRouter } from '@/i18n/navigation';
import { submitForm } from '../actions';
import {
  buildFieldSchema,
  FieldRenderer,
  useValidationMessages,
} from './field-renderer';

export type PublicForm = NonNullable<
  GetRequirementFormByShareTokenQuery['requirementFormByShareToken']
>;

interface VolunteerFormProps {
  form: PublicForm;
  token: string;
  isMember?: boolean;
  orgName?: string;
  profileData?: Record<string, string>;
}

export function VolunteerForm({
  form,
  token,
  isMember = true,
  orgName,
  profileData = {},
}: VolunteerFormProps) {
  const router = useRouter();
  const t = useTranslations('RequirementForm.volunteerForm');
  const tActions = useTranslations('RequirementForm.actions');
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const validationMessages = useValidationMessages();

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
        .filter((b): b is FormBlock & { effectiveRequired: boolean } => !!b) ??
      []
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
    formState: { errors, isSubmitting },
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

    try {
      const result = await submitForm({
        token,
        values: submissionValues,
      });

      if (result?.serverError) {
        toast.error(result.serverError);
      } else if (result?.data) {
        if (!isMember) {
          router.push('/profile#memberships');
        } else {
          setSubmitted(true);
        }
      } else {
        toast.error(tActions('failedToSubmitForm'));
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : tActions('failedToSubmitForm'),
      );
    }
  }

  if (submitted) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <Check className="h-6 w-6 text-green-600" />
        </div>
        <h2 className="mt-4 text-xl font-semibold">
          {form.settings?.successTitle || t('successTitle')}
        </h2>
        <p className="mt-2 text-muted-foreground">
          {form.settings?.successMessage || t('successMessage')}
        </p>
      </div>
    );
  }

  if (!currentBlock) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">{t('noBlocks')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6">
        <h1 className="text-2xl font-bold">{form.name}</h1>
        {form.description && (
          <p className="mt-1 text-muted-foreground">{form.description}</p>
        )}
      </div>

      {!isMember && (
        <div className="rounded-lg border bg-blue-50 p-4 text-sm text-blue-800">
          {t('membershipRequestNotice', { orgName: orgName ?? form.name })}
        </div>
      )}

      <div className="rounded-lg border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {t('step', { current: step + 1, total: blocks.length })}
          </span>
          <span className="text-sm font-medium">{currentBlock.title}</span>
        </div>

        <div className="space-y-4">
          {(currentBlock.fields?.length ?? 0) === 0 && (
            <p className="text-muted-foreground text-sm">{t('noFields')}</p>
          )}
          {currentBlock.fields?.map((field) => (
            <Controller
              key={field.id}
              name={field.id}
              control={control}
              defaultValue=""
              render={({ field: ctrlField }) => (
                <FieldRenderer
                  field={field}
                  value={ctrlField.value ?? ''}
                  onChange={ctrlField.onChange}
                  error={errors[field.id]?.message}
                />
              )}
            />
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          {!isFirstStep ? (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('back')}
            </Button>
          ) : (
            <div />
          )}

          {isLastStep ? (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {form.settings?.submitButtonLabel || t('submit')}
            </Button>
          ) : (
            <Button onClick={handleNext}>
              {t('next')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

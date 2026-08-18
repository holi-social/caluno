'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { RequiredFormTargetType } from '@repo/data';
import type {
  RequiredForm,
  RequiredFormBlock,
  RequiredFormField,
} from '@repo/data/react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
} from '@repo/ui';
import { Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  type Control,
  Controller,
  type FieldErrors,
  type Resolver,
  useForm,
} from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { submitRequiredForm } from '@/domain/requirement-form/actions';
import {
  buildFieldSchema,
  FieldRenderer,
  type RenderableField,
  useValidationMessages,
} from './field-renderer';

export type RequiredFormItem = {
  form: RequiredForm;
  order: number;
  submitted?: boolean;
  /** When provided, submissions for this form are sent to this target instead of the component-level targetType/targetId. */
  targetType?: RequiredFormTargetType;
  targetId?: string;
};

type FormBlockWithEffectiveRequired = RequiredFormBlock & {
  effectiveRequired: boolean;
};

interface RequiredFormRendererProps {
  title: string;
  description: string;
  emptyMessage?: string;
  targetType: RequiredFormTargetType;
  targetId: string;
  forms: RequiredFormItem[];
  profileData: Record<string, string>;
  initialSubmittedFormIds: Set<string>;
  onComplete: () => Promise<void>;
}

function getFormBlocks(form: RequiredForm): FormBlockWithEffectiveRequired[] {
  return (
    form.blockRefs
      ?.map((ref) => {
        const block = ref.block;
        if (!block) return null;
        return {
          ...block,
          effectiveRequired: ref.required ?? block.required ?? false,
        };
      })
      .filter((b): b is FormBlockWithEffectiveRequired => !!b) ?? []
  );
}

function getAllFieldIds(forms: RequiredFormItem[]): string[] {
  const ids = new Set<string>();
  for (const item of forms) {
    for (const block of getFormBlocks(item.form)) {
      for (const field of block.fields ?? []) {
        ids.add(field.id);
      }
    }
  }
  return [...ids];
}

function getFormFieldIds(form: RequiredForm): string[] {
  const ids: string[] = [];
  for (const block of getFormBlocks(form)) {
    for (const field of block.fields ?? []) {
      ids.push(field.id);
    }
  }
  return ids;
}

export function RequiredFormRenderer({
  title,
  description,
  emptyMessage,
  targetType,
  targetId,
  forms,
  profileData,
  initialSubmittedFormIds,
  onComplete,
}: RequiredFormRendererProps) {
  const t = useTranslations('RequiredFormRenderer');
  const tCommon = useTranslations('Common');
  const tActions = useTranslations('RequirementForm.actions');

  const [submittedFormIds, setSubmittedFormIds] = useState<Set<string>>(
    initialSubmittedFormIds,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const sortedForms = useMemo(
    () =>
      [...forms].sort((a, b) => {
        const aTarget = a.targetType ?? targetType;
        const bTarget = b.targetType ?? targetType;
        const aPriority =
          aTarget === RequiredFormTargetType.OrganizationUnit ? 0 : 1;
        const bPriority =
          bTarget === RequiredFormTargetType.OrganizationUnit ? 0 : 1;
        const priorityDiff = aPriority - bPriority;
        if (priorityDiff !== 0) return priorityDiff;
        return a.order - b.order;
      }),
    [forms, targetType],
  );

  const pendingForms = useMemo(
    () => sortedForms.filter((item) => !submittedFormIds.has(item.form.id)),
    [sortedForms, submittedFormIds],
  );

  // Keep the just-submitted batch visible while the auto-complete effect runs.
  const submittedBatchRef = useRef<RequiredFormItem[] | null>(null);
  const displayForms = submittedBatchRef.current ?? pendingForms;

  useEffect(() => {
    setCurrentStep((step) =>
      Math.min(step, Math.max(0, displayForms.length - 1)),
    );
  }, [displayForms.length]);

  const currentForm = displayForms[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === displayForms.length - 1;

  const validationMessages = useValidationMessages();

  const formSchema = useMemo(() => {
    const shape: Record<string, z.ZodTypeAny> = {};
    for (const item of pendingForms) {
      for (const block of getFormBlocks(item.form)) {
        for (const field of block.fields ?? []) {
          const isRequired = block.effectiveRequired && field.required;
          shape[field.id] = buildFieldSchema(
            field as unknown as RenderableField,
            isRequired,
            validationMessages,
          );
        }
      }
    }
    return z.object(shape);
  }, [pendingForms, validationMessages]);

  const defaultValues = useMemo(() => {
    const vals: Record<string, string> = {};
    for (const item of pendingForms) {
      for (const block of getFormBlocks(item.form)) {
        for (const field of block.fields ?? []) {
          if (field.systemKey && profileData[field.systemKey]) {
            vals[field.id] = profileData[field.systemKey] ?? '';
          }
        }
      }
    }
    return vals;
  }, [pendingForms, profileData]);

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

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const hasAutoCompleted = useRef(false);

  useEffect(() => {
    if (
      pendingForms.length === 0 &&
      sortedForms.length > 0 &&
      !hasAutoCompleted.current
    ) {
      hasAutoCompleted.current = true;
      setIsSubmitting(true);
      onCompleteRef
        .current()
        .catch((error: unknown) => {
          toast.error(
            error instanceof Error
              ? error.message
              : tActions('failedToSubmitForm'),
          );
        })
        .finally(() => setIsSubmitting(false));
    }
  }, [pendingForms.length, sortedForms.length, tActions]);

  const handleNext = async () => {
    if (!currentForm) return;
    const fieldIds = getFormFieldIds(currentForm.form);
    if (fieldIds.length > 0) {
      const valid = await trigger(fieldIds);
      if (!valid) return;
    }
    setCurrentStep((s) => Math.min(s + 1, displayForms.length - 1));
  };

  const handlePrevious = () => {
    setCurrentStep((s) => Math.max(s - 1, 0));
  };

  const handleSubmitAll = async () => {
    const allFieldIds = getAllFieldIds(pendingForms);
    if (allFieldIds.length > 0) {
      const valid = await trigger(allFieldIds);
      if (!valid) return;
    }

    const values = getValues();
    submittedBatchRef.current = pendingForms;
    setIsSubmitting(true);

    try {
      for (const item of pendingForms) {
        const submissionValues: Array<{
          fieldId: string;
          blockId: string;
          value: string;
        }> = [];

        for (const ref of item.form.blockRefs ?? []) {
          const block = ref.block;
          if (!block) continue;
          for (const field of block.fields ?? []) {
            submissionValues.push({
              fieldId: field.id,
              blockId: block.id,
              value: values[field.id] ?? '',
            });
          }
        }

        const result = await submitRequiredForm({
          targetType: item.targetType ?? targetType,
          targetId: item.targetId ?? targetId,
          formId: item.form.id,
          values: submissionValues,
        });

        if (result?.serverError) {
          toast.error(result.serverError);
          setIsSubmitting(false);
          return;
        }

        if (!result?.data) {
          toast.error(tActions('failedToSubmitForm'));
          setIsSubmitting(false);
          return;
        }

        setSubmittedFormIds((prev) => new Set([...prev, item.form.id]));
      }

      // onComplete is triggered by the effect once pendingForms becomes empty.
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : tActions('failedToSubmitForm'),
      );
      setIsSubmitting(false);
    }
  };

  if (sortedForms.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            {emptyMessage ?? t('noForms')}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!currentForm) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            {emptyMessage ?? t('noForms')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RequiredFormStepper forms={displayForms} currentStep={currentStep} />

        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                {t('step', {
                  current: currentStep + 1,
                  total: displayForms.length,
                })}
              </span>
            </div>
            <h2 className="mt-1 text-lg font-semibold">
              {currentForm.form.name}
            </h2>
            {currentForm.form.description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {currentForm.form.description}
              </p>
            )}
          </div>

          <FormBlocks
            form={currentForm.form}
            control={control}
            errors={errors}
          />
        </div>

        <div className="flex justify-between border-t pt-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={isFirstStep || isSubmitting}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            {tCommon('previous')}
          </Button>

          {isLastStep ? (
            <Button onClick={handleSubmitAll} disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isSubmitting ? t('submittingAll') : t('submitAll')}
            </Button>
          ) : (
            <Button onClick={handleNext}>
              {tCommon('next')}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function RequiredFormStepper({
  forms,
  currentStep,
}: {
  forms: RequiredFormItem[];
  currentStep: number;
}) {
  return (
    <nav aria-label="Form progress">
      <ol className="flex w-full items-start">
        {forms.map((item, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isLast = index === forms.length - 1;

          return (
            <li key={item.form.id} className="flex flex-1 items-start">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors',
                    isCurrent &&
                      'border-primary bg-primary text-primary-foreground',
                    isCompleted &&
                      'border-primary bg-primary text-primary-foreground',
                    !isCurrent &&
                      !isCompleted &&
                      'border-muted-foreground/30 text-muted-foreground',
                  )}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    'mt-2 hidden max-w-[6rem] text-center text-xs font-medium leading-tight sm:block lg:max-w-[8rem]',
                    isCurrent || isCompleted
                      ? 'text-foreground'
                      : 'text-muted-foreground',
                  )}
                >
                  {item.form.name}
                </span>
              </div>

              {!isLast && (
                <div
                  className={cn(
                    'mx-1 mt-4 h-0.5 flex-1 transition-colors sm:mx-2',
                    isCompleted ? 'bg-primary' : 'bg-muted-foreground/20',
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function FormBlocks({
  form,
  control,
  errors,
}: {
  form: RequiredForm;
  control: Control<Record<string, string>>;
  errors: FieldErrors<Record<string, string>>;
}) {
  const tForm = useTranslations('RequirementForm.volunteerForm');
  const blocks = useMemo(() => getFormBlocks(form), [form]);

  if (blocks.length === 0) {
    return <p className="text-muted-foreground text-sm">{tForm('noBlocks')}</p>;
  }

  return (
    <div className="space-y-8">
      {blocks.map((block) => (
        <div key={block.id} className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">{block.title}</h3>
            {block.description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {block.description}
              </p>
            )}
          </div>

          {(block.fields?.length ?? 0) === 0 && (
            <p className="text-muted-foreground text-sm">{tForm('noFields')}</p>
          )}

          <div className="space-y-4">
            {block.fields
              ?.slice()
              .sort((a, b) => a.fieldOrder - b.fieldOrder)
              .map((field: RequiredFormField) => (
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
        </div>
      ))}
    </div>
  );
}

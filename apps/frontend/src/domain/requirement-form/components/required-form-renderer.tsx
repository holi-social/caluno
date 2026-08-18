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
} from '@repo/ui';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, type Resolver, useForm } from 'react-hook-form';
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

type UnifiedBlock = RequiredFormBlock & {
  effectiveRequired: boolean;
  order: number;
  /** Position of the first form that contributed this block, used to keep org-unit forms above shift/event forms. */
  formOrder: number;
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
  const tForm = useTranslations('RequirementForm.volunteerForm');
  const tActions = useTranslations('RequirementForm.actions');

  const [submittedFormIds, setSubmittedFormIds] = useState<Set<string>>(
    initialSubmittedFormIds,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  const submittedBatchRef = useRef<RequiredFormItem[] | null>(null);
  const renderedForms = submittedBatchRef.current ?? pendingForms;

  const unifiedBlocks = useMemo(() => {
    const blockMap = new Map<string, UnifiedBlock>();
    for (const [formIndex, item] of renderedForms.entries()) {
      for (const ref of item.form.blockRefs ?? []) {
        const block = ref.block;
        if (!block) continue;

        const existing = blockMap.get(block.id);
        const effectiveRequired = ref.required ?? block.required ?? false;
        const order = ref.fieldOrder ?? 0;

        if (existing) {
          existing.effectiveRequired =
            existing.effectiveRequired || effectiveRequired;
          existing.order = Math.min(existing.order, order);
          existing.formOrder = Math.min(existing.formOrder, formIndex);
        } else {
          blockMap.set(block.id, {
            ...block,
            effectiveRequired,
            order,
            formOrder: formIndex,
          });
        }
      }
    }
    return Array.from(blockMap.values()).sort(
      (a, b) => a.formOrder - b.formOrder || a.order - b.order,
    );
  }, [renderedForms]);

  const validationMessages = useValidationMessages();

  const formSchema = useMemo(() => {
    const shape: Record<string, z.ZodTypeAny> = {};
    for (const block of unifiedBlocks) {
      for (const field of block.fields ?? []) {
        const isRequired = block.effectiveRequired && field.required;
        shape[field.id] = buildFieldSchema(
          field as unknown as RenderableField,
          isRequired,
          validationMessages,
        );
      }
    }
    return z.object(shape);
  }, [unifiedBlocks, validationMessages]);

  const defaultValues = useMemo(() => {
    const vals: Record<string, string> = {};
    for (const block of unifiedBlocks) {
      for (const field of block.fields ?? []) {
        if (field.systemKey && profileData[field.systemKey]) {
          vals[field.id] = profileData[field.systemKey] ?? '';
        }
      }
    }
    return vals;
  }, [unifiedBlocks, profileData]);

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

  const handleSubmit = async () => {
    const fieldIds = unifiedBlocks.flatMap((block) =>
      (block.fields ?? []).map((field) => field.id),
    );
    if (fieldIds.length > 0) {
      const valid = await trigger(fieldIds);
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
          return;
        }

        if (!result?.data) {
          toast.error(tActions('failedToSubmitForm'));
          return;
        }

        setSubmittedFormIds((prev) => new Set([...prev, item.form.id]));
      }

      // onComplete is triggered by the effect once pendingForms becomes empty.
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : tActions('failedToSubmitForm'),
      );
    }
    // isSubmitting stays true; the auto-complete effect will clear it.
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-xl border bg-card p-4 sm:p-6">
          {unifiedBlocks.length === 0 ? (
            <p className="text-muted-foreground text-sm">{tForm('noBlocks')}</p>
          ) : (
            <div className="space-y-8">
              {unifiedBlocks.map((block) => (
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
                    <p className="text-muted-foreground text-sm">
                      {tForm('noFields')}
                    </p>
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
          )}

          <div className="flex justify-end border-t pt-4 mt-6">
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {tCommon('submit')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

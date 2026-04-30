'use client';

import { useMemo, useState } from 'react';
import { Button } from '@repo/ui';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import type { Block, FormConfig, FieldError } from '@/lib/types';
import { resolveBlockRefs } from '@/lib/resolve-blocks';
import { validateStepFields } from '@/lib/validation';
import { buildDisplaySteps } from '@/lib/build-steps';
import { StepProgress } from './step-progress';
import { FormStep } from './form-step';

export function MultiStepForm({
  config,
  blocks,
  onSuccess,
}: {
  config: FormConfig;
  blocks: Block[];
  onSuccess: () => void;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<
    Record<string, string | boolean | string[]>
  >({});
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const resolvedBlocks = useMemo(
    () => resolveBlockRefs(config.blockRefs, blocks),
    [config.blockRefs, blocks],
  );

  const displaySteps = useMemo(
    () => buildDisplaySteps(resolvedBlocks),
    [resolvedBlocks],
  );

  const totalSteps = displaySteps.length;
  const currentDisplayStep = displaySteps[currentStep]!;
  const currentBlock = currentDisplayStep.block;
  const isDocumentStep = !!currentDisplayStep.documentField;
  const isLastStep = currentStep === totalSteps - 1;
  const isFirstStep = currentStep === 0;

  function handleFieldChange(
    fieldId: string,
    value: string | boolean | string[],
  ) {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
    setErrors((prev) => prev.filter((e) => e.fieldId !== fieldId));
  }

  function handleNext() {
    const stepFields = currentBlock.fields.map((f) => ({
      ...f,
      required: currentBlock.effectiveRequired,
    }));
    const stepErrors = validateStepFields(stepFields, formData);
    if (stepErrors.length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors([]);
    setCurrentStep((prev) => prev + 1);
  }

  function handleBack() {
    setErrors([]);
    setCurrentStep((prev) => prev - 1);
  }

  async function handleSubmit() {
    const stepFields = currentBlock.fields.map((f) => ({
      ...f,
      required: currentBlock.effectiveRequired,
    }));
    const stepErrors = validateStepFields(stepFields, formData);
    if (stepErrors.length > 0) {
      setErrors(stepErrors);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formSlug: config.slug,
          data: formData,
        }),
      });

      if (!res.ok) {
        const body = (await res.json()) as { errors?: FieldError[] };
        if (body.errors) {
          setErrors(body.errors);
          return;
        }
        throw new Error('Submission failed');
      }

      onSuccess();
    } catch {
      setErrors([
        {
          fieldId: '__form',
          message:
            'Beim Absenden ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.',
        },
      ]);
    } finally {
      setSubmitting(false);
    }
  }

  const formError = errors.find((e) => e.fieldId === '__form');

  return (
    <div className="space-y-6">
      <StepProgress currentStep={currentStep + 1} totalSteps={totalSteps} />

      <FormStep
        block={currentBlock}
        data={formData}
        errors={errors}
        onChange={handleFieldChange}
        showDocumentPreview={isDocumentStep}
      />

      {formError && (
        <div className="bg-destructive/10 text-destructive rounded-md p-4 text-sm">
          {formError.message}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-2">
        {!isFirstStep ? (
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={submitting}
          >
            <ArrowLeft className="mr-2 size-4" />
            Zurueck
          </Button>
        ) : (
          <div />
        )}

        {isLastStep ? (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting && (
              <Loader2 className="mr-2 size-4 animate-spin" />
            )}
            {config.settings.submitButtonLabel}
          </Button>
        ) : (
          <Button type="button" onClick={handleNext}>
            Weiter
            <ArrowRight className="ml-2 size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

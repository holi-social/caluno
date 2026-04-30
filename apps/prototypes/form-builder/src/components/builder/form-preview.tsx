'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button, Card, CardContent, Progress } from '@repo/ui';
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { Block, FormConfig } from '@/lib/types';
import { resolveBlockRefs } from '@/lib/resolve-blocks';
import { buildDisplaySteps } from '@/lib/build-steps';
import { FormStep } from '@/components/form/form-step';

export function FormPreview({
  config,
  blocks,
}: {
  config: FormConfig;
  blocks: Block[];
}) {
  const [currentStep, setCurrentStep] = useState(0);

  const resolvedBlocks = useMemo(
    () => resolveBlockRefs(config.blockRefs, blocks),
    [config.blockRefs, blocks],
  );

  const displaySteps = useMemo(
    () => buildDisplaySteps(resolvedBlocks),
    [resolvedBlocks],
  );

  const totalSteps = displaySteps.length;
  const currentDisplayStep = displaySteps[currentStep];
  const currentBlock = currentDisplayStep?.block;
  const isDocumentStep = !!currentDisplayStep?.documentField;
  const isLastStep = currentStep === totalSteps - 1;
  const isFirstStep = currentStep === 0;
  const percentage =
    totalSteps > 0
      ? Math.round(((currentStep + 1) / totalSteps) * 100)
      : 0;

  useEffect(() => {
    setCurrentStep(0);
  }, [config.blockRefs, blocks]);

  if (!currentBlock || totalSteps === 0) return null;

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-center text-xs italic">
        So sehen es Ihre Freiwilligen
      </p>

      <Card className="border-2">
        <CardContent className="space-y-4 pt-4">
          <div className="space-y-1">
            <Progress value={percentage} className="h-2 rounded-none" />
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Schritt {currentStep + 1}/{totalSteps}
            </p>
          </div>

          <div className="pointer-events-none select-none">
            <FormStep
              block={currentBlock}
              data={{}}
              errors={[]}
              onChange={() => {}}
              showDocumentPreview={isDocumentStep}
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            {!isFirstStep ? (
              <Button
                variant="outline"
                size="icon"
                aria-label="Zurueck"
                className="size-10"
                onClick={() => setCurrentStep((s) => s - 1)}
              >
                <ArrowLeft className="size-5" />
              </Button>
            ) : (
              <div />
            )}

            {isLastStep ? (
              <Button size="lg">
                {config.settings.submitButtonLabel}
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={() => setCurrentStep((s) => s + 1)}
              >
                Weiter
                <ArrowRight className="ml-1 size-3.5" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          disabled={isFirstStep}
          onClick={() => setCurrentStep((s) => s - 1)}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          disabled={isLastStep}
          onClick={() => setCurrentStep((s) => s + 1)}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

'use client';

import { Progress } from '@repo/ui';

export function StepProgress({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  const percentage = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="space-y-2">
      <Progress value={percentage} className="h-2 rounded-none" />
      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
        Schritt {currentStep}/{totalSteps}
      </p>
    </div>
  );
}

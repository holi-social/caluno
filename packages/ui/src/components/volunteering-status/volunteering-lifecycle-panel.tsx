import { cn } from '../../lib/utils';
import {
  getVolunteeringStatusPresentation,
  isRequestedVolunteeringState,
} from './config';
import type {
  ShiftVolunteeringDisplayState,
  ShiftVolunteeringPhase,
  VolunteeringActionLabel,
} from './types';
import { VolunteeringActionButtons } from './volunteering-action-buttons';
import { VolunteeringStatusIcon } from './volunteering-status-icon';

export type VolunteeringLifecyclePanelProps = {
  state: ShiftVolunteeringDisplayState;
  phase?: ShiftVolunteeringPhase;
  completedDuration?: string;
  /** When false, hides explanation (detail page never shows it). Default true for Storybook. */
  showDescription?: boolean;
  onAction?: (action: VolunteeringActionLabel) => void;
  className?: string;
};

/**
 * Full-width reference row for lifecycle documentation (Storybook / design review).
 * Explanation text is shown for every state when enabled.
 */
export function VolunteeringLifecyclePanel({
  state,
  phase,
  completedDuration,
  showDescription = true,
  onAction,
  className,
}: VolunteeringLifecyclePanelProps) {
  const presentation = getVolunteeringStatusPresentation(state, {
    completedDuration,
    phase,
  });

  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-xl border border-border bg-muted/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <VolunteeringStatusIcon
          state={state}
          completedDuration={completedDuration}
          phase={phase}
          size="md"
          className="mt-0.5"
        />
        <div className="min-w-0 space-y-1">
          <p
            className={cn(
              'text-base leading-snug',
              isRequestedVolunteeringState(state)
                ? 'font-bold'
                : 'font-semibold',
            )}
          >
            {presentation.label}
          </p>
          {showDescription ? (
            <p className="text-sm text-muted-foreground leading-snug">
              {presentation.description}
            </p>
          ) : null}
        </div>
      </div>

      <VolunteeringActionButtons
        actions={presentation.actions}
        onAction={onAction}
        className="self-end sm:self-center"
      />
    </div>
  );
}

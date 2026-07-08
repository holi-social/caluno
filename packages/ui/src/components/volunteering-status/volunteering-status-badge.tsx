import { cn } from '../../lib/utils';
import { Badge } from '../base/badge';
import {
  getVolunteeringStatusPresentation,
  isRequestedVolunteeringState,
} from './config';
import type {
  ShiftVolunteeringDisplayState,
  ShiftVolunteeringPhase,
} from './types';
import { VolunteeringStatusIcon } from './volunteering-status-icon';

export type VolunteeringStatusBadgeProps = {
  state: ShiftVolunteeringDisplayState;
  completedDuration?: string;
  phase?: ShiftVolunteeringPhase;
  className?: string;
};

/** Neutral pill with colored icon + label. No trailing explanation text. */
export function VolunteeringStatusBadge({
  state,
  completedDuration,
  phase,
  className,
}: VolunteeringStatusBadgeProps) {
  const { label } = getVolunteeringStatusPresentation(state, {
    completedDuration,
    phase,
  });
  const emphasizeLabel = isRequestedVolunteeringState(state);

  return (
    <Badge
      variant="ghost"
      className={cn(
        'gap-1 rounded-lg border-0 bg-transparent px-0 py-0 text-sm shadow-none hover:bg-transparent',
        className,
      )}
    >
      <VolunteeringStatusIcon
        state={state}
        completedDuration={completedDuration}
        phase={phase}
      />
      <span
        className={cn(
          'text-sm font-normal text-muted-foreground',
          emphasizeLabel && 'font-medium text-foreground',
        )}
      >
        {label}
      </span>
    </Badge>
  );
}

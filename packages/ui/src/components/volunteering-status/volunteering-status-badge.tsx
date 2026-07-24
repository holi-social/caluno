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
  /** Overrides presentation label (e.g. i18n). */
  label?: string;
  className?: string;
};

/** Neutral pill with colored icon + label. No trailing explanation text. */
export function VolunteeringStatusBadge({
  state,
  completedDuration,
  phase,
  label: labelOverride,
  className,
}: VolunteeringStatusBadgeProps) {
  const { label: defaultLabel } = getVolunteeringStatusPresentation(state, {
    completedDuration,
    phase,
  });
  const label = labelOverride ?? defaultLabel;
  const emphasizeLabel = isRequestedVolunteeringState(state);

  return (
    <Badge
      variant="secondary"
      className={cn(
        'gap-1.5 rounded-lg px-2.5 py-1 text-sm font-medium',
        className,
      )}
    >
      <VolunteeringStatusIcon
        state={state}
        completedDuration={completedDuration}
        phase={phase}
      />
      <span className={cn(emphasizeLabel && 'font-semibold')}>{label}</span>
    </Badge>
  );
}

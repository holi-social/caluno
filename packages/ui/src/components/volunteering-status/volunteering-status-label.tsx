import { getVolunteeringStatusPresentation } from './config';
import type {
  ShiftVolunteeringDisplayState,
  ShiftVolunteeringPhase,
} from './types';
import { VolunteeringStatusIcon } from './volunteering-status-icon';

export type VolunteeringStatusBadgeProps = {
  state: ShiftVolunteeringDisplayState;
  completedDuration?: string;
  phase?: ShiftVolunteeringPhase;
  label?: string;
  className?: string;
};

export function VolunteeringStatusLabel({
  state,
  completedDuration,
  phase,
  label: labelOverride,
}: VolunteeringStatusBadgeProps) {
  const { label: defaultLabel } = getVolunteeringStatusPresentation(state, {
    completedDuration,
    phase,
  });
  const label = labelOverride ?? defaultLabel;

  return (
    <span className="flex items-center gap-2">
      <VolunteeringStatusIcon
        state={state}
        completedDuration={completedDuration}
        phase={phase}
      />
      <span>{label}</span>
    </span>
  );
}

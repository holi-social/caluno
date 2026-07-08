import type {
  ShiftVolunteeringDisplayState,
  ShiftVolunteeringPhase,
} from './types';
import { VolunteeringMemberRow } from './volunteering-member-row';

export type VolunteeringVolunteerCompactRowProps = {
  name: string;
  state: ShiftVolunteeringDisplayState;
  phase?: ShiftVolunteeringPhase;
  completedDuration?: string;
  className?: string;
};

/** Same row layout as the invite panel — name + status icon. */
export function VolunteeringVolunteerCompactRow({
  name,
  state,
  phase,
  completedDuration,
  className,
}: VolunteeringVolunteerCompactRowProps) {
  return (
    <VolunteeringMemberRow
      name={name}
      state={state}
      phase={phase}
      completedDuration={completedDuration}
      className={className}
    />
  );
}

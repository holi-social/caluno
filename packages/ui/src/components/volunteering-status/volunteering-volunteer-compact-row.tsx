import { cn } from '../../lib/utils';
import { getVolunteeringStatusPresentation } from './config';
import type {
  ShiftVolunteeringDisplayState,
  ShiftVolunteeringPhase,
} from './types';
import { VolunteeringStatusIcon } from './volunteering-status-icon';

export type VolunteeringVolunteerCompactRowProps = {
  name: string;
  state: ShiftVolunteeringDisplayState;
  phase?: ShiftVolunteeringPhase;
  completedDuration?: string;
  className?: string;
};

/** Name + status icon — for shift cards and other dense lists. */
export function VolunteeringVolunteerCompactRow({
  name,
  state,
  phase,
  completedDuration,
  className,
}: VolunteeringVolunteerCompactRowProps) {
  const { label } = getVolunteeringStatusPresentation(state, {
    completedDuration,
    phase,
  });

  return (
    <div className={cn('flex items-center justify-between gap-2', className)}>
      <p className="min-w-0 truncate text-base">{name}</p>
      <VolunteeringStatusIcon
        state={state}
        completedDuration={completedDuration}
        phase={phase}
        size="md"
        accessible
        ariaLabel={`${name}: ${label}`}
      />
    </div>
  );
}

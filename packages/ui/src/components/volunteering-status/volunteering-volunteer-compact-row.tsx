import type { ReactNode } from 'react';

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
  action?: ReactNode;
  className?: string;
};

/** Name + status icon — for shift cards and other dense lists. */
export function VolunteeringVolunteerCompactRow({
  name,
  state,
  phase,
  completedDuration,
  action,
  className,
}: VolunteeringVolunteerCompactRowProps) {
  const { label } = getVolunteeringStatusPresentation(state, {
    completedDuration,
    phase,
  });

  return (
    <div className={cn('flex items-center justify-between gap-2', className)}>
      <p className="min-w-0 truncate text-base">{name}</p>
      <span className="flex shrink-0 items-center gap-1">
        {action}
        <VolunteeringStatusIcon
          state={state}
          completedDuration={completedDuration}
          phase={phase}
          size="md"
          accessible
          ariaLabel={`${name}: ${label}`}
        />
      </span>
    </div>
  );
}

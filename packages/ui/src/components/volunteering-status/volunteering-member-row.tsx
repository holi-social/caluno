import type { ReactNode } from 'react';

import { cn } from '../../lib/utils';
import type {
  ShiftVolunteeringDisplayState,
  ShiftVolunteeringPhase,
} from './types';
import { VolunteeringStatusIcon } from './volunteering-status-icon';

export type VolunteeringMemberRowProps = {
  name: string;
  email?: string;
  state: ShiftVolunteeringDisplayState;
  phase?: ShiftVolunteeringPhase;
  completedDuration?: string;
  trailing?: ReactNode;
  className?: string;
};

/** Icon + name + email — for invite sheets and member pickers. */
export function VolunteeringMemberRow({
  name,
  email,
  state,
  phase,
  completedDuration,
  trailing,
  className,
}: VolunteeringMemberRowProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-sm px-2 py-1.5',
        className,
      )}
    >
      <VolunteeringStatusIcon
        state={state}
        completedDuration={completedDuration}
        phase={phase}
        accessible
        ariaLabel={name}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{name}</p>
        {email ? (
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        ) : null}
      </div>
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </div>
  );
}

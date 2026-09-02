import type { ReactNode } from 'react';

import { cn } from '../../lib/utils';
import { getVolunteeringStatusPresentation } from './config';
import type {
  ShiftVolunteeringDisplayState,
  ShiftVolunteeringPhase,
  VolunteeringStatusIconTone,
} from './types';
import { VolunteeringStatusIcon } from './volunteering-status-icon';

const iconFrameClass: Record<VolunteeringStatusIconTone, string> = {
  neutral: 'bg-muted',
  positive: 'bg-success/10',
  warning: 'bg-alert/10',
  destructive: 'bg-alert/10',
};

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
  const { iconTone } = getVolunteeringStatusPresentation(state, {
    completedDuration,
    phase,
  });

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-sm px-2 py-1.5',
        className,
      )}
    >
      <span
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-md p-0.5',
          iconFrameClass[iconTone],
        )}
      >
        <VolunteeringStatusIcon
          state={state}
          completedDuration={completedDuration}
          phase={phase}
          size="md"
          accessible
          ariaLabel={name}
        />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium" title={name}>
          {name}
        </p>
        {email ? (
          <p className="truncate text-xs text-muted-foreground" title={email}>
            {email}
          </p>
        ) : null}
      </div>
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </div>
  );
}

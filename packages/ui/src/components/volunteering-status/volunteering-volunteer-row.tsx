'use client';

import { cn } from '../../lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../base/avatar';
import { Button } from '../base/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../tooltip';
import {
  getPassiveDuringShiftHint,
  getVolunteeringStatusPresentation,
  volunteeringActionIcons,
} from './config';
import type {
  ShiftVolunteeringDisplayState,
  ShiftVolunteeringPhase,
  VolunteeringActionLabel,
} from './types';
import {
  VolunteeringActionButtons,
  type VolunteeringActionLabels,
} from './volunteering-action-buttons';
import { VolunteeringStatusBadge } from './volunteering-status-badge';

const PASSIVE_DURING_SHIFT: ShiftVolunteeringDisplayState[] = [
  'invited',
  'requested',
  'declined',
  'rejected',
  'cancelled',
];

function isPassiveDuringShift(
  phase: ShiftVolunteeringPhase | undefined,
  state: ShiftVolunteeringDisplayState,
): boolean {
  return phase === 'during' && PASSIVE_DURING_SHIFT.includes(state);
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export type VolunteeringVolunteerRowProps = {
  name: string;
  image?: string | null;
  state: ShiftVolunteeringDisplayState;
  phase?: ShiftVolunteeringPhase;
  completedDuration?: string;
  /** Overrides status badge label (e.g. i18n). */
  statusLabel?: string;
  /** When set, overrides default actions from status presentation. */
  actions?: VolunteeringActionLabel[];
  /** Far-right icon-only actions (e.g. View profile, Check in). */
  iconActions?: VolunteeringActionLabel[];
  /** Localized button labels keyed by action id. */
  actionLabels?: VolunteeringActionLabels;
  onAction?: (action: VolunteeringActionLabel) => void;
  className?: string;
};

/** Volunteer row for the shift instance detail page volunteers card. */
export function VolunteeringVolunteerRow({
  name,
  image,
  state,
  phase,
  completedDuration,
  statusLabel,
  actions: actionsOverride,
  iconActions = [],
  actionLabels,
  onAction,
  className,
}: VolunteeringVolunteerRowProps) {
  const presentation = getVolunteeringStatusPresentation(state, {
    completedDuration,
    phase,
  });
  const passive = isPassiveDuringShift(phase, state);
  const actions = passive ? [] : (actionsOverride ?? presentation.actions);
  const passiveHint = passive ? getPassiveDuringShiftHint(state) : undefined;

  const statusBadge = (
    <VolunteeringStatusBadge
      state={state}
      completedDuration={completedDuration}
      phase={phase}
      label={statusLabel}
    />
  );

  return (
    <div
      className={cn(
        'flex flex-col gap-3 border-b border-border py-4 last:border-b-0 sm:flex-row sm:items-center sm:gap-4',
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar className="bg-muted shrink-0">
          <AvatarImage src={image ?? ''} alt="" />
          <AvatarFallback>{getInitials(name)}</AvatarFallback>
        </Avatar>
        <p className="truncate text-base font-medium">{name}</p>
      </div>

      <div className="flex min-w-0 flex-wrap items-center gap-2 pl-11 sm:shrink-0 sm:gap-3 sm:pl-0">
        {passiveHint ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex cursor-default">{statusBadge}</span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              {passiveHint}
            </TooltipContent>
          </Tooltip>
        ) : (
          statusBadge
        )}
        <VolunteeringActionButtons
          actions={actions}
          labels={actionLabels}
          onAction={onAction}
        />
      </div>

      {iconActions.length > 0 ? (
        <div className="ml-auto flex shrink-0 items-center gap-1">
          {iconActions.map((actionLabel) => {
            const ActionIcon = volunteeringActionIcons[actionLabel];
            return (
              <Button
                key={actionLabel}
                type="button"
                variant="outline"
                size="icon-xs"
                aria-label={actionLabels?.[actionLabel] ?? actionLabel}
                onClick={() => onAction?.(actionLabel)}
              >
                {ActionIcon ? <ActionIcon aria-hidden /> : null}
              </Button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

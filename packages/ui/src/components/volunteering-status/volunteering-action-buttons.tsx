import { cn } from '../../lib/utils';
import { Button } from '../base/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../tooltip';
import { volunteeringActionIcons } from './config';
import type { VolunteeringActionLabel } from './types';

export type VolunteeringActionLabels = Partial<
  Record<VolunteeringActionLabel, string>
>;

export type VolunteeringActionButtonsProps = {
  actions: VolunteeringActionLabel[];
  /** Localized button labels keyed by action id (defaults to English labels). */
  labels?: VolunteeringActionLabels;
  disabledActions?: VolunteeringActionLabel[];
  actionTooltips?: Partial<Record<VolunteeringActionLabel, string>>;
  onAction?: (action: VolunteeringActionLabel) => void;
  className?: string;
};

export function VolunteeringActionButtons({
  actions,
  labels,
  disabledActions,
  actionTooltips,
  onAction,
  className,
}: VolunteeringActionButtonsProps) {
  if (actions.length === 0) return null;

  return (
    <div
      className={cn('flex shrink-0 flex-wrap items-center gap-2', className)}
    >
      {actions.map((actionLabel) => {
        const ActionIcon = volunteeringActionIcons[actionLabel];
        const tooltip = actionTooltips?.[actionLabel];

        const button = (
          <Button
            key={actionLabel}
            type="button"
            variant="outline"
            size="md"
            disabled={disabledActions?.includes(actionLabel)}
            onClick={() => onAction?.(actionLabel)}
          >
            {ActionIcon ? <ActionIcon aria-hidden /> : null}
            {labels?.[actionLabel] ?? actionLabel}
          </Button>
        );

        if (!tooltip) {
          return button;
        }

        return (
          <Tooltip key={actionLabel}>
            <TooltipTrigger asChild>
              <span className="inline-flex">{button}</span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              {tooltip}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

import { cn } from '../../lib/utils';
import { Button } from '../base/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../tooltip';
import {
  getVolunteeringActionButtonStyle,
  volunteeringActionButtonClass,
  volunteeringActionIcons,
} from './config';
import type { VolunteeringActionLabel } from './types';

export type VolunteeringActionLabels = Partial<
  Record<VolunteeringActionLabel, string>
>;

export type VolunteeringActionButtonsProps = {
  actions: VolunteeringActionLabel[];
  /** Localized button labels keyed by action id (defaults to English labels). */
  labels?: VolunteeringActionLabels;
  /** Actions rendered as inert buttons (e.g. an already-sent reminder). */
  disabledActions?: VolunteeringActionLabel[];
  /** Hover tooltips keyed by action id. Unlike Button's own tooltip prop,
   * these also render on disabled buttons (span-triggered). */
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
  return (
    <div
      className={cn('flex shrink-0 flex-wrap items-center gap-2', className)}
    >
      {actions.map((actionLabel) => {
        const ActionIcon = volunteeringActionIcons[actionLabel];
        const { variant, className: actionClassName } =
          getVolunteeringActionButtonStyle(actionLabel);
        const tooltip = actionTooltips?.[actionLabel];

        const button = (
          <Button
            key={actionLabel}
            type="button"
            variant={variant}
            size="sm"
            className={cn(volunteeringActionButtonClass, actionClassName)}
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

        // Button suppresses its own tooltip on disabled buttons (no hover
        // events), so trigger from a wrapping span — same pattern the
        // volunteer row uses for passive-during-shift hints.
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

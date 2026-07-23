import { cn } from '../../lib/utils';
import { Button } from '../base/button';
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
  onAction?: (action: VolunteeringActionLabel) => void;
  className?: string;
};

export function VolunteeringActionButtons({
  actions,
  labels,
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
        const { variant, className: actionClassName } =
          getVolunteeringActionButtonStyle(actionLabel);

        return (
          <Button
            key={actionLabel}
            type="button"
            variant={variant}
            size="sm"
            className={cn(volunteeringActionButtonClass, actionClassName)}
            onClick={() => onAction?.(actionLabel)}
          >
            {ActionIcon ? <ActionIcon aria-hidden /> : null}
            {labels?.[actionLabel] ?? actionLabel}
          </Button>
        );
      })}
    </div>
  );
}

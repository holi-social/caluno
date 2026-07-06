import { cn } from '../../lib/utils';
import { Button } from '../base/button';
import {
  getVolunteeringActionButtonStyle,
  volunteeringActionButtonClass,
  volunteeringActionIcons,
} from './config';
import type { VolunteeringActionLabel } from './types';

export type VolunteeringActionButtonsProps = {
  actions: VolunteeringActionLabel[];
  onAction?: (action: VolunteeringActionLabel) => void;
  className?: string;
};

export function VolunteeringActionButtons({
  actions,
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
            {actionLabel}
          </Button>
        );
      })}
    </div>
  );
}

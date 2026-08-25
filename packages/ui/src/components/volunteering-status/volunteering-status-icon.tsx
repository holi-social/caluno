import { cn } from '../../lib/utils';
import {
  getVolunteeringStatusAriaLabel,
  getVolunteeringStatusPresentation,
  volunteeringStatusIconClass,
  volunteeringStatusIcons,
} from './config';
import type {
  ShiftVolunteeringDisplayState,
  ShiftVolunteeringPhase,
} from './types';

export type VolunteeringStatusIconProps = {
  state: ShiftVolunteeringDisplayState;
  completedDuration?: string;
  phase?: ShiftVolunteeringPhase;
  size?: 'sm' | 'md';
  /**
   * Expose the icon to assistive tech (icon-only table cells, toolbars).
   * Decorative when omitted and status text is shown beside the icon.
   */
  accessible?: boolean;
  /** Overrides the default status label when `accessible` is true. */
  ariaLabel?: string;
  className?: string;
};

const sizeClass = {
  sm: 'size-4',
  md: 'size-5',
} as const;

/**
 * Colored status icon for reuse outside the badge (tables, cards, toolbars).
 * Color carries meaning; surrounding chrome stays neutral.
 */
export function VolunteeringStatusIcon({
  state,
  completedDuration,
  phase,
  size = 'sm',
  accessible = false,
  ariaLabel,
  className,
}: VolunteeringStatusIconProps) {
  const { iconTone } = getVolunteeringStatusPresentation(state, {
    completedDuration,
    phase,
  });
  const Icon = volunteeringStatusIcons[state];
  const label =
    accessible &&
    (ariaLabel ??
      getVolunteeringStatusAriaLabel(state, { completedDuration, phase }));

  return (
    <Icon
      {...(label
        ? { 'aria-label': label, role: 'img' }
        : { 'aria-hidden': true })}
      className={cn(
        'shrink-0',
        sizeClass[size],
        volunteeringStatusIconClass[iconTone],
        className,
      )}
    />
  );
}

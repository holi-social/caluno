'use client';

import { CalendarDayButton, cn } from '@repo/ui';

/**
 * Orange marks a day with any shift instance in the selected org unit; green
 * marks a day the currently selected shift also runs on.
 */
export const CheckInDayButton = ({
  modifiers,
  children,
  ...props
}: React.ComponentProps<typeof CalendarDayButton>) => {
  const showDot = modifiers.hasInstance || modifiers.hasSelectedShift;

  return (
    <CalendarDayButton modifiers={modifiers} {...props}>
      {children}
      {showDot && (
        <span
          className={cn(
            'mt-1 size-1.5 rounded-full',
            modifiers.selected
              ? 'bg-primary-foreground'
              : modifiers.hasSelectedShift
                ? 'bg-green-500'
                : 'bg-orange-500',
          )}
        />
      )}
    </CalendarDayButton>
  );
};

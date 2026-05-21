import { CalendarDayButton, cn } from '@repo/ui';

export const DayButton = ({
  modifiers,
  children,
  ...props
}: React.ComponentProps<typeof CalendarDayButton>) => {
  return (
    <CalendarDayButton modifiers={modifiers} {...props}>
      {children}
      {modifiers.hasInstance && (
        <span
          className={cn(
            'size-2 rounded-full mt-2',
            modifiers.selected ? 'bg-primary-foreground' : 'bg-green-500',
          )}
        />
      )}
    </CalendarDayButton>
  );
};

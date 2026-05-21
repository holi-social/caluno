import { cn } from '@repo/ui';

type DayButtonComponentProps = {
  day: { date: Date };
  modifiers: Record<string, boolean>;
  className?: string;
  children?: React.ReactNode;
};

export const DayButton = ({
  day,
  modifiers,
  className,
}: DayButtonComponentProps) => {
  return (
    <button
      type="button"
      className={cn(
        'relative inline-flex flex-col items-center justify-center rounded-md text-sm leading-none font-normal',
        modifiers.selected && 'bg-primary text-primary-foreground',
        modifiers.today &&
          !modifiers.selected &&
          'bg-accent text-accent-foreground',
        modifiers.disabled && 'text-muted-foreground opacity-50 cursor-default',
        className,
      )}
    >
      {day.date.getDate()}
      {modifiers.hasInstance && (
        <span
          className={cn(
            'size-2 rounded-full mt-2',
            modifiers.selected ? 'bg-primary-foreground' : 'bg-green-500',
          )}
        />
      )}
    </button>
  );
};

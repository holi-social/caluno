'use client';

import { Button, cn } from '@repo/ui';
import { format, isBefore, type Locale, startOfDay } from 'date-fns';
import { de, enGB } from 'date-fns/locale';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useRef, useState } from 'react';
import { useFormatting } from '@/lib/formatting/use-formatting';
import {
  getCurrentWeekStart,
  getDayInstances,
  getDaysForWeek,
} from '../lib/shift-instances';

interface ShiftDayPickerProps {
  instances: Array<{
    id: string;
    actualStartsAt: string;
    actualEndsAt: string;
  }>;
  selectedId: string;
  onSelect: (id: string) => void;
}

const localeMap: Record<string, Locale> = {
  en: enGB,
  de,
};

export function ShiftDayPicker({
  instances,
  selectedId,
  onSelect,
}: ShiftDayPickerProps) {
  const { formatDate } = useFormatting();
  const t = useTranslations('ShiftDetail');
  const locale = useLocale();
  const dateLocale = localeMap[locale] ?? de;
  const [weekStart, setWeekStart] = useState(() => {
    const selectedInstance = instances.find((i) => i.id === selectedId);
    return getCurrentWeekStart(
      selectedInstance ? new Date(selectedInstance.actualStartsAt) : new Date(),
    );
  });
  const chipRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const days = useMemo(() => getDaysForWeek(weekStart), [weekStart]);
  const today = useMemo(() => startOfDay(new Date()), []);

  const dayStates = useMemo(
    () =>
      days.map((date) => {
        const dayInstances = getDayInstances(date, instances);
        const isPast = isBefore(date, today);
        return {
          date,
          instanceId: dayInstances[0]?.id,
          isSelected: dayInstances.some((i) => i.id === selectedId),
          hasInstance: dayInstances.length > 0,
          isPast,
        };
      }),
    [days, instances, selectedId, today],
  );

  const hasEarlier = true;
  const hasLater = true;

  const focusChip = (index: number) => {
    chipRefs.current[index]?.focus();
  };

  return (
    <div className="flex flex-col gap-3">
      <span className="text-base font-semibold text-foreground">
        {formatDate(weekStart, { month: 'long' })}
      </span>

      <fieldset className="grid grid-cols-7 gap-1.5 border-0 p-0">
        {dayStates.map(
          ({ date, instanceId, isSelected, hasInstance, isPast }, index) => {
            const disabled = !hasInstance || isPast;
            return (
              <button
                key={date.toISOString()}
                ref={(el) => {
                  chipRefs.current[index] = el;
                }}
                type="button"
                disabled={disabled}
                aria-current={isSelected ? 'true' : undefined}
                aria-disabled={disabled}
                tabIndex={isSelected || (!disabled && index === 0) ? 0 : -1}
                onClick={() => instanceId && onSelect(instanceId)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    focusChip(Math.min(index + 1, dayStates.length - 1));
                  } else if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    focusChip(Math.max(index - 1, 0));
                  }
                }}
                className={cn(
                  'flex flex-col items-center gap-0.5 rounded-xl border py-2.5',
                  isSelected
                    ? 'border-2 border-primary bg-card'
                    : hasInstance
                      ? 'border-border bg-card'
                      : 'border-transparent bg-background opacity-40',
                  disabled &&
                    !isSelected &&
                    'cursor-not-allowed text-muted-foreground/50',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
                )}
              >
                <span className="text-xs font-medium text-muted-foreground">
                  {format(date, 'EEEEEE', { locale: dateLocale })}
                </span>
                <span className="text-lg font-bold text-foreground">
                  {formatDate(date, { day: 'numeric' })}
                </span>
              </button>
            );
          },
        )}
      </fieldset>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          disabled={!hasEarlier}
          onClick={() =>
            setWeekStart((d) =>
              getCurrentWeekStart(
                new Date(d.getTime() - 7 * 24 * 60 * 60 * 1000),
              ),
            )
          }
        >
          <ChevronLeftIcon className="size-4" />
          {t('earlier')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!hasLater}
          onClick={() =>
            setWeekStart((d) =>
              getCurrentWeekStart(
                new Date(d.getTime() + 7 * 24 * 60 * 60 * 1000),
              ),
            )
          }
        >
          {t('later')}
          <ChevronRightIcon className="size-4" />
        </Button>
      </div>
    </div>
  );
}

'use client';

import { Button, cn } from '@repo/ui';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFormatting } from '@/lib/formatting/use-formatting';

export interface DayStripDay {
  date: Date;
  shiftCount: number;
}

export interface DayStripProps {
  days: DayStripDay[];
  activeDate: Date;
  onSelect: (date: Date) => void;
  todayLabel: string;
  className?: string;
}

function isSameDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function DayStrip({
  days,
  activeDate,
  onSelect,
  todayLabel,
  className,
}: DayStripProps) {
  const { formatDate } = useFormatting();
  const stripRef = useRef<HTMLDivElement>(null);
  const [showTodayButton, setShowTodayButton] = useState(false);
  const today = useMemo(() => new Date(), []);

  const todayIndex = days.findIndex((day) => isSameDate(day.date, today));

  const scrollToToday = useCallback(() => {
    if (stripRef.current && todayIndex >= 0) {
      const todayPill = stripRef.current.children[todayIndex] as HTMLElement;
      todayPill?.scrollIntoView({ behavior: 'smooth', inline: 'center' });
      onSelect(today);
    }
  }, [onSelect, today, todayIndex]);

  useEffect(() => {
    if (todayIndex < 0 || !stripRef.current) {
      setShowTodayButton(false);
      return;
    }

    const strip = stripRef.current;
    const todayPill = strip.children[todayIndex] as HTMLElement;
    if (!todayPill) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        const viewportWidth = strip.clientWidth;
        const distance = Math.abs(
          todayPill.offsetLeft - strip.scrollLeft - viewportWidth / 2,
        );
        setShowTodayButton(
          !entry.isIntersecting || distance > viewportWidth * 1.5,
        );
      },
      { root: strip, threshold: 0.5 },
    );

    observer.observe(todayPill);
    return () => observer.disconnect();
  }, [todayIndex]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

      event.preventDefault();
      const activeIndex = days.findIndex((day) =>
        isSameDate(day.date, activeDate),
      );
      const direction = event.key === 'ArrowLeft' ? -1 : 1;

      for (
        let index = activeIndex + direction;
        index >= 0 && index < days.length;
        index += direction
      ) {
        const day = days[index];
        if (!day) continue;
        if (day.shiftCount > 0 || index === todayIndex) {
          onSelect(day.date);
          const pill = stripRef.current?.children[index] as HTMLElement;
          pill?.scrollIntoView({ behavior: 'smooth', inline: 'center' });
          break;
        }
      }
    },
    [activeDate, days, onSelect, todayIndex],
  );

  return (
    <div className={cn('relative', className)}>
      <div
        ref={stripRef}
        role="tablist"
        aria-label="Day selector"
        onKeyDown={handleKeyDown}
        className="flex gap-2 overflow-x-auto scrollbar-hide py-1"
      >
        {days.map((day) => {
          const active = isSameDate(day.date, activeDate);
          const isToday = isSameDate(day.date, today);
          const hasShifts = day.shiftCount > 0;

          return (
            <button
              key={day.date.toISOString()}
              type="button"
              role="tab"
              aria-selected={active}
              aria-disabled={!hasShifts && !isToday}
              tabIndex={active ? 0 : -1}
              onClick={() => hasShifts && onSelect(day.date)}
              className={cn(
                'flex shrink-0 flex-col items-center justify-center rounded-xl px-3 py-2 text-sm transition-colors',
                active && 'bg-primary text-primary-foreground',
                !active &&
                  (hasShifts
                    ? 'bg-border text-foreground hover:bg-accent'
                    : 'bg-muted text-muted-foreground'),
              )}
              style={{ width: '60px' }}
            >
              <span>{formatDate(day.date, { weekday: 'short' })}</span>
              <span className="font-semibold">{day.date.getDate()}</span>
              {hasShifts && (
                <span className="text-[10px]">{day.shiftCount}</span>
              )}
            </button>
          );
        })}
      </div>

      {showTodayButton && (
        <Button
          variant="outline"
          size="md"
          onClick={scrollToToday}
          className="absolute right-0 top-8"
        >
          {todayLabel}
        </Button>
      )}
    </div>
  );
}

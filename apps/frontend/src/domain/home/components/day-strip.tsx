'use client';

import { Button, cn } from '@repo/ui';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
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
  shiftCountLabel?: (count: number) => string;
  /** Label for the "today" button when the active day is already today. */
  goToTodayLabel?: string;
  /** Discover mode: highlights a set of shown days + prev/next pair navigation. */
  paged?: boolean;
  activeDates?: Date[];
  hasPrev?: boolean;
  hasNext?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
}

function isSameDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function ArrowButton({
  direction,
  enabled,
  onClick,
}: {
  direction: 'left' | 'right';
  enabled: boolean;
  onClick?: () => void;
}) {
  const Icon = direction === 'left' ? ChevronLeftIcon : ChevronRightIcon;
  return (
    <button
      type="button"
      aria-label={direction === 'left' ? 'Previous days' : 'Next days'}
      disabled={!enabled}
      onClick={onClick}
      className={cn(
        'flex shrink-0 items-center justify-center rounded-xl px-1 transition-colors',
        enabled
          ? 'text-foreground hover:bg-accent'
          : 'cursor-default text-muted-foreground/40',
      )}
    >
      <Icon className="size-5" />
    </button>
  );
}

interface DayPillProps {
  day: DayStripDay;
  active: boolean;
  weekdayLabel: string;
  shiftCountLabel?: (count: number) => string;
  onSelect: (date: Date) => void;
  className?: string;
}

function DayPill({
  day,
  active,
  weekdayLabel,
  shiftCountLabel,
  onSelect,
  className,
}: DayPillProps) {
  const hasShifts = day.shiftCount > 0;
  // Inactive day-with-shifts: only the day number is foreground; weekday + count
  // are muted (matches the pencil two-column strip).
  const metaMuted = !active && hasShifts ? 'text-muted-foreground' : '';

  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      aria-disabled={!hasShifts}
      tabIndex={active ? 0 : -1}
      onClick={() => hasShifts && onSelect(day.date)}
      className={cn(
        'flex flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-2.5 text-center transition-colors',
        active && 'bg-primary text-primary-foreground',
        !active &&
          (hasShifts
            ? 'bg-border text-foreground hover:bg-accent'
            : 'cursor-default bg-muted text-muted-foreground'),
        className,
      )}
    >
      <span className={cn('text-xs font-medium', metaMuted)}>
        {weekdayLabel}
      </span>
      <span className="text-lg font-bold leading-none">
        {day.date.getDate()}
      </span>
      <span className={cn('whitespace-nowrap text-xs', metaMuted)}>
        {shiftCountLabel ? shiftCountLabel(day.shiftCount) : day.shiftCount}
      </span>
    </button>
  );
}

export function DayStrip(props: DayStripProps) {
  const { formatDate } = useFormatting();
  const today = useMemo(() => new Date(), []);

  if (props.paged) {
    return <PagedDayStrip {...props} formatDate={formatDate} today={today} />;
  }

  return <ScrollDayStrip {...props} formatDate={formatDate} today={today} />;
}

type FormatDate = ReturnType<typeof useFormatting>['formatDate'];

function PagedDayStrip({
  days,
  activeDates,
  onSelect,
  className,
  shiftCountLabel,
  formatDate,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
}: DayStripProps & { formatDate: FormatDate; today: Date }) {
  const active = activeDates ?? [];

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'ArrowLeft' && hasPrev) {
        event.preventDefault();
        onPrev?.();
      } else if (event.key === 'ArrowRight' && hasNext) {
        event.preventDefault();
        onNext?.();
      }
    },
    [hasPrev, hasNext, onPrev, onNext],
  );

  return (
    <div className={cn('flex items-stretch gap-2', className)}>
      <ArrowButton direction="left" enabled={!!hasPrev} onClick={onPrev} />

      <div
        role="tablist"
        aria-label="Day selector"
        onKeyDown={handleKeyDown}
        className="flex flex-1 gap-2 overflow-x-auto scrollbar-hide"
      >
        {days.map((day) => (
          <DayPill
            key={day.date.toISOString()}
            day={day}
            active={active.some((d) => isSameDate(d, day.date))}
            weekdayLabel={formatDate(day.date, { weekday: 'short' })}
            shiftCountLabel={shiftCountLabel}
            onSelect={onSelect}
            className="min-w-[72px] flex-1"
          />
        ))}
      </div>

      <ArrowButton direction="right" enabled={!!hasNext} onClick={onNext} />
    </div>
  );
}

function ScrollDayStrip({
  days,
  activeDate,
  onSelect,
  todayLabel,
  goToTodayLabel,
  className,
  shiftCountLabel,
  formatDate,
  today,
}: DayStripProps & { formatDate: FormatDate; today: Date }) {
  const stripRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const todayIndex = days.findIndex((day) => isSameDate(day.date, today));
  const activeIsToday = isSameDate(activeDate, today);

  const updateArrows = useCallback(() => {
    const strip = stripRef.current;
    if (!strip) return;
    setCanScrollLeft(strip.scrollLeft > 1);
    setCanScrollRight(
      strip.scrollLeft < strip.scrollWidth - strip.clientWidth - 1,
    );
  }, []);

  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    strip.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);
    return () => {
      strip.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
    };
  }, [updateArrows]);

  // Re-measure arrow availability whenever the day set changes.
  useEffect(() => {
    if (days.length === 0) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }
    updateArrows();
  }, [updateArrows, days]);

  const scrollByPage = (direction: -1 | 1) => {
    const strip = stripRef.current;
    if (!strip) return;
    strip.scrollBy({
      left: direction * strip.clientWidth * 0.8,
      behavior: 'smooth',
    });
  };

  const scrollToToday = useCallback(() => {
    // Use the strip's start-of-day date (day groups are keyed by start-of-day),
    // so onSelect can find and scroll to today's group.
    const todayDay = days[todayIndex];
    if (todayDay) onSelect(todayDay.date);
  }, [days, onSelect, todayIndex]);

  // Keep the active pill in view as the selection changes (e.g. scroll-spy).
  const activeDayIndex = days.findIndex((day) =>
    isSameDate(day.date, activeDate),
  );
  useEffect(() => {
    if (activeDayIndex < 0) return;
    const pill = stripRef.current?.children[activeDayIndex] as
      | HTMLElement
      | undefined;
    // `inline: center` scrolls the strip horizontally to the pill; `block:
    // nearest` avoids any vertical page scroll (the strip is already visible).
    pill?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    });
  }, [activeDayIndex]);

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
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-stretch gap-2">
        <ArrowButton
          direction="left"
          enabled={canScrollLeft}
          onClick={() => scrollByPage(-1)}
        />

        <div
          ref={stripRef}
          role="tablist"
          aria-label="Day selector"
          onKeyDown={handleKeyDown}
          className="flex flex-1 gap-2 overflow-x-auto scrollbar-hide py-1"
        >
          {days.map((day) => (
            <DayPill
              key={day.date.toISOString()}
              day={day}
              active={isSameDate(day.date, activeDate)}
              weekdayLabel={formatDate(day.date, { weekday: 'short' })}
              shiftCountLabel={shiftCountLabel}
              onSelect={onSelect}
              className="min-w-[72px] flex-1"
            />
          ))}
        </div>

        <ArrowButton
          direction="right"
          enabled={canScrollRight}
          onClick={() => scrollByPage(1)}
        />
      </div>

      <div className="flex justify-end">
        <Button
          variant="outline"
          size="md"
          onClick={scrollToToday}
          disabled={activeIsToday}
        >
          {activeIsToday ? todayLabel : (goToTodayLabel ?? todayLabel)}
        </Button>
      </div>
    </div>
  );
}

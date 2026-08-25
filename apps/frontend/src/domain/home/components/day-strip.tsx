'use client';

import { Button, cn } from '@repo/ui';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFormatting } from '@/lib/formatting/use-formatting';
import {
  getClosestShiftDayOnOrAfter,
  isSameDay,
  type SparseDayStripEntry,
} from '../lib/date-helpers';

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
  /**
   * The vertical list is actively being scrolled (scroll-spy mode only) —
   * dims inactive pills so the active-day handoff reads less as a blink.
   */
  isScrolling?: boolean;
  /**
   * Sparse mode: only days that actually have shifts, with "…" gap markers
   * for stretches of empty days — used by my-shifts instead of the full
   * contiguous `days` window. When set, `sparseDays` is used instead of
   * `days`.
   */
  sparse?: boolean;
  sparseDays?: SparseDayStripEntry[];
  /** Label for the "go to top" button (sparse mode only). */
  goToTopLabel?: string;
}

function ArrowButton({
  direction,
  enabled,
  label,
  onClick,
}: {
  direction: 'left' | 'right';
  enabled: boolean;
  label: string;
  onClick?: () => void;
}) {
  const Icon = direction === 'left' ? ChevronLeftIcon : ChevronRightIcon;
  return (
    <button
      type="button"
      aria-label={label}
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
  /** De-emphasize this pill while the list is actively being scrolled. */
  dimmed?: boolean;
  weekdayLabel: string;
  dayLabel: string;
  shiftCountLabel?: (count: number) => string;
  onSelect: (date: Date) => void;
  className?: string;
}

function DayPill({
  day,
  active,
  dimmed,
  weekdayLabel,
  dayLabel,
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
        'flex flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-2.5 text-center transition-all duration-300',
        active && 'bg-primary text-primary-foreground',
        !active &&
          (hasShifts
            ? 'bg-border text-foreground hover:bg-accent'
            : 'cursor-default bg-muted text-muted-foreground'),
        dimmed && !active && 'opacity-60',
        className,
      )}
    >
      <span className={cn('text-xs font-medium', metaMuted)}>
        {weekdayLabel}
      </span>
      <span className="text-lg font-bold leading-none">{dayLabel}</span>
      <span className={cn('whitespace-nowrap text-xs', metaMuted)}>
        {shiftCountLabel ? shiftCountLabel(day.shiftCount) : day.shiftCount}
      </span>
    </button>
  );
}

/** Non-interactive divider for a collapsed stretch of empty days (sparse mode). */
function GapPill() {
  return (
    <div
      aria-hidden="true"
      className="flex w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground"
    >
      <MoreHorizontalIcon className="size-4" />
    </div>
  );
}

export function DayStrip(props: DayStripProps) {
  const { formatDate } = useFormatting();
  const today = useMemo(() => new Date(), []);

  if (props.paged) {
    return <PagedDayStrip {...props} formatDate={formatDate} today={today} />;
  }

  if (props.sparse) {
    return (
      <SparseScrollDayStrip {...props} formatDate={formatDate} today={today} />
    );
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
  const t = useTranslations('VolunteerHome');
  const active = activeDates ?? [];
  const stripRef = useRef<HTMLDivElement>(null);

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

  // Keep the active pill in view as prev/next is used — otherwise the strip
  // can keep showing its old scroll position while the day below it changes,
  // looking out of sync with the list. Smooth is fine here: this only fires
  // on an explicit arrow/pill click, not on passive scroll-spy.
  const activeDayIndex = days.findIndex((day) =>
    active.some((d) => isSameDay(d, day.date)),
  );
  useEffect(() => {
    if (activeDayIndex < 0) return;
    const pill = stripRef.current?.children[activeDayIndex] as
      | HTMLElement
      | undefined;
    pill?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    });
  }, [activeDayIndex]);

  return (
    <div className={cn('flex items-stretch gap-2', className)}>
      <ArrowButton
        direction="left"
        enabled={!!hasPrev}
        label={t('dayStripPrevious')}
        onClick={onPrev}
      />

      <div
        ref={stripRef}
        role="tablist"
        aria-label={t('dayStripLabel')}
        onKeyDown={handleKeyDown}
        className="flex flex-1 gap-3 overflow-x-auto scrollbar-hide"
      >
        {days.map((day) => (
          <DayPill
            key={day.date.toISOString()}
            day={day}
            active={active.some((d) => isSameDay(d, day.date))}
            weekdayLabel={formatDate(day.date, { weekday: 'short' })}
            dayLabel={formatDate(day.date, { day: 'numeric' })}
            shiftCountLabel={shiftCountLabel}
            onSelect={onSelect}
            className="min-w-[84px] flex-1"
          />
        ))}
      </div>

      <ArrowButton
        direction="right"
        enabled={!!hasNext}
        label={t('dayStripNext')}
        onClick={onNext}
      />
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
  isScrolling,
}: DayStripProps & { formatDate: FormatDate; today: Date }) {
  const t = useTranslations('VolunteerHome');
  const stripRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const todayIndex = days.findIndex((day) => isSameDay(day.date, today));
  const activeIsToday = isSameDay(activeDate, today);

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
  // Snapped instantly, not smoothly: scroll-spy can retarget on every frame of
  // a vertical scroll, and a smooth glide per retarget is what caused the
  // strip to visibly jitter left/right while the user scrolled the list.
  // Smooth scrolling is reserved for explicit actions (arrow buttons, keyboard
  // nav, "today"), which already animate via their own calls below.
  const activeDayIndex = days.findIndex((day) =>
    isSameDay(day.date, activeDate),
  );
  useEffect(() => {
    if (activeDayIndex < 0) return;
    const pill = stripRef.current?.children[activeDayIndex] as
      | HTMLElement
      | undefined;
    // `inline: center` scrolls the strip horizontally to the pill; `block:
    // nearest` avoids any vertical page scroll (the strip is already visible).
    pill?.scrollIntoView({
      behavior: 'auto',
      inline: 'center',
      block: 'nearest',
    });
  }, [activeDayIndex]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

      event.preventDefault();
      const activeIndex = days.findIndex((day) =>
        isSameDay(day.date, activeDate),
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
          label={t('dayStripPrevious')}
          onClick={() => scrollByPage(-1)}
        />

        <div
          ref={stripRef}
          role="tablist"
          aria-label={t('dayStripLabel')}
          onKeyDown={handleKeyDown}
          className="flex flex-1 gap-3 overflow-x-auto scrollbar-hide py-1"
        >
          {days.map((day) => (
            <DayPill
              key={day.date.toISOString()}
              day={day}
              active={isSameDay(day.date, activeDate)}
              dimmed={isScrolling}
              weekdayLabel={formatDate(day.date, { weekday: 'short' })}
              dayLabel={formatDate(day.date, { day: 'numeric' })}
              shiftCountLabel={shiftCountLabel}
              onSelect={onSelect}
              className="min-w-[84px] flex-1"
            />
          ))}
        </div>

        <ArrowButton
          direction="right"
          enabled={canScrollRight}
          label={t('dayStripNext')}
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

/**
 * Sparse day strip (my-shifts): only days with shifts, plus non-interactive
 * "…" gap dividers for stretches of empty days (see `sparseDays`). Mirrors
 * `ScrollDayStrip`'s scaffolding, but "go to top" always jumps to the
 * closest upcoming shift-day rather than specifically "today" — the label
 * and enabled state don't depend on whether the active day happens to be
 * today.
 */
function SparseScrollDayStrip({
  sparseDays,
  activeDate,
  onSelect,
  goToTopLabel,
  className,
  shiftCountLabel,
  formatDate,
  isScrolling,
}: DayStripProps & { formatDate: FormatDate; today: Date }) {
  const t = useTranslations('VolunteerHome');
  const stripRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const entries = sparseDays ?? [];
  const dayEntries = useMemo(
    () => entries.filter((entry) => entry.type === 'day'),
    [entries],
  );

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

  useEffect(() => {
    if (entries.length === 0) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }
    updateArrows();
  }, [updateArrows, entries]);

  const scrollByPage = (direction: -1 | 1) => {
    const strip = stripRef.current;
    if (!strip) return;
    strip.scrollBy({
      left: direction * strip.clientWidth * 0.8,
      behavior: 'smooth',
    });
  };

  const scrollToTop = useCallback(() => {
    const target = getClosestShiftDayOnOrAfter(dayEntries, new Date());
    if (target) onSelect(target.date);
  }, [dayEntries, onSelect]);

  // Keep the active pill in view as the selection changes (e.g. scroll-spy).
  // Snapped instantly — see the equivalent effect in `ScrollDayStrip` for why.
  const activeEntryIndex = entries.findIndex(
    (entry) => entry.type === 'day' && isSameDay(entry.date, activeDate),
  );
  useEffect(() => {
    if (activeEntryIndex < 0) return;
    const pill = stripRef.current?.children[activeEntryIndex] as
      | HTMLElement
      | undefined;
    pill?.scrollIntoView({
      behavior: 'auto',
      inline: 'center',
      block: 'nearest',
    });
  }, [activeEntryIndex]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

      event.preventDefault();
      const activeIndex = dayEntries.findIndex((entry) =>
        isSameDay(entry.date, activeDate),
      );
      const direction = event.key === 'ArrowLeft' ? -1 : 1;
      const nextEntry = dayEntries[activeIndex + direction];
      if (nextEntry) onSelect(nextEntry.date);
    },
    [activeDate, dayEntries, onSelect],
  );

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-stretch gap-2">
        <ArrowButton
          direction="left"
          enabled={canScrollLeft}
          label={t('dayStripPrevious')}
          onClick={() => scrollByPage(-1)}
        />

        <div
          ref={stripRef}
          role="tablist"
          aria-label={t('dayStripLabel')}
          onKeyDown={handleKeyDown}
          className="flex flex-1 gap-3 overflow-x-auto scrollbar-hide py-1"
        >
          {entries.map((entry) =>
            entry.type === 'gap' ? (
              <GapPill key={entry.key} />
            ) : (
              <DayPill
                key={entry.date.toISOString()}
                day={entry}
                active={isSameDay(entry.date, activeDate)}
                dimmed={isScrolling}
                weekdayLabel={formatDate(entry.date, { weekday: 'short' })}
                dayLabel={formatDate(entry.date, { day: 'numeric' })}
                shiftCountLabel={shiftCountLabel}
                onSelect={onSelect}
                className="min-w-[84px] flex-1"
              />
            ),
          )}
        </div>

        <ArrowButton
          direction="right"
          enabled={canScrollRight}
          label={t('dayStripNext')}
          onClick={() => scrollByPage(1)}
        />
      </div>

      <div className="flex justify-end">
        <Button variant="outline" size="md" onClick={scrollToTop}>
          {goToTopLabel}
        </Button>
      </div>
    </div>
  );
}

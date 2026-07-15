'use client';

import { cn, DetailPageHeader } from '@repo/ui';
import { useTranslations } from 'next-intl';
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useRouter } from '@/i18n/navigation';
import { useFormatting } from '@/lib/formatting/use-formatting';
import { startOfDay } from '../lib/date-helpers';
import { DayStrip, type DayStripDay } from './day-strip';
import { DayStripSkeleton } from './day-strip-skeleton';

// Beyond this many viewports away, a smooth scroll just whooshes through
// everything, so jump instantly instead. Nearer targets glide smoothly.
const SMOOTH_SCROLL_MAX_VIEWPORTS = 1.5;

export interface DayGroup<T> {
  date: Date;
  items: T[];
}

interface DayTimelineViewProps<T> {
  title: string;
  isLoading: boolean;
  days: DayStripDay[];
  groups: DayGroup<T>[];
  /** Whether there is any data (controls strip vs empty state). */
  hasContent: boolean;
  loading: ReactNode;
  empty: ReactNode;
  /** Renders a day's body (warnings + cards). The day head is rendered here. */
  renderContent: (group: DayGroup<T>) => ReactNode;
  /** Dim the day head (e.g. for past days). */
  isDayDimmed?: (group: DayGroup<T>) => boolean;
}

export function DayTimelineView<T>({
  title,
  isLoading,
  days,
  groups,
  hasContent,
  loading,
  empty,
  renderContent,
  isDayDimmed,
}: DayTimelineViewProps<T>) {
  const t = useTranslations('VolunteerHome');
  const ct = useTranslations('Common');
  const router = useRouter();
  const { formatDate } = useFormatting();
  const [activeDay, setActiveDay] = useState<Date>(startOfDay(new Date()));
  const [isScrolling, setIsScrolling] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const didInitialScroll = useRef(false);
  // The sticky header's height, kept live so the scroll offset stays correct as
  // the header reflows (e.g. the strip wraps to a new line).
  const [headerHeight, setHeaderHeight] = useState(0);

  // A day heading sits `headerHeight + 8` below the top; `scroll-margin-top`
  // lets a plain `scrollIntoView({ block: 'start' })` land it just under the
  // sticky header — no manual offset arithmetic.
  const scrollMarginTop = headerHeight + 8;

  const scrollToDay = useCallback(
    (date: Date, smooth: boolean) => {
      const el = listRef.current?.querySelector(
        `[data-day="${date.getTime()}"]`,
      );
      if (!el) return;
      // How far the page must travel to bring the target under the header.
      const distance = Math.abs(
        el.getBoundingClientRect().top - scrollMarginTop,
      );
      const glide =
        smooth && distance < window.innerHeight * SMOOTH_SCROLL_MAX_VIEWPORTS;
      el.scrollIntoView({
        behavior: glide ? 'smooth' : 'auto',
        block: 'start',
      });
    },
    [scrollMarginTop],
  );

  // The strip only *requests* a scroll; the scroll-spy below is the single
  // source of truth for which day is active, so the two can't fight. Far jumps
  // are instant (no whoosh) so the spy lands on the target in one step; near
  // jumps glide and the spy simply tracks along.
  const handleSelectDay = (date: Date) => scrollToDay(date, true);

  // Track the sticky header height reactively.
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setHeaderHeight(el.offsetHeight));
    observer.observe(el);
    setHeaderHeight(el.offsetHeight);
    return () => observer.disconnect();
  }, []);

  // Scroll-spy: the active day is the first one whose heading sits below the
  // sticky header. As a heading tucks up behind the header the next day takes
  // over; once every heading is above it (bottom of the list) the last day wins.
  useEffect(() => {
    const root = listRef.current;
    if (!root || groups.length === 0) return;
    const headings = Array.from(
      root.querySelectorAll<HTMLElement>('[data-day]'),
    );

    let raf = 0;
    const update = () => {
      raf = 0;
      // Measure the header's live bottom edge so the line is always exact.
      const headerBottom =
        headerRef.current?.getBoundingClientRect().bottom ?? 0;
      const active =
        headings.find((el) => el.getBoundingClientRect().top >= headerBottom) ??
        headings[headings.length - 1];
      if (!active) return;
      const key = Number(active.getAttribute('data-day'));
      setActiveDay((prev) => (prev.getTime() === key ? prev : new Date(key)));
    };
    // Dim inactive pills while a scroll gesture is in flight, and undim once
    // it settles — softens the active-pill handoff so it reads as a fade
    // rather than a blink.
    let scrollEndTimeout: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
      setIsScrolling(true);
      clearTimeout(scrollEndTimeout);
      scrollEndTimeout = setTimeout(() => setIsScrolling(false), 150);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
      clearTimeout(scrollEndTimeout);
    };
  }, [groups]);

  // On first load, land on today (or the closest upcoming day).
  useEffect(() => {
    if (didInitialScroll.current || groups.length === 0) return;
    const todayStart = startOfDay(new Date()).getTime();
    const target =
      groups.find((group) => group.date.getTime() === todayStart) ??
      groups.find((group) => group.date.getTime() >= todayStart) ??
      groups[groups.length - 1];
    if (!target) return;
    didInitialScroll.current = true;
    scrollToDay(target.date, false);
  }, [groups, scrollToDay]);

  return (
    <div>
      <div ref={headerRef} className="sticky top-0 z-30 bg-muted">
        <div className="mx-auto w-full max-w-4xl">
          <DetailPageHeader
            className="bg-transparent px-6"
            title={title}
            onBack={router.back}
            backLabel={ct('back')}
          />
          {(isLoading || hasContent) && (
            <div className="px-6 pb-3">
              {isLoading ? (
                <DayStripSkeleton />
              ) : (
                <DayStrip
                  days={days}
                  activeDate={activeDay}
                  onSelect={handleSelectDay}
                  todayLabel={t('todayButton')}
                  goToTodayLabel={t('goToToday')}
                  shiftCountLabel={(n) => t('yourShiftsCount', { n })}
                  isScrolling={isScrolling}
                />
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto w-full max-w-4xl px-6 py-4">
        {isLoading ? (
          loading
        ) : !hasContent ? (
          empty
        ) : (
          <div ref={listRef} className="flex flex-col gap-6">
            {groups.map((group) => (
              <div
                key={group.date.toISOString()}
                data-day={group.date.getTime()}
                className="space-y-4"
                style={{ scrollMarginTop }}
              >
                <div
                  className={cn(
                    'flex items-center justify-between gap-2',
                    isDayDimmed?.(group) && 'opacity-55',
                  )}
                >
                  <h3 className="text-lg font-semibold text-foreground">
                    {formatDate(group.date, {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </h3>
                  <span className="shrink-0 text-base text-muted-foreground">
                    {t('yourShiftsCount', { n: group.items.length })}
                  </span>
                </div>
                {renderContent(group)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

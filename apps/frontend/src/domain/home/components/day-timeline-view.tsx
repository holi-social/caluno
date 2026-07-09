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

  const listRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const suppressSpyRef = useRef(false);
  const didInitialScroll = useRef(false);

  const scrollToDay = useCallback((date: Date, smooth: boolean) => {
    const el = listRef.current?.querySelector(`[data-day="${date.getTime()}"]`);
    if (!el) return;
    const headerHeight = headerRef.current?.offsetHeight ?? 0;
    // Suppress the scroll-spy during the programmatic scroll so it does not
    // briefly re-activate a day we are scrolling past.
    suppressSpyRef.current = true;
    window.setTimeout(() => {
      suppressSpyRef.current = false;
    }, 700);
    window.scrollTo({
      top: el.getBoundingClientRect().top + window.scrollY - headerHeight - 8,
      behavior: smooth ? 'smooth' : 'auto',
    });
  }, []);

  const handleSelectDay = (date: Date) => {
    setActiveDay(date);
    scrollToDay(date, true);
  };

  // Scroll-spy: mark the first day below the sticky header as active.
  useEffect(() => {
    const root = listRef.current;
    if (!root || groups.length === 0) return;
    const headings = Array.from(
      root.querySelectorAll<HTMLElement>('[data-day]'),
    );
    const headerHeight = headerRef.current?.offsetHeight ?? 160;

    const observer = new IntersectionObserver(
      (entries) => {
        if (suppressSpyRef.current) return;
        const top = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
          )[0];
        if (!top) return;
        const key = Number(top.target.getAttribute('data-day'));
        setActiveDay((prev) => (prev.getTime() === key ? prev : new Date(key)));
      },
      { rootMargin: `-${headerHeight + 8}px 0px -55% 0px`, threshold: 0 },
    );
    for (const heading of headings) {
      observer.observe(heading);
    }
    return () => observer.disconnect();
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
    setActiveDay(target.date);
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

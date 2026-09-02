'use client';

import { Button } from '@repo/ui';
import { addDays, addWeeks, format, getISOWeek, subWeeks } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useCallback } from 'react';
import { useRouter } from '@/i18n/navigation';

type WeeklyCalendarNavProps = {
  weekStart: Date;
  /** Path without query string, e.g. `/admin/{org}/shifts`. */
  pathname: string;
  /** Static query params preserved on week change (`week` is always set). */
  query?: Record<string, string>;
};

export function WeeklyCalendarNav({
  weekStart,
  pathname,
  query,
}: WeeklyCalendarNavProps) {
  const router = useRouter();
  const t = useTranslations('Shift');
  const formatter = useFormatter();

  const navigate = useCallback(
    (direction: 'prev' | 'next') => {
      const newStart =
        direction === 'prev' ? subWeeks(weekStart, 1) : addWeeks(weekStart, 1);
      const params = new URLSearchParams(query ?? {});
      params.set('week', format(newStart, 'yyyy-MM-dd'));
      router.push(`${pathname}?${params.toString()}`);
    },
    [weekStart, router, pathname, query],
  );

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon-sm"
        tooltip={t('calendar.prevAria')}
        onClick={() => navigate('prev')}
      >
        <ChevronLeft className="size-4" />
      </Button>

      <span className="text-sm font-medium">
        <span className="font-bold">
          {t('calendar.week', { week: getISOWeek(weekStart) })}
        </span>{' '}
        {formatter.dateTime(weekStart, { month: 'short', day: 'numeric' })} –{' '}
        {formatter.dateTime(addDays(weekStart, 6), {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}
      </span>

      <Button
        variant="outline"
        size="icon-sm"
        tooltip={t('calendar.nextAria')}
        onClick={() => navigate('next')}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}

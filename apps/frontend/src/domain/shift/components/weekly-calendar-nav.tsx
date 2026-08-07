'use client';

import { ActionTooltip, Button } from '@repo/ui';
import { addDays, addWeeks, format, getISOWeek, subWeeks } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useFormatter, useTranslations } from 'next-intl';
import { useCallback } from 'react';
import { useRouter } from '@/i18n/navigation';

type WeeklyCalendarNavProps = {
  weekStart: Date;
  orgUId: string;
};

export function WeeklyCalendarNav({
  weekStart,
  orgUId,
}: WeeklyCalendarNavProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations('Shift');
  const formatter = useFormatter();

  const navigate = useCallback(
    (direction: 'prev' | 'next') => {
      const newStart =
        direction === 'prev' ? subWeeks(weekStart, 1) : addWeeks(weekStart, 1);
      const params = new URLSearchParams(searchParams.toString());
      params.set('week', format(newStart, 'yyyy-MM-dd'));
      params.set('view', 'weekplan');
      router.push(`/admin/${orgUId}/shifts?${params.toString()}`);
    },
    [weekStart, searchParams, router, orgUId],
  );

  return (
    <div className="flex items-center gap-2">
      <ActionTooltip label={t('calendar.prevAria')}>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => navigate('prev')}
          aria-label={t('calendar.prevAria')}
        >
          <ChevronLeft className="size-4" />
        </Button>
      </ActionTooltip>

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

      <ActionTooltip label={t('calendar.nextAria')}>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => navigate('next')}
          aria-label={t('calendar.nextAria')}
        >
          <ChevronRight className="size-4" />
        </Button>
      </ActionTooltip>
    </div>
  );
}

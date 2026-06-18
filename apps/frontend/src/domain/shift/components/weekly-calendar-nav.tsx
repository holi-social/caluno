'use client';

import { Button } from '@repo/ui';
import { addDays, addWeeks, format, getISOWeek, subWeeks } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
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
      <Button variant="outline" size="icon-sm" onClick={() => navigate('prev')}>
        <ChevronLeft className="size-4" />
      </Button>

      <span className="text-sm font-medium">
        <span className="font-bold">KW {getISOWeek(weekStart)}</span>{' '}
        {format(weekStart, 'MMM d')} –{' '}
        {format(addDays(weekStart, 6), 'MMM d, yyyy')}
      </span>

      <Button variant="outline" size="icon-sm" onClick={() => navigate('next')}>
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}

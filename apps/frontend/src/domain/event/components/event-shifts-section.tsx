'use client';

import type { RawPublicEvent } from '@repo/data';
import { SegmentedControl } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { EventShiftCalendar } from './event-shift-calendar';
import { EventShiftList } from './event-shift-list';

type Shift = NonNullable<RawPublicEvent>['shifts'][number];

interface EventShiftsSectionProps {
  startsAt: string;
  endsAt: string;
  shifts: Shift[];
}

export function EventShiftsSection({
  startsAt,
  endsAt,
  shifts,
}: EventShiftsSectionProps) {
  const t = useTranslations('EventDetail');
  const [view, setView] = useState<'list' | 'calendar'>('list');

  return (
    <section className="mt-6">
      <div className="mb-4 md:hidden">
        <SegmentedControl
          options={[
            { value: 'list', label: t('shiftsToggleList') },
            { value: 'calendar', label: t('shiftsToggleCalendar') },
          ]}
          value={view}
          onChange={(value) => setView(value as 'list' | 'calendar')}
        />
      </div>
      {view === 'list' ? (
        <EventShiftList shifts={shifts} />
      ) : (
        <EventShiftCalendar
          startsAt={startsAt}
          endsAt={endsAt}
          shifts={shifts}
        />
      )}
    </section>
  );
}

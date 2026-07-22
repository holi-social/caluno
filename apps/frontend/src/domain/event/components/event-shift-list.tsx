'use client';

import type { RawPublicEvent } from '@repo/data';
import { cn } from '@repo/ui';
import { ArrowRightIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { EventShiftCard } from './event-shift-card';

type Shift = NonNullable<RawPublicEvent>['shifts'][number];

interface EventShiftListProps {
  shifts: Shift[];
}

const MAX_DESKTOP_CARDS = 4;

export function EventShiftList({ shifts }: EventShiftListProps) {
  const t = useTranslations('EventDetail');
  const [expanded, setExpanded] = useState(false);
  const hasOverflow = shifts.length > MAX_DESKTOP_CARDS;

  if (shifts.length === 0) {
    return <p className="text-muted-foreground">{t('noShifts')}</p>;
  }

  return (
    <section>
      <div className="flex items-center justify-between border-b border-border pb-4">
        <h2 className="text-xl font-bold text-foreground">
          {t('shiftsHeading')}
        </h2>
        <span className="text-sm font-medium text-muted-foreground">
          {t('shiftsCount', { n: shifts.length })}
        </span>
      </div>
      <div className="mt-4 flex flex-col gap-2">
        {shifts.map((shift, index) => (
          <div
            key={shift.id}
            className={cn(
              !expanded && index >= MAX_DESKTOP_CARDS && 'md:hidden',
            )}
          >
            <EventShiftCard shift={shift} />
          </div>
        ))}
      </div>
      {hasOverflow && !expanded && (
        <>
          <hr className="mt-4 hidden border-border md:block" />
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="mt-4 hidden w-full items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium text-foreground hover:bg-accent md:flex"
          >
            {t('showAllShifts')}
            <ArrowRightIcon className="size-4" />
          </button>
        </>
      )}
    </section>
  );
}

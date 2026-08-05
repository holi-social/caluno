'use client';

import type { MyShiftInstance } from '@repo/data/react';
import { Button, cn } from '@repo/ui';
import { TriangleAlertIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { useFormatting } from '@/lib/formatting/use-formatting';
import { clusterOverlappingShifts } from '../lib/date-helpers';
import type { DayGroup } from './day-timeline-view';
import { ShiftCardMy } from './shift-card-my';
import { ShiftCardMyShift } from './shift-card-my-shift';

export interface MyShiftsDayRowsProps {
  group: DayGroup<MyShiftInstance>;
  nextShiftId: string | undefined;
  now: Date;
}

interface ShiftRowCardProps {
  shift: MyShiftInstance;
  nextShiftId: string | undefined;
  now: Date;
}

function ShiftRowCard({ shift, nextShiftId, now }: ShiftRowCardProps) {
  const isPending = shift.isIntended;
  if (shift.id === nextShiftId) {
    return (
      <ShiftCardMy
        shiftInstance={shift}
        showTime={false}
        isPending={isPending}
      />
    );
  }
  const isPast = new Date(shift.actualEndsAt).getTime() < now.getTime();
  return (
    <ShiftCardMyShift
      shiftInstance={shift}
      past={isPast}
      showTime={false}
      isPending={isPending}
    />
  );
}

// Always show at least this many cards, fully readable (not a fanned/hidden
// stack) — only clusters larger than this get a "+N more" toggle.
const PILE_VISIBLE_COUNT = 5;

function ConflictPile({
  items,
  nextShiftId,
  now,
}: {
  items: MyShiftInstance[];
  nextShiftId: string | undefined;
  now: Date;
}) {
  const [expanded, setExpanded] = useState(false);
  const t = useTranslations('VolunteerHome');

  const overflow = items.length - PILE_VISIBLE_COUNT;
  const visible = expanded ? items : items.slice(0, PILE_VISIBLE_COUNT);

  return (
    <div className="flex flex-col gap-2">
      {visible.map((shift) => (
        <ShiftRowCard
          key={shift.id}
          shift={shift}
          nextShiftId={nextShiftId}
          now={now}
        />
      ))}
      {overflow > 0 &&
        (expanded ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(false)}
            className="self-start"
          >
            {t('conflictCollapse')}
          </Button>
        ) : (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="self-start text-sm font-medium text-primary"
            aria-label={t('conflictExpand', { n: items.length })}
          >
            {t('conflictMore', { n: overflow })}
          </button>
        ))}
      <p className="flex items-center gap-2 text-sm text-alert">
        <TriangleAlertIcon className="size-4 shrink-0" aria-hidden="true" />
        {t('overlapWarning')}
      </p>
    </div>
  );
}

export function MyShiftsDayRows({
  group,
  nextShiftId,
  now,
}: MyShiftsDayRowsProps) {
  const t = useTranslations('VolunteerHome');
  const { formatTime } = useFormatting();
  const clusters = useMemo(
    () => clusterOverlappingShifts(group.items),
    [group.items],
  );

  return (
    <div className="flex flex-col gap-4">
      {clusters.map((cluster) => {
        const isConflict = cluster.items.length > 1;
        const first = cluster.items[0];
        if (!first) return null;

        return (
          <div key={first.id} className="flex gap-3">
            <div
              className={cn(
                'flex w-[56px] shrink-0 items-start justify-end gap-1 pt-1 text-right font-bold',
                isConflict ? 'text-alert' : 'text-foreground',
              )}
            >
              {isConflict && (
                <TriangleAlertIcon
                  className="size-4 shrink-0"
                  aria-hidden="true"
                />
              )}
              <span>{formatTime(cluster.earliestStart)}</span>
            </div>

            <div className="min-w-0 flex-1">
              {cluster.items.length === 1 && (
                <ShiftRowCard
                  shift={first}
                  nextShiftId={nextShiftId}
                  now={now}
                />
              )}

              {cluster.items.length === 2 && (
                <>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {cluster.items.map((shift) => (
                      <ShiftRowCard
                        key={shift.id}
                        shift={shift}
                        nextShiftId={nextShiftId}
                        now={now}
                      />
                    ))}
                  </div>
                  <p className="mt-2 flex items-center gap-2 text-sm text-alert">
                    <TriangleAlertIcon
                      className="size-4 shrink-0"
                      aria-hidden="true"
                    />
                    {t('overlapWarning')}
                  </p>
                </>
              )}

              {cluster.items.length >= 3 && (
                <ConflictPile
                  items={cluster.items}
                  nextShiftId={nextShiftId}
                  now={now}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

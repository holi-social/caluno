'use client';

import { Card } from '@repo/ui';
import { MapPinIcon, RepeatIcon } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useFormatting } from '@/lib/formatting/use-formatting';
import { useRecurrenceLabel } from '../lib/recurrence-label';

export interface ShiftCardMyFutureProps {
  shiftInstance: {
    id: string;
    actualStartsAt: string;
    actualEndsAt: string;
    master: {
      id: string;
      title: string;
      location?: string | null;
      rrule?: string | null;
    };
  };
  /** Show the shift's date (used in the home preview where there is no day head). */
  showDate?: boolean;
}

export function ShiftCardMyFuture({
  shiftInstance,
  showDate = false,
}: ShiftCardMyFutureProps) {
  const { formatTimeRange, formatDate } = useFormatting();
  const getRecurrenceLabel = useRecurrenceLabel();
  const recurrence = getRecurrenceLabel(shiftInstance.master.rrule);

  return (
    <Link
      href={`/shifts/${shiftInstance.master.id}`}
      className="block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-1"
    >
      <Card className="flex h-full w-full flex-col gap-1 rounded-xl border border-border bg-card p-3">
        {showDate && (
          <p className="text-sm font-semibold text-foreground">
            {formatDate(new Date(shiftInstance.actualStartsAt), {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            })}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          {formatTimeRange(
            shiftInstance.actualStartsAt,
            shiftInstance.actualEndsAt,
          )}
        </p>
        {recurrence && (
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <RepeatIcon className="size-3.5 shrink-0" />
            {recurrence}
          </span>
        )}
        <h3 className="line-clamp-2 font-semibold text-foreground">
          {shiftInstance.master.title}
        </h3>
        {shiftInstance.master.location && (
          <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
            <MapPinIcon className="size-3 shrink-0" />
            {shiftInstance.master.location}
          </p>
        )}
      </Card>
    </Link>
  );
}

'use client';

import { Card } from '@repo/ui';
import { MapPinIcon, RepeatIcon } from 'lucide-react';
import { useFormatting } from '@/lib/formatting/use-formatting';
import { useRecurrenceLabel } from '../lib/recurrence-label';

export interface ShiftCardMyPastProps {
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
}

export function ShiftCardMyPast({ shiftInstance }: ShiftCardMyPastProps) {
  const { formatTimeRange } = useFormatting();
  const getRecurrenceLabel = useRecurrenceLabel();
  const recurrence = getRecurrenceLabel(shiftInstance.master.rrule);

  return (
    <Card className="flex w-full flex-col gap-1 rounded-xl border border-border bg-card p-3 opacity-55">
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
  );
}

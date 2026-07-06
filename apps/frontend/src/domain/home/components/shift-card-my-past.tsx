'use client';

import { Card, CardContent } from '@repo/ui';
import { MapPinIcon } from 'lucide-react';
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

  return (
    <Card className="rounded-xl border border-border bg-muted min-w-[140px]">
      <CardContent className="p-3">
        <p className="text-sm text-muted-foreground">
          {formatTimeRange(
            shiftInstance.actualStartsAt,
            shiftInstance.actualEndsAt,
          )}
        </p>
        <h3 className="font-semibold text-foreground truncate">
          {shiftInstance.master.title}
        </h3>
        {shiftInstance.master.rrule && (
          <p className="text-sm text-muted-foreground">
            {getRecurrenceLabel(shiftInstance.master.rrule)}
          </p>
        )}
        {shiftInstance.master.location && (
          <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
            <MapPinIcon className="size-3 shrink-0" />
            {shiftInstance.master.location}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

'use client';

import { Badge, Card, cn } from '@repo/ui';
import { CircleAlertIcon, CircleDot, RepeatIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { Link } from '@/i18n/navigation';
import { useFormatting } from '@/lib/formatting/use-formatting';
import { useRecurrenceLabel } from '../lib/recurrence-label';

export interface DiscoveryShiftInstance {
  id: string;
  actualStartsAt: string;
  actualEndsAt: string;
  filledCount: number;
  master: {
    id: string;
    title: string;
    maxVolunteers?: number | null;
    rrule?: string | null;
    organizationUnit: { name: string };
  };
}

interface ShiftCardDiscoveryProps {
  shiftInstance: DiscoveryShiftInstance;
  conflictsWithBooked?: boolean;
  /** Optional media rendered flush at the top (e.g. an event cover). */
  cover?: ReactNode;
}

export function ShiftCardDiscovery({
  shiftInstance,
  conflictsWithBooked = false,
  cover,
}: ShiftCardDiscoveryProps) {
  const { formatTimeRange } = useFormatting();
  const getRecurrenceLabel = useRecurrenceLabel();
  const t = useTranslations('VolunteerHome');
  const recurrence = getRecurrenceLabel(shiftInstance.master.rrule);
  const spotsLeft =
    shiftInstance.master.maxVolunteers != null
      ? shiftInstance.master.maxVolunteers - shiftInstance.filledCount
      : null;
  const fullyBooked = spotsLeft !== null && spotsLeft <= 0;

  const content = (
    <Card
      className={cn(
        'flex flex-col overflow-hidden rounded-xl border border-border bg-card',
        fullyBooked && 'bg-muted',
      )}
    >
      {cover}
      <div className="flex flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-base font-semibold text-foreground">
            {formatTimeRange(
              shiftInstance.actualStartsAt,
              shiftInstance.actualEndsAt,
            )}
          </p>
          {recurrence && (
            <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-muted-foreground">
              <RepeatIcon className="size-3.5" />
              {recurrence}
            </span>
          )}
        </div>
        <h3 className="text-lg font-semibold text-foreground">
          {shiftInstance.master.title}
        </h3>
        <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <CircleDot className="size-3 shrink-0" />
          {shiftInstance.master.organizationUnit.name}
        </p>
        {spotsLeft !== null && (
          <Badge variant="outline" className="w-fit">
            {fullyBooked ? t('fullyBooked') : t('spotsLeft', { n: spotsLeft })}
          </Badge>
        )}
        {conflictsWithBooked && (
          <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
            <CircleAlertIcon className="size-4 shrink-0" />
            <span>{t('discoverConflict')}</span>
          </div>
        )}
      </div>
    </Card>
  );

  if (fullyBooked) {
    return (
      <div aria-disabled="true" className="block">
        {content}
      </div>
    );
  }

  return (
    <Link
      href={`/shifts/${shiftInstance.master.id}`}
      className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-1"
    >
      {content}
    </Link>
  );
}

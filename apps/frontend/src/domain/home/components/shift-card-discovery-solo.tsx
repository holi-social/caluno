'use client';

import { Badge, Card, CardContent, cn } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useFormatting } from '@/lib/formatting/use-formatting';
import { useRecurrenceLabel } from '../lib/recurrence-label';

export interface ShiftCardDiscoverySoloProps {
  shiftInstance: {
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
  };
}

export function ShiftCardDiscoverySolo({
  shiftInstance,
}: ShiftCardDiscoverySoloProps) {
  const { formatTimeRange } = useFormatting();
  const getRecurrenceLabel = useRecurrenceLabel();
  const t = useTranslations('VolunteerHome');
  const spotsLeft =
    shiftInstance.master.maxVolunteers != null
      ? shiftInstance.master.maxVolunteers - shiftInstance.filledCount
      : null;
  const fullyBooked = spotsLeft !== null && spotsLeft <= 0;

  const content = (
    <Card
      className={cn(
        'rounded-xl border border-border bg-card',
        fullyBooked && 'bg-muted',
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted-foreground">
              {formatTimeRange(
                shiftInstance.actualStartsAt,
                shiftInstance.actualEndsAt,
              )}
            </p>
            <h3 className="font-semibold text-foreground truncate">
              {shiftInstance.master.title}
            </h3>
            <p className="text-sm text-muted-foreground truncate">
              {shiftInstance.master.organizationUnit.name}
            </p>
            {shiftInstance.master.rrule && (
              <p className="text-sm text-muted-foreground">
                {getRecurrenceLabel(shiftInstance.master.rrule)}
              </p>
            )}
          </div>
          {spotsLeft !== null && (
            <Badge variant="outline">
              {fullyBooked
                ? t('fullyBooked')
                : t('spotsLeft', { n: spotsLeft })}
            </Badge>
          )}
        </div>
      </CardContent>
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
      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-1 rounded-xl"
    >
      {content}
    </Link>
  );
}

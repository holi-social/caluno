'use client';

import { Badge, Card, CardContent, cn } from '@repo/ui';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useFormatting } from '@/lib/formatting/use-formatting';
import { useRecurrenceLabel } from '../lib/recurrence-label';

export interface ShiftCardDiscoveryEventProps {
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
      event?: { title: string; coverImageUrl?: string | null } | null;
    };
  };
}

export function ShiftCardDiscoveryEvent({
  shiftInstance,
}: ShiftCardDiscoveryEventProps) {
  const { formatTimeRange } = useFormatting();
  const getRecurrenceLabel = useRecurrenceLabel();
  const t = useTranslations('VolunteerHome');
  const event = shiftInstance.master.event;
  const spotsLeft =
    shiftInstance.master.maxVolunteers != null
      ? shiftInstance.master.maxVolunteers - shiftInstance.filledCount
      : null;
  const fullyBooked = spotsLeft !== null && spotsLeft <= 0;

  const content = (
    <Card
      className={cn(
        'rounded-xl border border-border bg-card overflow-hidden',
        fullyBooked && 'bg-muted',
      )}
    >
      {event?.coverImageUrl ? (
        <div className="relative h-[120px] w-full">
          <Image
            src={event.coverImageUrl}
            alt=""
            fill
            unoptimized
            className="object-cover"
            sizes="100vw"
          />
        </div>
      ) : (
        <div className="h-[120px] w-full bg-muted" />
      )}
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground truncate">{event?.title}</p>
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
        {spotsLeft !== null && (
          <Badge variant="outline" className="mt-2">
            {fullyBooked ? t('fullyBooked') : t('spotsLeft', { n: spotsLeft })}
          </Badge>
        )}
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

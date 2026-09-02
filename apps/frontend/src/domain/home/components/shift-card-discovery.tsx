'use client';

import { Badge, Card, cn } from '@repo/ui';
import {
  CalendarIcon,
  ChevronRightIcon,
  CircleAlertIcon,
  CircleDot,
  RepeatIcon,
} from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { shiftPublicPath } from '@/domain/shift/share';
import { Link } from '@/i18n/navigation';
import { useFormatting } from '@/lib/formatting/use-formatting';
import { useRecurrenceLabel } from '../lib/recurrence-label';

export interface DiscoveryShiftInstance {
  id: string;
  overrideTitle?: string | null;
  actualStartsAt: string;
  actualEndsAt: string;
  filledCount: number;
  master: {
    id: string;
    title: string;
    maxVolunteers?: number | null;
    rrule?: string | null;
    organizationUnit: { name: string; logoUrl?: string | null };
    event?: { id: string; title: string; coverImageUrl?: string | null } | null;
  };
}

interface ShiftCardDiscoveryProps {
  shiftInstance: DiscoveryShiftInstance;
  conflictsWithBooked?: boolean;
}

export function ShiftCardDiscovery({
  shiftInstance,
  conflictsWithBooked = false,
}: ShiftCardDiscoveryProps) {
  const { formatTimeRange } = useFormatting();
  const getRecurrenceLabel = useRecurrenceLabel();
  const t = useTranslations('VolunteerHome');
  const event = shiftInstance.master.event;
  const recurrence = getRecurrenceLabel(shiftInstance.master.rrule);
  const spotsLeft =
    shiftInstance.master.maxVolunteers != null
      ? shiftInstance.master.maxVolunteers - shiftInstance.filledCount
      : null;
  const fullyBooked = spotsLeft !== null && spotsLeft <= 0;

  const body = (
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
        {shiftInstance.overrideTitle ?? shiftInstance.master.title}
      </h3>
      <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
        {shiftInstance.master.organizationUnit.logoUrl ? (
          <Image
            src={shiftInstance.master.organizationUnit.logoUrl}
            alt=""
            width={16}
            height={16}
            unoptimized
            className="size-4 shrink-0 rounded-sm object-cover"
          />
        ) : (
          <CircleDot className="size-3 shrink-0" />
        )}
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
  );

  return (
    <Card
      className={cn(
        'flex flex-col gap-0 overflow-hidden rounded-xl border border-border bg-card p-0',
        fullyBooked && 'bg-muted',
      )}
    >
      {event && (
        <Link
          href={`/events/${event.id}`}
          prefetch={false}
          className="relative block h-[120px] w-full bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
        >
          {event.coverImageUrl && (
            <Image
              src={event.coverImageUrl}
              alt={t('eventCoverImageAlt', { title: event.title })}
              fill
              unoptimized
              className="object-cover"
              sizes="100vw"
            />
          )}
          <div className="absolute left-3 top-3 flex max-w-[calc(100%-24px)] items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-sm font-medium text-white">
            <CalendarIcon className="size-4 shrink-0" />
            <span className="truncate">
              {t('partOfEvent', { event: event.title })}
            </span>
            <ChevronRightIcon className="size-4 shrink-0" />
          </div>
        </Link>
      )}
      {fullyBooked ? (
        <div aria-disabled="true">{body}</div>
      ) : (
        <Link
          href={shiftPublicPath(shiftInstance.master.id, shiftInstance.id)}
          prefetch={false}
          className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-1"
        >
          {body}
        </Link>
      )}
    </Card>
  );
}

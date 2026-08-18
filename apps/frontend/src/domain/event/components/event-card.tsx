'use client';

import type { EventListItem } from '@repo/data/react';
import { CalendarClock, ImageIcon, UsersRound } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useFormatting } from '@/lib/formatting/use-formatting';
import { eventDetailPath } from '../routes';
import { EventActionBar } from './event-action-bar';

interface EventCardProps {
  event: EventListItem;
  orgUId: string;
  canEdit: boolean;
}

export function EventCard({ event, orgUId, canEdit }: EventCardProps) {
  const t = useTranslations('Event');
  const { formatDateRange } = useFormatting();

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
      <Link href={eventDetailPath(orgUId, event.id)}>
        <div className="relative h-[180px] w-full shrink-0 bg-muted">
          {event.coverUrl ? (
            <Image
              src={event.coverUrl}
              alt={t('detail.coverImageAlt', { title: event.title })}
              fill
              unoptimized
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ImageIcon
                className="size-8 text-muted-foreground/60"
                aria-hidden
              />
            </div>
          )}

          <div className="absolute top-4 left-4 flex h-8 items-center gap-2 rounded-full bg-black/60 px-3 text-xs font-semibold text-white">
            <CalendarClock className="size-3.5" />
            {t('card.pill', {
              shiftsCount: event.shiftsCount,
              formsCount: event.requiredFormsCount,
            })}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-5">
          <p className="text-sm font-semibold text-foreground">
            {formatDateRange(event.startsAt, event.endsAt)}
          </p>
          <h3
            className="text-2xl font-bold text-foreground line-clamp-2"
            title={event.title}
          >
            {event.title}
          </h3>
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <UsersRound className="size-4 shrink-0" />
            {t('card.volunteers', { count: event.signedUpCount })}
          </div>
        </div>
      </Link>

      <EventActionBar
        id={event.id}
        slug={event.slug}
        orgUId={orgUId}
        canEdit={canEdit}
      />
    </div>
  );
}

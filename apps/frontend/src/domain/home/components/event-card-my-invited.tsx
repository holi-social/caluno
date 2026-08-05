'use client';

import { Card } from '@repo/ui';
import { MailIcon, MapPinIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useFormatting } from '@/lib/formatting/use-formatting';

export function EventCardMyInvited({
  event,
}: {
  event: {
    id: string;
    title: string;
    startsAt: string;
    endsAt: string;
    location?: string | null;
  };
}) {
  const t = useTranslations('VolunteerHome');
  const { formatTimeRange, formatDate } = useFormatting();

  return (
    <Card className="relative flex flex-col gap-0 overflow-hidden rounded-xl border border-border bg-card p-0">
      <Link
        href={`/events/${event.id}`}
        aria-label={event.title}
        className="absolute inset-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-1"
      />
      <div className="flex items-center justify-center gap-2 border-b border-border bg-card px-3 py-2 text-sm text-foreground">
        <MailIcon className="size-4 shrink-0" />
        <span>
          {t('invitedOn', {
            date: formatDate(new Date(event.startsAt), {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            }),
          })}
        </span>
      </div>

      <div className="flex gap-3 p-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <p className="font-semibold text-foreground">
            {formatTimeRange(event.startsAt, event.endsAt)}
          </p>
          <h3 className="text-lg font-semibold text-foreground">
            {event.title}
          </h3>
          {event.location && (
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPinIcon className="size-3.5 shrink-0" />
              {event.location}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

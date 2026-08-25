import type { RawPublicOrgEvent } from '@repo/data';
import { LayersIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PublicListCard } from '@/components/public-list-card';
import { getEventSpotsSummary } from '@/domain/event/lib/event-spots';
import { useFormatting } from '@/lib/formatting/use-formatting';

interface OrgEventsListProps {
  events: RawPublicOrgEvent[];
}

export function OrgEventsList({ events }: OrgEventsListProps) {
  const t = useTranslations('OrgDetail');
  const { formatDateRange } = useFormatting();

  if (events.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="flex items-center justify-between border-b border-border pb-4">
        <h2 className="text-xl font-bold text-foreground">
          {t('eventsHeading')}
        </h2>
        <span className="text-sm font-medium text-muted-foreground">
          {t('eventsCount', { n: events.length })}
        </span>
      </div>
      <div className="mt-4 flex flex-col gap-2">
        {events.map((event) => {
          const spotsSummary = getEventSpotsSummary(event.shifts);
          const metaText = spotsSummary.hasUnlimited
            ? t('eventMetaUnlimited', { shifts: event.shiftsCount })
            : spotsSummary.fullyBooked
              ? t('eventMetaFull', { shifts: event.shiftsCount })
              : t('eventMeta', {
                  shifts: event.shiftsCount,
                  spots: spotsSummary.totalSpotsLeft,
                });

          return (
            <PublicListCard
              key={event.id}
              href={`/events/${event.id}`}
              eyebrow={
                formatDateRange(event.startsAt, event.endsAt) +
                (event.location ? ` · ${event.location}` : '')
              }
              title={event.title}
              metaIcon={LayersIcon}
              metaText={metaText}
            />
          );
        })}
      </div>
    </section>
  );
}

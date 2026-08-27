import { SortOrder } from '@repo/data/react';
import { Empty, EmptyMedia, EmptyTitle } from '@repo/ui';
import { CalendarXIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { EventCardMy } from '@/domain/home/components/event-card-my';
import { MyEventsPageHeader } from '@/domain/home/components/my-events-page-header';
import { PARTICIPATING_EVENT_STATUSES } from '@/domain/home/lib/my-events';
import { getDataClient } from '@/lib/data-client';

export default async function MyEventsPage() {
  const client = await getDataClient();
  const myEvents = await client.event.findMyEvents({
    statuses: [...PARTICIPATING_EVENT_STATUSES],
    order: SortOrder.Asc,
    limit: 50,
  });
  const t = await getTranslations('VolunteerHome');

  return (
    <>
      <MyEventsPageHeader />
      <div className="mx-auto w-full max-w-4xl px-6 pt-6 pb-4">
        {myEvents.items.length === 0 ? (
          <Empty>
            <EmptyMedia variant="icon">
              <CalendarXIcon />
            </EmptyMedia>
            <EmptyTitle>{t('yourEventsEmpty')}</EmptyTitle>
          </Empty>
        ) : (
          <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2">
            {myEvents.items.map((event) => (
              <EventCardMy key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

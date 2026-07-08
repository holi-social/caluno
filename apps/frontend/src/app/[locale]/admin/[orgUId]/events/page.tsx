import { PermissionKey } from '@repo/data';
import { getTranslations } from 'next-intl/server';
import { CreateEventButton } from '@/domain/event/components/create-event-button';
import { EventsTable } from '@/domain/event/components/events-table';
import { getDataClient } from '@/lib/data-client';
import { checkPermission } from '@/lib/permissions-server';

interface EventsPageProps {
  params: Promise<{ orgUId: string }>;
}

export default async function EventsPage({ params }: EventsPageProps) {
  const { orgUId } = await params;
  const [canEdit = false] = await checkPermission(
    orgUId,
    PermissionKey.ShiftEdit,
  );
  const t = await getTranslations('Event');
  const data = await getDataClient({ orgUId });
  const { items: events } = await data.event.findAll();

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">{t('list.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('list.subtitle')}</p>
        </div>
        {canEdit && <CreateEventButton orgUId={orgUId} />}
      </div>

      <EventsTable events={events} orgUId={orgUId} canEdit={canEdit} />
    </div>
  );
}

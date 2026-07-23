import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createEventShift } from '@/domain/event/actions';
import { ShiftForm } from '@/domain/shift/components/shift-form';
import { getDataClient } from '@/lib/data-client';

interface NewEventShiftPageProps {
  params: Promise<{ orgUId: string; eventId: string; locale: string }>;
}

export default async function NewEventShiftPage({
  params,
}: NewEventShiftPageProps) {
  const { orgUId, eventId, locale } = await params;
  const data = await getDataClient({ orgUId });
  const t = await getTranslations({ locale, namespace: 'Shift.sheet' });

  const event = await data.event.findById(eventId);

  if (!event) {
    notFound();
  }

  return (
    <ShiftForm
      title={t('createEventTitle')}
      description={t('createEventDescription')}
      orgUId={orgUId}
      mutate={createEventShift.bind(null, orgUId, event.id)}
      event={{
        title: event.title,
        startsAt: new Date(event.startsAt),
        endsAt: new Date(event.endsAt),
      }}
      defaultLocation={event.location ?? ''}
      redirectToInviteOnCreate
    />
  );
}

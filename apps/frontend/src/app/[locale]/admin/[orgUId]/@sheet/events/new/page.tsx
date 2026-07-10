import { getTranslations } from 'next-intl/server';
import { createEvent } from '@/domain/event/actions';
import { EventForm } from '@/domain/event/components/event-form';

interface CreateEventPageProps {
  params: Promise<{ orgUId: string; locale: string }>;
}

export default async function CreateEventPage({
  params,
}: CreateEventPageProps) {
  const { orgUId, locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Event.sheet' });

  return (
    <EventForm
      title={t('createTitle')}
      description={t('createDescription')}
      mutate={createEvent.bind(null, orgUId)}
    />
  );
}

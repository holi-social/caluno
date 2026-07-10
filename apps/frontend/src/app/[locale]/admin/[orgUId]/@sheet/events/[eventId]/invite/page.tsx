import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { inviteMembersToEvent } from '@/domain/event/actions';
import { EventInviteForm } from '@/domain/event/components/event-invite-form';
import { getDataClient } from '@/lib/data-client';

interface InviteEventPageProps {
  params: Promise<{ orgUId: string; eventId: string; locale: string }>;
}

export default async function InviteEventPage({
  params,
}: InviteEventPageProps) {
  const { orgUId, eventId, locale } = await params;
  const data = await getDataClient({ orgUId });
  const t = await getTranslations({ locale, namespace: 'Event.invite' });

  const event = await data.event.findById(eventId);

  if (!event) {
    notFound();
  }

  const [memberships, attendees] = await Promise.all([
    data.membership.findAllByOrganizationUnitId(),
    data.event.findAttendees(eventId),
  ]);

  const availableMembers = memberships.map((m) => m.user);

  return (
    <EventInviteForm
      title={t('title', { eventTitle: event.title })}
      description={t('description')}
      slug={event.slug}
      availableMembers={availableMembers}
      invitedMembers={attendees}
      mutate={inviteMembersToEvent.bind(null, orgUId, event.id)}
    />
  );
}

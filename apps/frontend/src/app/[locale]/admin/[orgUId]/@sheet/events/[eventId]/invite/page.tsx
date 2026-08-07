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

  const [memberships, invites] = await Promise.all([
    data.membership.findAllByOrganizationUnitId(),
    data.event.findInvites(eventId),
  ]);

  const availableMembers = memberships.map((m) => m.user);
  const invitedMembers = invites.map((invite) => ({
    ...invite.user,
    inviteStatus: invite.status,
  }));

  return (
    <EventInviteForm
      title={t('title')}
      description={t('description', { eventTitle: event.title })}
      slug={event.slug}
      availableMembers={availableMembers}
      invitedMembers={invitedMembers}
      mutate={inviteMembersToEvent.bind(null, orgUId, event.id)}
    />
  );
}

import { isSingleOccurrenceRrule } from '@repo/data';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getDataClient } from '@/lib/data-client';
import { updateShiftVolunteers } from '../actions';
import { InviteShiftForm } from './invite-form';

interface InviteShiftPageContentProps {
  orgUId: string;
  shiftId: string;
  instanceId: string;
  locale: string;
  eventId?: string;
  isCreationFlow?: boolean;
}

export async function InviteShiftPageContent({
  orgUId,
  shiftId,
  instanceId,
  locale,
  eventId,
  isCreationFlow = false,
}: InviteShiftPageContentProps) {
  const data = await getDataClient({ orgUId });
  const t = await getTranslations({ locale, namespace: 'Shift.sheet' });

  const [event, shift, instance, memberships] = await Promise.all([
    eventId ? data.event.findById(eventId) : Promise.resolve(null),
    data.shift.findByIdDetailed(shiftId),
    data.shift.findInstance(instanceId),
    data.membership.findAllByOrganizationUnitId(),
  ]);

  if ((eventId && !event) || !shift) {
    notFound();
  }

  if (!instance) {
    notFound();
  }

  const invitedMembers = (instance?.invites ?? []).map((invite) => ({
    id: invite.user.id,
    name: invite.user.name,
    email: invite.user.email ?? '',
    image: invite.user.image,
    inviteOrigin: invite.origin,
    inviteStatus: invite.status,
  }));

  return (
    <InviteShiftForm
      title={t('inviteTitle')}
      description={t('inviteDescription')}
      orgUId={orgUId}
      shiftId={shift.id}
      instanceId={instanceId}
      isCreationFlow={isCreationFlow}
      shift={{
        title: shift.title,
        isRecurring:
          Boolean(shift.rrule) && !isSingleOccurrenceRrule(shift.rrule),
        recurrenceDays: shift.recurrenceDays,
        visibility: shift.visibility,
      }}
      selectedInstance={{
        actualStartsAt: instance.actualStartsAt,
        actualEndsAt: instance.actualEndsAt,
      }}
      availableMembers={memberships.map((m) => m.user)}
      invitedMembers={invitedMembers}
      mutateVolunteers={updateShiftVolunteers.bind(null, orgUId, instanceId)}
    />
  );
}

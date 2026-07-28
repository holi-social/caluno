import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getDataClient } from '@/lib/data-client';
import { updateShiftStaffing, updateShiftVolunteers } from '../actions';
import { InviteShiftForm } from './invite-form';

interface InviteShiftPageContentProps {
  orgUId: string;
  shiftId: string;
  instanceId: string;
  locale: string;
  eventId?: string;
}

export async function InviteShiftPageContent({
  orgUId,
  shiftId,
  instanceId,
  locale,
  eventId,
}: InviteShiftPageContentProps) {
  const data = await getDataClient({ orgUId });
  const t = await getTranslations({ locale, namespace: 'Shift.sheet' });

  const [event, shift, instanceDetail, memberships] = await Promise.all([
    eventId ? data.event.findById(eventId) : Promise.resolve(null),
    data.shift.findByIdDetailed(shiftId),
    data.shift.findInstanceDetail(shiftId, instanceId),
    data.membership.findAllByOrganizationUnitId(),
  ]);

  if ((eventId && !event) || !shift) {
    notFound();
  }

  if (!instanceDetail) {
    notFound();
  }

  const invitedMembers = (instanceDetail?.invites ?? []).map((invite) => ({
    id: invite.user.id,
    name: invite.user.name,
    email: invite.user.email ?? '',
    image: invite.user.image,
    inviteStatus: invite.status,
  }));

  return (
    <InviteShiftForm
      title={t('inviteTitle')}
      description={t('inviteDescription')}
      shiftId={shift.id}
      instanceId={instanceId}
      shift={{
        title: shift.title,
        minVolunteers: shift.minVolunteers,
        maxVolunteers: shift.maxVolunteers,
        isRecurring: !!shift.rrule && shift.recurrenceDays.length > 0,
        recurrenceDays: shift.recurrenceDays,
      }}
      selectedInstance={{
        actualStartsAt: instanceDetail.actualStartsAt,
        actualEndsAt: instanceDetail.actualEndsAt,
      }}
      availableMembers={memberships.map((m) => m.user)}
      invitedMembers={invitedMembers}
      mutateStaffing={updateShiftStaffing.bind(null, orgUId, shift.id)}
      mutateVolunteers={updateShiftVolunteers.bind(null, orgUId, instanceId)}
    />
  );
}

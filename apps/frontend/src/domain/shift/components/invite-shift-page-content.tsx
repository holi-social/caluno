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
  /**
   * VOLI-1248: when this shift is paid, pass the allowance type it's paid
   * under so each available volunteer gets an eligibility state. There is no
   * "is this shift paid, and under which allowance type" signal on the shift
   * yet — that's introduced by VOLI-1247/1249/1251, which are being built
   * concurrently. Once one of those wires a real value in here, the
   * eligibility states start rendering with zero further changes downstream
   * (see `InviteShiftForm`, which already fetches and renders them whenever
   * this is set). Until then this stays undefined and the invite list
   * renders exactly as it does today (acceptance criterion 6).
   */
  paidReimbursementTypeId?: string;
}

export async function InviteShiftPageContent({
  orgUId,
  shiftId,
  instanceId,
  locale,
  eventId,
  isCreationFlow = false,
  paidReimbursementTypeId,
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
      paidAllowance={
        paidReimbursementTypeId
          ? {
              organizationUnitId: orgUId,
              reimbursementTypeId: paidReimbursementTypeId,
              shiftDurationMinutes: shift.durationMinutes,
            }
          : undefined
      }
    />
  );
}

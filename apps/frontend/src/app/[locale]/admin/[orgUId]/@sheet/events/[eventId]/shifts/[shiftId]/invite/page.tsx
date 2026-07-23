import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import {
  updateShiftStaffing,
  updateShiftVolunteers,
} from '@/domain/shift/actions';
import { InviteShiftForm } from '@/domain/shift/components/invite-form';
import { getDataClient } from '@/lib/data-client';

interface InviteEventShiftPageProps {
  params: Promise<{
    orgUId: string;
    eventId: string;
    shiftId: string;
    locale: string;
  }>;
  searchParams: Promise<{ instanceId?: string }>;
}

export default async function InviteEventShiftPage({
  params,
  searchParams,
}: InviteEventShiftPageProps) {
  const { orgUId, eventId, shiftId, locale } = await params;
  const { instanceId } = await searchParams;
  if (!instanceId) {
    notFound();
  }

  const data = await getDataClient({ orgUId });
  const t = await getTranslations({ locale, namespace: 'Shift.sheet' });

  const [event, shift, shiftInstances, shiftVolunteers, memberships] =
    await Promise.all([
      data.event.findById(eventId),
      data.shift.findByIdDetailed(shiftId),
      data.shift.findInstances(shiftId),
      data.shift.findVolunteersByInstanceId(instanceId),
      data.membership.findAllByOrganizationUnitId(),
    ]);

  if (!event || !shift) {
    notFound();
  }

  const selectedInstance = shiftInstances.find((i) => i.id === instanceId);
  if (!selectedInstance) {
    notFound();
  }

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
        actualStartsAt: selectedInstance.actualStartsAt,
        actualEndsAt: selectedInstance.actualEndsAt,
      }}
      availableMembers={memberships.map((m) => m.user)}
      invitedMemberIds={shiftVolunteers.map((v) => v.id)}
      mutateStaffing={updateShiftStaffing.bind(null, orgUId, shift.id)}
      mutateVolunteers={updateShiftVolunteers.bind(null, orgUId, instanceId)}
    />
  );
}

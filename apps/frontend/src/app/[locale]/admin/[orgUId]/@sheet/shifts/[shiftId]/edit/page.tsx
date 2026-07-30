import { ShiftVisibility } from '@repo/data';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { updateShift } from '@/domain/shift/actions';
import { ShiftForm } from '@/domain/shift/components/shift-form';
import { getDataClient } from '@/lib/data-client';

interface UpdateShiftPageProps {
  params: Promise<{ orgUId: string; shiftId: string; locale: string }>;
}

export default async function UpdateShiftPage({
  params,
}: UpdateShiftPageProps) {
  const { orgUId, shiftId, locale } = await params;
  const data = await getDataClient({ orgUId });
  const t = await getTranslations({ locale, namespace: 'Shift.sheet' });
  const shift = await data.shift.findByIdDetailed(shiftId);

  if (!shift) {
    notFound();
  }

  return (
    <ShiftForm
      title={t('editTitle')}
      description={t('editDescription')}
      orgUId={orgUId}
      mutate={updateShift.bind(null, orgUId, shift.id)}
      initialValues={{
        name: shift.title,
        instructions: shift.instructions ?? undefined,
        location: shift.location ?? undefined,
        startsAt: shift.startDate,
        endsAt: shift.endDate,
        openShift: shift.visibility === ShiftVisibility.AllMembers,
        recurrenceDays: shift.recurrenceDays,
        recurrenceEndsAt: shift.recurrenceEndsAt,
        imageFileId: shift.imageUrl ?? undefined,
        minVolunteers: shift.minVolunteers ?? undefined,
        maxVolunteers: shift.maxVolunteers ?? undefined,
      }}
    />
  );
}

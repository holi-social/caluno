import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { updateTimeEntry } from '@/domain/time-entry/actions';
import { TimeEntryForm } from '@/domain/time-entry/components/time-entry-form';
import { getDataClient } from '@/lib/data-client';

interface TimeEntryUpdatePageProps {
  params: Promise<{ orgUId: string; timeEntryId: string; locale: string }>;
}

export default async function TimeEntryUpdatePage({
  params,
}: TimeEntryUpdatePageProps) {
  const { orgUId, timeEntryId, locale } = await params;
  const data = await getDataClient({ orgUId });
  const t = await getTranslations({ locale, namespace: 'TimeEntry.sheet' });

  const [entry, allVolunteers] = await Promise.all([
    data.timeEntry.findById(timeEntryId),
    data.organization.findVolunteersByUnit(orgUId),
  ]);

  if (!entry) {
    notFound();
  }

  return (
    <TimeEntryForm
      title={t('editTitle')}
      description={t('editDescription')}
      organizationUnitId={orgUId}
      volunteers={allVolunteers}
      mutate={updateTimeEntry.bind(null, entry.id)}
      initialValues={{
        hasShift: !!entry.shiftInstance,
        shiftInstanceId: entry.shiftInstance?.id ?? '',
        shiftId: entry.shiftInstance?.master.id ?? '',
        volunteerId: entry.volunteer.id,
        startedAt: new Date(entry.startedAt),
        endedAt: entry.endedAt ? new Date(entry.endedAt) : undefined,
        notes: entry.notes ?? undefined,
        reimbursementTypeId: entry.reimbursementType?.id ?? undefined,
      }}
    />
  );
}

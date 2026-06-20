import { getTranslations } from 'next-intl/server';
import { createTimeEntry } from '@/domain/time-entry/actions';
import { TimeEntryForm } from '@/domain/time-entry/components/time-entry-form';
import { getDataClient } from '@/lib/data-client';

interface CreateTimeEntryPageProps {
  params: Promise<{ orgUId: string; locale: string }>;
}

export default async function CreateTimeEntryPage({
  params,
}: CreateTimeEntryPageProps) {
  const { orgUId, locale } = await params;
  const data = await getDataClient(orgUId);
  const t = await getTranslations({ locale, namespace: 'TimeEntry.sheet' });

  const [shifts, allVolunteers] = await Promise.all([
    data.shift.findAll({ limit: 100, offset: 0 }),
    data.organization.findVolunteersByUnit(orgUId),
  ]);

  return (
    <TimeEntryForm
      title={t('createTitle')}
      description={t('createDescription')}
      organizationUnitId={orgUId}
      shifts={shifts.items}
      volunteers={allVolunteers}
      mutate={createTimeEntry}
    />
  );
}

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
  const data = await getDataClient({ orgUId });
  const t = await getTranslations({ locale, namespace: 'TimeEntry.sheet' });

  const [allVolunteers] = await Promise.all([
    data.organization.findVolunteersByUnit(orgUId),
  ]);

  return (
    <TimeEntryForm
      title={t('createTitle')}
      description={t('createDescription')}
      organizationUnitId={orgUId}
      volunteers={allVolunteers}
      mutate={createTimeEntry}
    />
  );
}

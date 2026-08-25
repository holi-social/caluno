import { getTranslations } from 'next-intl/server';
import { createShift } from '@/domain/shift/actions';
import { ShiftForm } from '@/domain/shift/components/shift-form';
import { getDataClient } from '@/lib/data-client';

interface CreateShiftPageProps {
  params: Promise<{ orgUId: string; locale: string }>;
}

export default async function CreateShiftPage({
  params,
}: CreateShiftPageProps) {
  const { orgUId, locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Shift.sheet' });
  const data = await getDataClient({ orgUId });
  const unit = await data.organizationUnit.findById(orgUId);

  return (
    <ShiftForm
      title={t('createTitle')}
      description={t('createDescription')}
      orgUId={orgUId}
      mutate={createShift.bind(null, orgUId)}
      defaultLocation={unit?.address ?? ''}
      redirectToInviteOnCreate
    />
  );
}

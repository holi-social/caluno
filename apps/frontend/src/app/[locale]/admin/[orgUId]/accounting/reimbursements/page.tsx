import { getTranslations } from 'next-intl/server';
import { ReimbursementsPageHeader } from '@/domain/accounting/components/reimbursements-page-header';

interface ReimbursementsPageProps {
  params: Promise<{ orgUId: string; locale: string }>;
}

export default async function ReimbursementsPage({
  params,
}: ReimbursementsPageProps) {
  const { locale, orgUId } = await params;
  const t = await getTranslations({
    locale,
    namespace: 'Accounting.reimbursements',
  });

  return (
    <ReimbursementsPageHeader
      orgUId={orgUId}
      title={t('title')}
      subtitle={t('subtitle')}
    />
  );
}

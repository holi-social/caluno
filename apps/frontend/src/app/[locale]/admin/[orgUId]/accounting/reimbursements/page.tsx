import { getTranslations } from 'next-intl/server';
import { ReimbursementsBoard } from '@/domain/accounting/components/reimbursements-board';

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
    <div className="space-y-6">
      <div>
        <h1 className="page-title">{t('title')}</h1>
        <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
      </div>

      <ReimbursementsBoard orgUId={orgUId} />
    </div>
  );
}

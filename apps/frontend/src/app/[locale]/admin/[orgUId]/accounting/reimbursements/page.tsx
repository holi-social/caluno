import { getTranslations } from 'next-intl/server';

interface ReimbursementsPageProps {
  params: Promise<{ orgUId: string; locale: string }>;
}

export default async function ReimbursementsPage({
  params,
}: ReimbursementsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Accounting' });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">{t('reimbursements.title')}</h1>
      </div>
    </div>
  );
}

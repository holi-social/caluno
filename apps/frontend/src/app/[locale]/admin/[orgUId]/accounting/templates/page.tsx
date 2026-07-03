import { getTranslations } from 'next-intl/server';

interface TemplatesPageProps {
  params: Promise<{ orgUId: string; locale: string }>;
}

export default async function TemplatesPage({ params }: TemplatesPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Accounting' });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">{t('templates.title')}</h1>
      </div>
    </div>
  );
}

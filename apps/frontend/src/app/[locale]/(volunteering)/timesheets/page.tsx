import { getTranslations } from 'next-intl/server';

export default async function MyTimePage() {
  const t = await getTranslations('Navigation');

  return (
    <div>
      <h1 className="page-title">{t('myTime')}</h1>
    </div>
  );
}

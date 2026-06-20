import { getTranslations } from 'next-intl/server';

export default async function OrgUnitHomePage() {
  const t = await getTranslations('Navigation');

  return (
    <div>
      <h1 className="page-title">{t('home')}</h1>
    </div>
  );
}

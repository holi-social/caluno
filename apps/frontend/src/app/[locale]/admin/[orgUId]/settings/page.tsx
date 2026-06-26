import { getTranslations } from 'next-intl/server';

export default async function SettingsPage() {
  const t = await getTranslations('Settings');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">{t('title')}</h1>{' '}
      </div>
    </div>
  );
}

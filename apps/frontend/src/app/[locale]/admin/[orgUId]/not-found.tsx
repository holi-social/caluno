import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export default async function OrgNotFound() {
  const t = await getTranslations('Error');

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">{t('orgNotFound.title')}</h1>
        <p>{t('orgNotFound.description')}</p>
        <Link href="/" className="text-primary hover:underline">
          {t('orgNotFound.homeLink')}
        </Link>
      </div>
    </div>
  );
}

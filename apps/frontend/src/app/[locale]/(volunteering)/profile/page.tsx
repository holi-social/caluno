import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LocaleSwitcher } from '@/components/locale-switcher';

interface ProfilePageProps {
  params: Promise<{ locale: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Profile');

  return (
    <div className="space-y-6">
      <h1 className="page-title">{t('title')}</h1>
      <LocaleSwitcher />
    </div>
  );
}

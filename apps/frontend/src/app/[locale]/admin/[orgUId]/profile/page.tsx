import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ProfileForm } from '@/domain/user/components/profile-form';
import { resolveLocale } from '@/i18n/routing';

interface ProfilePageProps {
  params: Promise<{ locale: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);

  const t = await getTranslations('Profile');

  return (
    <div className="space-y-6">
      <h1 className="page-title">{t('title')}</h1>
      <ProfileForm />
    </div>
  );
}

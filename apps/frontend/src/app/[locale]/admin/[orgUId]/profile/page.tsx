import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ProfileForm } from '@/domain/user/components/profile-form';
import { resolveLocale } from '@/i18n/routing';
import { getDataClient } from '@/lib/data-client';

interface ProfilePageProps {
  params: Promise<{ locale: string; orgUId: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { locale: rawLocale, orgUId } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);

  const t = await getTranslations('Profile');
  const me = await getDataClient({ orgUId }).then((data) => data.user.getMe());

  return (
    <div className="space-y-6">
      <h1 className="page-title">{t('title')}</h1>
      <ProfileForm imageUrl={me.image} />
    </div>
  );
}

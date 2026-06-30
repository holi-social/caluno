import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { redirect } from '@/i18n/navigation';
import { resolveLocale } from '@/i18n/routing';
import { getDataClient } from '@/lib/data-client';

interface ProfilePageProps {
  params: Promise<{ locale: string; orgUId: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { locale: rawLocale, orgUId } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);

  const data = await getDataClient({ orgUId, locale });
  const me = await data.user.getMe();

  if (me.locale && me.locale !== locale) {
    redirect({ href: `/admin/${orgUId}/profile`, locale: me.locale });
  }

  const t = await getTranslations('Profile');

  return (
    <div className="space-y-6">
      <h1 className="page-title">{t('title')}</h1>
      <LocaleSwitcher />
    </div>
  );
}

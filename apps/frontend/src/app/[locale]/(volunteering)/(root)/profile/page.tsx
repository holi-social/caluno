import { setRequestLocale } from 'next-intl/server';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { redirect } from '@/i18n/navigation';
import { resolveLocale } from '@/i18n/routing';
import { getDataClient } from '@/lib/data-client';

interface ProfilePageProps {
  params: Promise<{ locale: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);

  const data = await getDataClient({ locale });
  const me = await data.user.getMe();

  if (me.locale && me.locale !== locale) {
    redirect({ href: '/profile', locale: me.locale });
  }

  return (
    <div className="space-y-6">
      <LocaleSwitcher />
    </div>
  );
}

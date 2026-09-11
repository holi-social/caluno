import { redirect } from '@/i18n/navigation';
import { resolveLocale } from '@/i18n/routing';

type UnsubscribePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function UnsubscribePage({
  params,
}: UnsubscribePageProps) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);

  redirect({ href: '/profile/account-settings', locale });
}

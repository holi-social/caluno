import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AccountSettingsForm } from '@/domain/user/components/account-settings-form';
import { ProfilePageHeader } from '@/domain/user/components/profile-page-header';
import { resolveLocale } from '@/i18n/routing';
import { getDataClient } from '@/lib/data-client';

type AccountSettingsPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AccountSettingsPage({
  params,
}: AccountSettingsPageProps) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);

  const tProfile = await getTranslations('Profile');
  const data = await getDataClient();
  const me = await data.user.getMe();

  return (
    <div>
      <div className="sticky top-0 z-30">
        <ProfilePageHeader
          title={tProfile('accountSettings')}
          backHref="/profile"
        />
      </div>

      <div className="mx-auto w-full max-w-4xl space-y-8 px-4 py-6">
        <AccountSettingsForm
          emailWeeklyUpdateEnabled={me.emailWeeklyUpdateEnabled}
          emailUrgentCallsEnabled={me.emailUrgentCallsEnabled}
          emailPlatformEnabled={me.emailPlatformEnabled}
        />
      </div>
    </div>
  );
}

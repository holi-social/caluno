import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ProfileForm } from '@/domain/user/components/profile-form';
import { ProfilePageHeader } from '@/domain/user/components/profile-page-header';
import { resolveLocale } from '@/i18n/routing';

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

  return (
    <div>
      <div className="sticky top-0 z-30">
        <ProfilePageHeader title={tProfile('accountSettings')} />
      </div>

      <div className="mx-auto w-full max-w-4xl space-y-8 px-4 py-6">
        <ProfileForm />
      </div>
    </div>
  );
}

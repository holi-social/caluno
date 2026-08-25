import { getTranslations, setRequestLocale } from 'next-intl/server';
import EditIdentityForm from '@/domain/user/components/edit-identity-form';
import { ProfilePageHeader } from '@/domain/user/components/profile-page-header';
import { resolveLocale } from '@/i18n/routing';
import { getDataClient } from '@/lib/data-client';

type ProfileEditPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ProfileEditPage({
  params,
}: ProfileEditPageProps) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);

  const tProfile = await getTranslations('Profile');

  const data = await getDataClient();
  const [me, profile] = await Promise.all([
    data.user.getMe(),
    data.requirementForm.getMyUserProfile(),
  ]);

  return (
    <div>
      <div className="sticky top-0 z-30">
        <ProfilePageHeader title={tProfile('title')} backHref="/profile" />
      </div>
      <div className="mx-auto w-full max-w-4xl px-4 py-6">
        <EditIdentityForm email={me.email} profile={profile ?? null} />
      </div>
    </div>
  );
}

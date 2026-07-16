import { getTranslations, setRequestLocale } from 'next-intl/server';
import MyMembershipRequests from '@/domain/membership-requests/components/my-membership-requests';
import { ProfileForm } from '@/domain/user/components/profile-form';
import { resolveLocale } from '@/i18n/routing';
import { getDataClient } from '@/lib/data-client';

interface ProfilePageProps {
  params: Promise<{ locale: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);
  const t = await getTranslations('MembershipRequest');
  const tProfile = await getTranslations('Profile');

  const data = await getDataClient();
  const me = await data.user.getMe();
  const { items: membershipRequests } = await data.membershipRequest.findMine();

  return (
    <div className="space-y-6">
      <div>
        <h2 id="memberships" className="text-xl font-bold">
          {t('page.title')}
        </h2>
        <p className="text-muted-foreground mt-1">{t('page.subtitle')}</p>
      </div>

      <MyMembershipRequests membershipRequests={membershipRequests} />

      <div>
        <h2 className="text-xl font-bold">{tProfile('title')}</h2>
        <div className="mt-4">
          <ProfileForm imageUrl={me.image} />
        </div>
      </div>
    </div>
  );
}

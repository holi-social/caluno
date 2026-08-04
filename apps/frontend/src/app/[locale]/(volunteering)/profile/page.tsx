import { getTranslations, setRequestLocale } from 'next-intl/server';
import MyMembershipRequests from '@/domain/membership-requests/components/my-membership-requests';
import { HeaderAvatar } from '@/domain/user/components/header-avatar';
import { ProfileForm } from '@/domain/user/components/profile-form';
import { ProfilePageHeader } from '@/domain/user/components/profile-page-header';
import { resolveLocale } from '@/i18n/routing';
import { getDataClient } from '@/lib/data-client';

type ProfilePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);

  const tProfile = await getTranslations('Profile');
  const tMemberships = await getTranslations('MembershipRequest');

  const data = await getDataClient();
  const me = await data.user.getMe();
  const { items: membershipRequests } = await data.membershipRequest.findMine();

  return (
    <div>
      <div className="sticky top-0 z-30">
        <ProfilePageHeader />
      </div>

      <div className="mx-auto w-full max-w-4xl space-y-8 px-4 py-6">
        <HeaderAvatar name={me.name} imageUrl={me.image} />

        {/* Section slots — empty; headings inlined (later tickets add bodies) */}
        <section>
          <h2 className="text-xl font-bold">{tProfile('organizations')}</h2>
        </section>
        <section>
          <h2 className="text-xl font-bold">
            {tProfile('personalInformation')}
          </h2>
        </section>
        <section>
          <h2 className="text-xl font-bold">{tProfile('accountSettings')}</h2>
        </section>

        {/* Transitional — kept working until the section tickets land */}
        <div>
          <h2 id="memberships" className="text-xl font-bold">
            {tMemberships('page.title')}
          </h2>
          <p className="text-muted-foreground mt-1">
            {tMemberships('page.subtitle')}
          </p>
          <MyMembershipRequests membershipRequests={membershipRequests} />
        </div>

        <div>
          <h2 className="text-xl font-bold">{tProfile('title')}</h2>
          <div className="mt-4">
            <ProfileForm />
          </div>
        </div>
      </div>
    </div>
  );
}

import { getTranslations, setRequestLocale } from 'next-intl/server';
import { MembershipCard } from '@/domain/memberships/components/membership-card';
import { buildMembershipEntries } from '@/domain/memberships/lib/entries';
import { HeaderAvatar } from '@/domain/user/components/header-avatar';
import { PersonalInformationSection } from '@/domain/user/components/personal-information-section';
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

  const data = await getDataClient();
  const [me, membershipRequests, profile] = await Promise.all([
    data.user.getMe(),
    data.membershipRequest.findMine(),
    data.requirementForm.getMyUserProfile(),
  ]);
  const membershipEntries = buildMembershipEntries(membershipRequests.items);

  return (
    <div>
      <div className="sticky top-0 z-30">
        <ProfilePageHeader />
      </div>

      <div className="mx-auto w-full max-w-4xl space-y-8 px-4 py-6">
        <HeaderAvatar name={me.name} imageUrl={me.image} />

        {/* Section slots — empty; headings inlined (later tickets add bodies) */}
        <section>
          <h1 className="text-xl font-bold mb-4">
            {tProfile('organizations')}
          </h1>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {membershipEntries.map((entry) => (
              <MembershipCard
                key={`${entry.state}-${entry.id}`}
                entry={entry}
              />
            ))}
          </div>
        </section>
        <section>
          <h1 className="text-xl font-bold mb-4">
            {tProfile('personalInformation')}
          </h1>
          <PersonalInformationSection user={me} profile={profile ?? null} />
        </section>
        <section>
          <h1 className="text-xl font-bold">{tProfile('accountSettings')}</h1>
        </section>

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

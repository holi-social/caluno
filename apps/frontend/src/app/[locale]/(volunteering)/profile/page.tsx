import { getTranslations, setRequestLocale } from 'next-intl/server';
import { MembershipCard } from '@/domain/memberships/components/membership-card';
import { buildMembershipEntries } from '@/domain/memberships/lib/entries';
import { AccountSection } from '@/domain/user/components/account-section';
import { HeaderAvatar } from '@/domain/user/components/header-avatar';
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
  const me = await data.user.getMe();
  const { items: membershipRequests } = await data.membershipRequest.findMine();
  const membershipEntries = buildMembershipEntries(membershipRequests);

  return (
    <div>
      <div className="sticky top-0 z-30">
        <ProfilePageHeader />
      </div>

      <div className="mx-auto w-full max-w-4xl space-y-8 px-4 py-6">
        <HeaderAvatar name={me.name} imageUrl={me.image} />

        {/* Section slots — empty; headings inlined (later tickets add bodies) */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold">{tProfile('organizations')}</h2>
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
          <h2 className="text-xl font-bold">
            {tProfile('personalInformation')}
          </h2>
        </section>
        <AccountSection locale={me.locale ?? locale} />
      </div>
    </div>
  );
}

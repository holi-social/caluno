import { Button } from '@repo/ui';
import { Pencil } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { MembershipCard } from '@/domain/memberships/components/membership-card';
import { buildMembershipEntries } from '@/domain/memberships/lib/entries';
import { AccountSection } from '@/domain/user/components/account-section';
import { HeaderAvatar } from '@/domain/user/components/header-avatar';
import { PersonalInformationSection } from '@/domain/user/components/personal-information-section';
import { ProfilePageHeader } from '@/domain/user/components/profile-page-header';
import { Link } from '@/i18n/navigation';
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
  const tCommon = await getTranslations('Common');

  const data = await getDataClient();
  const [me, requestPage, memberships, profile] = await Promise.all([
    data.user.getMe(),
    data.membershipRequest.findMine(),
    data.membership.findMine(),
    data.requirementForm.getMyUserProfile(),
  ]);
  const membershipEntries = buildMembershipEntries(
    requestPage.items,
    memberships,
  );

  return (
    <div>
      <div className="sticky top-0 z-30">
        <ProfilePageHeader />
      </div>

      <div className="mx-auto w-full max-w-4xl space-y-8 px-4 py-6">
        <HeaderAvatar name={me.name} imageUrl={me.image} />

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
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-xl font-bold">
              {tProfile('personalInformation')}
            </h1>
            <Button asChild variant="outline" size="sm">
              <Link href="/profile/edit">
                <Pencil className="size-4" />
                {tCommon('edit')}
              </Link>
            </Button>
          </div>
          <PersonalInformationSection user={me} profile={profile ?? null} />
        </section>

        <hr className="border-t border-border my-6" />

        <AccountSection locale={me.locale ?? locale} />
      </div>
    </div>
  );
}

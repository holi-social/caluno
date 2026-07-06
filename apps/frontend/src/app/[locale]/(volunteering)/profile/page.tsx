import { MembershipRequestStatus } from '@repo/data';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { resolveLocale } from '@/i18n/routing';
import { getDataClient } from '@/lib/data-client';
import MyMembershipRequests from '../../../../domain/membership-requests/components/my-membership-requests';

const VALID_STATUSES = [
  MembershipRequestStatus.Pending,
  MembershipRequestStatus.Accepted,
  MembershipRequestStatus.Rejected,
] as const;

interface ProfilePageProps {
  params: Promise<{ locale: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);

  const data = await getDataClient();
  const { items: membershipRequests } = await data.membershipRequest.findMine();
  const t = await getTranslations('MembershipRequest');

  return (
    <div className="space-y-6">
      <div>
        <h2 id="memberships" className="text-xl font-bold">
          {t('page.title')}
        </h2>
        <p className="text-muted-foreground mt-1">{t('page.subtitle')}</p>
      </div>

      <MyMembershipRequests membershipRequests={membershipRequests} />

      <LocaleSwitcher />
    </div>
  );
}

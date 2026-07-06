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
type ValidStatus = (typeof VALID_STATUSES)[number];

interface ProfilePageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: ValidStatus }>;
}

export default async function ProfilePage({
  params,
  searchParams,
}: ProfilePageProps) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);

  const t = await getTranslations('Profile');

  const { status: statusParam } = await searchParams;
  const status =
    statusParam && VALID_STATUSES.includes(statusParam)
      ? statusParam
      : MembershipRequestStatus.Pending;

  const data = await getDataClient();
  const { items: membershipRequests } = await data.membershipRequest.findMine({
    status,
  });
  const tMembershipRequests = await getTranslations('MembershipRequest');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">
          {tMembershipRequests('page.title')}
        </h2>
        <p className="text-muted-foreground mt-1">
          {tMembershipRequests('page.subtitle')}
        </p>
      </div>

      <MyMembershipRequests
        activeStatus={status}
        membershipRequests={membershipRequests}
      />

      <LocaleSwitcher />
    </div>
  );
}

import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useFormatting } from '@/lib/formatting/use-formatting';
import type { MembershipEntry } from '../types';
import { LeaveMembershipButton } from './leave-membership-button';
import { MembershipStatusBadge } from './membership-status-badge';
import { OrgUnitAvatar } from './org-unit-avatar';
import { WithdrawMembershipButton } from './withdraw-membership-button';

type Props = { entry: MembershipEntry };

export function MembershipCard({ entry }: Props) {
  const t = useTranslations('MembershipRequest');
  const { formatDate } = useFormatting();
  const { organizationName, orgUnit, date } = entry;

  return (
    <Card>
      <CardHeader className="flex flex-row gap-3">
        <CardTitle className="flex min-w-0 flex-1 items-center gap-2">
          <OrgUnitAvatar
            name={orgUnit.name}
            logoUrl={orgUnit.logoUrl}
            typeIcon={orgUnit.typeIcon}
          />
          <span className="min-w-0 truncate">{organizationName}</span>
          {!orgUnit.isRoot && (
            <>
              <span className="text-muted-foreground shrink-0">·</span>
              <span className="min-w-0 truncate">{orgUnit.name}</span>
            </>
          )}
        </CardTitle>
        <CardAction>
          <MembershipStatusBadge state={entry.state} />
        </CardAction>
      </CardHeader>

      <CardContent>
        {entry.state === 'accepted' && entry.roles.length > 0 && (
          <p className="text-muted-foreground text-sm">
            {entry.roles.join(', ')}
          </p>
        )}

        <p className="text-muted-foreground text-sm mb-4">
          {t(
            entry.state === 'accepted'
              ? 'meta.joinedDate'
              : entry.state === 'requested'
                ? 'meta.requestedDate'
                : 'meta.declinedDate',
            {
              date: formatDate(date, {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              }),
            },
          )}
        </p>

        {entry.state === 'declined' && entry.rejectionReason && (
          <q className="text-muted-foreground text-sm">
            {entry.rejectionReason}
          </q>
        )}

        {entry.state === 'accepted' && (
          <div className="flex justify-between items-center">
            <div className="">
              <LeaveMembershipButton
                membershipId={entry.id}
                orgName={organizationName}
              />
            </div>
            <div className="flex justify-end">
              <Link
                href={`/profile/memberships/${entry.id}`}
                className="flex items-center gap-1"
              >
                Open <ChevronRight className="size-4" />
              </Link>
            </div>
          </div>
        )}

        {entry.state === 'requested' && (
          <div className="flex justify-start">
            <WithdrawMembershipButton
              id={entry.id}
              organizationUnitId={orgUnit.id}
              orgName={orgUnit.name}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

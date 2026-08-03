import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { useFormatting } from '@/lib/formatting/use-formatting';
import type { MembershipEntry } from '../types';
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

      <CardContent className="flex flex-col gap-2">
        <span className="text-muted-foreground text-sm">
          {t(
            entry.state === 'requested'
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
        </span>

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

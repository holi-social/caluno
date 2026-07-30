import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { formatMembershipDate, orgInitials } from '../lib/entries';
import type { MembershipEntry } from '../types';
import { MembershipStatusBadge } from './membership-status-badge';
import { WithdrawMembershipButton } from './withdraw-membership-button';

type Props = { entry: MembershipEntry; locale: string };

export function MembershipCard({ entry, locale }: Props) {
  const t = useTranslations('MembershipRequest');
  const { org, date } = entry;

  return (
    <Card>
      <CardHeader className="flex flex-row gap-3">
        <div className="flex size-8 items-center justify-center rounded-md bg-muted text-xs font-semibold">
          {orgInitials(org.name)}
        </div>
        <CardTitle className="flex-1">{org.name}</CardTitle>
        <CardAction>
          <MembershipStatusBadge state={entry.state} />
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <span className="text-muted-foreground text-sm">
          {t(entry.state === 'requested' ? 'meta.requestedDate' : 'meta.declinedDate', {
            date: formatMembershipDate(date, locale),
          })}
        </span>

        {entry.state === 'requested' && (
          <div className="flex justify-end">
            <WithdrawMembershipButton
              id={entry.id}
              organizationUnitId={org.id}
              orgName={org.name}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

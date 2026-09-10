'use client';

import { ShiftInviteStatus } from '@repo/data';
import { Clock4Icon, ClockIcon, HourglassIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

export interface ShiftRosterStatusLineProps {
  /** Org-unit membership request still pending for this shift. */
  isIntendingToJoin?: boolean;
  myInviteStatus?: ShiftInviteStatus | null;
}

export function ShiftRosterStatusLine({
  isIntendingToJoin = false,
  myInviteStatus,
}: ShiftRosterStatusLineProps) {
  const t = useTranslations('VolunteerHome');

  if (isIntendingToJoin) {
    return (
      <p className="flex items-center gap-1 text-sm text-muted-foreground">
        <Clock4Icon className="size-3.5 shrink-0" />
        {t('pendingBadge')}
      </p>
    );
  }

  if (myInviteStatus === ShiftInviteStatus.AwaitingAdminApproval) {
    return (
      <p className="flex items-center gap-1 text-sm text-muted-foreground">
        <ClockIcon className="size-3.5 shrink-0" />
        {t('pendingApprovalBadge')}
      </p>
    );
  }

  if (myInviteStatus === ShiftInviteStatus.WaitlistJoined) {
    return (
      <p className="flex items-center gap-1 text-sm text-muted-foreground">
        <HourglassIcon className="size-3.5 shrink-0" />
        {t('waitlistBadge')}
      </p>
    );
  }

  return null;
}

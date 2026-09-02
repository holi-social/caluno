'use client';

import { Building2, Clock, UserX } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { CheckInReadinessState } from '../../check-in-readiness';
import { BlockerCard } from './blocker-card';
import { ReadyBanner } from './ready-banner';

type CheckInReadinessCardProps = {
  state: CheckInReadinessState;
  onInviteToOrg: () => void;
  onOpenAcceptMembership: () => void;
  onInviteToShift: () => void;
  isInviteToOrgPending: boolean;
  isInviteToOrgSent: boolean;
  isInviteToShiftPending: boolean;
  isInviteToShiftSent: boolean;
};

export function CheckInReadinessCard({
  state,
  onInviteToOrg,
  onOpenAcceptMembership,
  onInviteToShift,
  isInviteToOrgPending,
  isInviteToOrgSent,
  isInviteToShiftPending,
  isInviteToShiftSent,
}: CheckInReadinessCardProps) {
  const t = useTranslations('CheckIn');

  if (state === 'ready') {
    return <ReadyBanner />;
  }

  if (state === 'notMember') {
    return (
      <BlockerCard
        icon={<Building2 className="size-5" />}
        title={t('notMemberTitle')}
        description={t('notMemberDescription')}
        buttonLabel={t('notMemberButton')}
        onAction={onInviteToOrg}
        isActionPending={isInviteToOrgPending}
        isActionDone={isInviteToOrgSent}
        doneLabel={t('inviteSentConfirmation')}
      />
    );
  }

  if (state === 'pendingMembership') {
    return (
      <BlockerCard
        icon={<Clock className="size-5" />}
        title={t('pendingMembershipTitle')}
        description={t('pendingMembershipDescription')}
        buttonLabel={t('acceptMembershipButton')}
        onAction={onOpenAcceptMembership}
      />
    );
  }

  return (
    <BlockerCard
      icon={<UserX className="size-5" />}
      title={t('notInShiftTitle')}
      description={t('notInShiftDescription')}
      buttonLabel={t('notInShiftButton')}
      onAction={onInviteToShift}
      isActionPending={isInviteToShiftPending}
      isActionDone={isInviteToShiftSent}
      doneLabel={t('inviteSentConfirmation')}
    />
  );
}

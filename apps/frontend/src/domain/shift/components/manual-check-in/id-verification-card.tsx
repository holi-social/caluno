'use client';

import { useSetMembershipIdVerified } from '@repo/data/react';
import { IdCard } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { BlockerCard } from './blocker-card';

interface IdVerificationCardProps {
  organizationUnitId: string;
  membershipId: string;
}

/**
 * Optional ID check at a volunteer's first check-in. "Confirm ID" only
 * flips the membership's verified state — it never checks the volunteer in,
 * and check-in works whether or not the ID was confirmed. After success the
 * readiness invalidation hides the card for good.
 */
export function IdVerificationCard({
  organizationUnitId,
  membershipId,
}: IdVerificationCardProps) {
  const t = useTranslations('CheckIn');
  const mutation = useSetMembershipIdVerified(organizationUnitId);

  const handleConfirm = async () => {
    try {
      await mutation.mutateAsync({ membershipId, verified: true });
    } catch {
      toast.error(t('idVerificationError'));
    }
  };

  return (
    <BlockerCard
      icon={<IdCard className="size-5" />}
      title={t('idVerificationTitle')}
      description={t('idVerificationDescription')}
      buttonLabel={t('idVerificationButton')}
      onAction={() => void handleConfirm()}
      isActionPending={mutation.isPending}
      className="border-alert"
    />
  );
}

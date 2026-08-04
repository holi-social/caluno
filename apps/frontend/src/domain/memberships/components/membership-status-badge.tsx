import { Badge } from '@repo/ui';
import { useTranslations } from 'next-intl';
import type { MembershipEntry } from '../types';

const VARIANT: Record<MembershipEntry['state'], 'info' | 'error'> = {
  requested: 'info',
  declined: 'error',
};

const LABEL_KEY: Record<MembershipEntry['state'], string> = {
  requested: 'status.requested',
  declined: 'status.declined',
};

export function MembershipStatusBadge({
  state,
}: {
  state: MembershipEntry['state'];
}) {
  const t = useTranslations('MembershipRequest');
  return <Badge variant={VARIANT[state]}>{t(LABEL_KEY[state])}</Badge>;
}

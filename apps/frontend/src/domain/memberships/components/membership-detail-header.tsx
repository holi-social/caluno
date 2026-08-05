'use client';

import { DetailPageHeader } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';

type MembershipDetailHeaderProps = {
  title?: string;
  logoUrl?: string | null;
};

export const MembershipDetailHeader = ({
  title,
  logoUrl,
}: MembershipDetailHeaderProps) => {
  const router = useRouter();
  const t = useTranslations('Common');
  return (
    <DetailPageHeader
      title={title}
      onBack={() => router.back()}
      backLabel={t('back')}
      logoUrl={logoUrl}
    />
  );
};

'use client';

import { DetailPageHeader } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';

export const ProfileDetailHeader = () => {
  const tProfile = useTranslations('Profile');
  const tCommon = useTranslations('Common');
  const router = useRouter();

  return (
    <DetailPageHeader
      title={tProfile('pageTitle')}
      onBack={router.back}
      backLabel={tCommon('back')}
    />
  );
};

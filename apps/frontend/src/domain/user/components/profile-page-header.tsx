'use client';

import { DetailPageHeader } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';

type ProfilePageHeaderProps = {
  title?: string;
  backHref?: string;
};

export const ProfilePageHeader = ({
  title,
  backHref,
}: ProfilePageHeaderProps) => {
  const tProfile = useTranslations('Profile');
  const tCommon = useTranslations('Common');
  const router = useRouter();

  const handleBack = () => {
    if (backHref) {
      router.replace(backHref);
    } else {
      router.back();
    }
  };

  return (
    <DetailPageHeader
      title={title ?? tProfile('pageTitle')}
      onBack={handleBack}
      backLabel={tCommon('back')}
    />
  );
};

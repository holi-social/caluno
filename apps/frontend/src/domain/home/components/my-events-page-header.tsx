'use client';

import { DetailPageHeader } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';

export function MyEventsPageHeader() {
  const router = useRouter();
  const t = useTranslations('VolunteerHome');
  const tCommon = useTranslations('Common');

  return (
    <DetailPageHeader
      title={t('yourEventsHeading')}
      onBack={() => router.back()}
      backLabel={tCommon('back')}
    />
  );
}

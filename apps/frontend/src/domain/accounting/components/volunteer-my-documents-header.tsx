'use client';

import { DetailPageHeader } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';

interface VolunteerMyDocumentsHeaderProps {
  title: string;
}

/** Sticky header for the volunteer's cross-org "My documents" page. */
export function VolunteerMyDocumentsHeader({
  title,
}: VolunteerMyDocumentsHeaderProps) {
  const router = useRouter();
  const t = useTranslations('Common');
  return (
    <DetailPageHeader
      title={title}
      onBack={router.back}
      backLabel={t('back')}
    />
  );
}

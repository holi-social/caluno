'use client';

import { DetailPageHeader } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';

interface ShiftPageHeaderProps {
  logoUrl?: string | null;
}

export function ShiftPageHeader({ logoUrl }: ShiftPageHeaderProps) {
  const router = useRouter();
  const t = useTranslations('ShiftDetail');

  return (
    <DetailPageHeader
      transparent
      onBack={() => router.back()}
      backLabel={t('back')}
      logoUrl={logoUrl}
    />
  );
}

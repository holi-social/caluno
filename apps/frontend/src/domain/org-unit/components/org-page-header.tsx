'use client';

import { DetailPageHeader } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';

interface OrgPageHeaderProps {
  logoUrl?: string | null;
}

export function OrgPageHeader({ logoUrl }: OrgPageHeaderProps) {
  const router = useRouter();
  const t = useTranslations('Common');

  return (
    <DetailPageHeader
      transparent
      onBack={() => router.back()}
      backLabel={t('back')}
      logoUrl={logoUrl}
    />
  );
}

'use client';

import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function ReadyBanner() {
  const t = useTranslations('CheckIn');

  return (
    <div className="flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3 text-green-700">
      <Check className="size-5" />
      <p className="font-semibold">{t('readyBannerTitle')}</p>
    </div>
  );
}

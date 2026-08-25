'use client';

import { Button } from '@repo/ui';
import { AlertCircleIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

interface ShiftDetailErrorProps {
  orgId?: string;
}

export function ShiftDetailError({ orgId }: ShiftDetailErrorProps) {
  const t = useTranslations('ShiftDetail');
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <AlertCircleIcon className="size-6 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          {t('errorHeading')}
        </h1>
        <p className="text-muted-foreground">{t('errorBody')}</p>
        {orgId ? (
          <Button asChild variant="outline">
            <Link href={`/orgs/${orgId}`}>{t('errorOrgCta')}</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}

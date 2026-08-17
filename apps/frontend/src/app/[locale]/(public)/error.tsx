'use client';

import { Button } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import { reportError } from '@/lib/report-error';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function PublicError({ error, reset }: ErrorProps) {
  const t = useTranslations('Error');

  useEffect(() => {
    reportError(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
          <p className="font-medium">{error.message}</p>
          {error.digest && (
            <p className="text-xs mt-1 opacity-70">
              {t('digestLabel', { digest: error.digest })}
            </p>
          )}
        </div>
        <div className="flex justify-center gap-2">
          <Button onClick={reset}>{t('tryAgain')}</Button>
          <Button asChild variant="outline">
            <Link href="/">{t('goHome')}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

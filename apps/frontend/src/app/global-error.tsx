'use client';

import { Button } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { reportError } from '@/lib/report-error';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const t = useTranslations('Error');

  useEffect(() => {
    reportError(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
            <p className="font-medium">{t('generic')}</p>
            {error.digest && (
              <p className="text-xs mt-1 opacity-70">
                {t('digestLabel', { digest: error.digest })}
              </p>
            )}
          </div>
          <Button onClick={reset}>{t('tryAgain')}</Button>
        </div>
      </body>
    </html>
  );
}

'use client';

import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@repo/ui';
import { useTranslations } from 'next-intl';
import { type ReactNode, useEffect } from 'react';
import { reportError } from '@/lib/report-error';

interface ErrorFallbackProps {
  error: Error & { digest?: string };
  reset: () => void;
  /** Optional extra action rendered next to the try-again button. */
  secondaryAction?: ReactNode;
}

/** Reusable route/segment-level error boundary UI. Generic copy; never shows stack traces. */
export function ErrorFallback({
  error,
  reset,
  secondaryAction,
}: ErrorFallbackProps) {
  const t = useTranslations('Error');

  useEffect(() => {
    reportError(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">{t('generic')}</p>
          {error.digest && (
            <p className="text-xs text-muted-foreground">
              {t('digestLabel', { digest: error.digest })}
            </p>
          )}
        </CardContent>
        <CardFooter className="justify-center gap-2">
          <Button onClick={reset}>{t('tryAgain')}</Button>
          {secondaryAction}
        </CardFooter>
      </Card>
    </div>
  );
}

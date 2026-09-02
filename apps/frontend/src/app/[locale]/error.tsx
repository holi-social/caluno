'use client';

import { Button } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { ErrorFallback } from '@/components/error-fallback';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RootError({ error, reset }: ErrorProps) {
  const t = useTranslations('Error');

  return (
    <ErrorFallback
      error={error}
      reset={reset}
      secondaryAction={
        <Button variant="outline" onClick={() => window.location.reload()}>
          {t('reloadPage')}
        </Button>
      }
    />
  );
}

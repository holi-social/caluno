'use client';

import { Button } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { ErrorFallback } from '@/components/error-fallback';
import { Link } from '@/i18n/navigation';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function PublicError({ error, reset }: ErrorProps) {
  const t = useTranslations('Error');

  return (
    <ErrorFallback
      error={error}
      reset={reset}
      secondaryAction={
        <Button asChild variant="outline">
          <Link href="/">{t('goHome')}</Link>
        </Button>
      }
    />
  );
}

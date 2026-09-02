'use client';

import { Button } from '@repo/ui';
import { Home } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ErrorFallback } from '@/components/error-fallback';
import { Link } from '@/i18n/navigation';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorProps) {
  const t = useTranslations('Error');

  return (
    <ErrorFallback
      error={error}
      reset={reset}
      secondaryAction={
        <Button asChild variant="outline">
          <Link href="/">
            <Home />
            {t('goHome')}
          </Link>
        </Button>
      }
    />
  );
}

'use client';

import { Button, Input } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { requestPasswordReset } from '@/lib/auth';

interface ForgotPasswordFormProps {
  redirectTo?: string;
}

export function ForgotPasswordForm({
  redirectTo = '/',
}: ForgotPasswordFormProps) {
  const t = useTranslations('Auth.forgotPassword');
  const [error, setError] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSent(false);
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get('email') ?? '').trim();

    try {
      const resetRedirectUrl = new URL(
        '/reset-password',
        window.location.origin,
      );
      if (redirectTo && redirectTo !== '/') {
        resetRedirectUrl.searchParams.set('redirectTo', redirectTo);
      }

      const result = await requestPasswordReset({
        email,
        redirectTo: resetRedirectUrl.toString(),
      });

      if (result.error) {
        setError(result.error.message || t('sendFailed'));
        setIsPending(false);
        return;
      }

      setIsSent(true);
    } catch {
      setError(t('sendFailed'));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {isSent && (
        <output
          className="block space-y-2 rounded-md bg-primary/10 p-4 text-sm text-primary"
          tabIndex={-1}
        >
          <p>{t('emailSent')}</p>
          <p>{t('checkSpam')}</p>
        </output>
      )}

      <p className="text-sm text-muted-foreground">{t('description')}</p>

      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          {t('emailLabel')}
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          className="mt-1"
          placeholder={t('emailPlaceholder')}
          disabled={isPending}
        />
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? t('sending') : t('submit')}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t('remembered')}{' '}
        <Link
          href={
            redirectTo && redirectTo !== '/'
              ? `/login?redirectTo=${encodeURIComponent(redirectTo)}`
              : '/login'
          }
          className="font-medium text-primary hover:underline"
        >
          {t('signInLink')}
        </Link>
      </p>
    </form>
  );
}

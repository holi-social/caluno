'use client';

import { Button, Input } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { resetPassword } from '@/lib/auth';

interface ResetPasswordFormProps {
  token?: string;
  tokenError?: string;
}

export function ResetPasswordForm({
  token,
  tokenError,
}: ResetPasswordFormProps) {
  const t = useTranslations('Auth.resetPassword');
  const router = useRouter();
  const [error, setError] = useState<string | null>(
    tokenError ? t('invalidToken') : null,
  );
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!token) {
      setError(t('missingToken'));
      return;
    }

    setError(null);
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    const newPassword = String(formData.get('newPassword') ?? '');
    const confirmPassword = String(formData.get('confirmPassword') ?? '');

    if (newPassword !== confirmPassword) {
      setError(t('passwordMismatch'));
      setIsPending(false);
      return;
    }

    try {
      const result = await resetPassword({
        newPassword,
        token,
      });

      if (result.error) {
        setError(result.error.message || t('resetFailed'));
        setIsPending(false);
        return;
      }

      router.push('/login');
      router.refresh();
    } catch {
      setError(t('resetFailed'));
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

      <p className="text-sm text-muted-foreground">{t('description')}</p>

      <div className="space-y-4">
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium">
            {t('newPasswordLabel')}
          </label>
          <Input
            id="newPassword"
            name="newPassword"
            type="password"
            required
            minLength={6}
            className="mt-1"
            placeholder={t('passwordPlaceholder')}
            disabled={isPending || !token}
          />
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium"
          >
            {t('confirmPasswordLabel')}
          </label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={6}
            className="mt-1"
            placeholder={t('passwordPlaceholder')}
            disabled={isPending || !token}
          />
        </div>
      </div>

      <Button type="submit" disabled={isPending || !token} className="w-full">
        {isPending ? t('submitting') : t('submit')}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <Link
          href="/login"
          className="font-medium text-primary hover:underline"
        >
          {t('signInLink')}
        </Link>
      </p>
    </form>
  );
}

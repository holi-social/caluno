'use client';

import type { Locale } from '@repo/data';
import { Button, Input } from '@repo/ui';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { signIn } from '@/lib/auth';
import { setLocaleCookieIfSupported } from '@/lib/locale-cookie';
import { getVerifyEmailPath } from '@/lib/verify-email-url';

interface LoginFormProps {
  redirectTo?: string;
}

export function LoginForm({ redirectTo = '/' }: LoginFormProps) {
  const t = useTranslations('Auth.login');
  const router = useRouter();
  const currentLocale = useLocale();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const result = await signIn.email({ email, password });

      if (result.error) {
        if (result.error.code === 'EMAIL_NOT_VERIFIED') {
          router.push(getVerifyEmailPath({ email, redirectTo }));
          return;
        }

        setError(result.error.message || t('invalidCredentials'));
        setIsPending(false);
        return;
      }

      if (result.data?.user) {
        const userLocale = setLocaleCookieIfSupported(
          (result.data.user as { locale?: unknown }).locale,
        );
        router.push(redirectTo, {
          locale: userLocale ?? (currentLocale as Locale),
        });
        router.refresh();
      } else {
        setError(t('genericError'));
        setIsPending(false);
      }
    } catch {
      setError(t('genericError'));
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

      <div className="space-y-4">
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

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-medium">
              {t('passwordLabel')}
            </label>
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-primary hover:underline"
            >
              {t('forgotPasswordLink')}
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            className="mt-1"
            placeholder={t('passwordPlaceholder')}
            disabled={isPending}
          />
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? t('submitting') : t('submit')}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t('noAccount')}{' '}
        <Link
          href="/signup"
          className="font-medium text-primary hover:underline"
        >
          {t('signUpLink')}
        </Link>
      </p>
    </form>
  );
}

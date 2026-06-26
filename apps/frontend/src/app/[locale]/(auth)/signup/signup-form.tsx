'use client';

import { Button, Input } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { signIn, signUp } from '@/lib/auth';
import { getVerifyEmailPath } from '@/lib/verify-email-url';

interface SignupFormProps {
  redirectTo?: string;
}

export function SignupForm({ redirectTo = '/' }: SignupFormProps) {
  const t = useTranslations('Auth.signup');
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSignupSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const result = await signUp.email({ name, email, password });

      if (result.error) {
        setError(result.error.message || t('createAccountFailed'));
        setIsPending(false);
        return;
      }

      if (process.env.NODE_ENV !== 'production') {
        const signInResult = await signIn.email({ email, password });

        if (signInResult.error) {
          setError(signInResult.error.message || t('genericError'));
          setIsPending(false);
          return;
        }

        router.push(redirectTo);
        router.refresh();
        return;
      }

      router.push(getVerifyEmailPath({ email, redirectTo, codeSent: true }));
    } catch {
      setError(t('genericError'));
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSignupSubmit} className="mt-8 space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            {t('nameLabel')}
          </label>
          <Input
            id="name"
            name="name"
            type="text"
            required
            className="mt-1"
            placeholder={t('namePlaceholder')}
            disabled={isPending}
          />
        </div>

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
          <label htmlFor="password" className="block text-sm font-medium">
            {t('passwordLabel')}
          </label>
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
          <p className="mt-1 text-xs text-muted-foreground">
            {t('passwordHint')}
          </p>
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? t('submitting') : t('submit')}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t('hasAccount')}{' '}
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

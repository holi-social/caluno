'use client';

import type { Locale } from '@repo/data';
import { Button, Checkbox, Input } from '@repo/ui';
import { useLocale, useTranslations } from 'next-intl';
import { useId, useState } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { signIn, signUp } from '@/lib/auth';
import { setLocaleCookieIfSupported } from '@/lib/locale-cookie';
import {
  buildSignupPayload,
  PRIVACY_POLICY_PDF_PATH,
} from '@/lib/privacy-policy';
import { getVerifyEmailPath } from '@/lib/verify-email-url';

function switchAuthHref(
  path: '/signup' | '/login',
  orgUId?: string,
  redirectTo?: string,
) {
  const params = new URLSearchParams();
  if (orgUId) params.set('orgUId', orgUId);
  if (redirectTo && redirectTo !== '/') params.set('redirectTo', redirectTo);
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

interface SignupFormProps {
  redirectTo?: string;
  orgUId?: string;
}

export function SignupForm({ redirectTo = '/', orgUId }: SignupFormProps) {
  const t = useTranslations('Auth.signup');
  const router = useRouter();
  const currentLocale = useLocale();
  const privacyCheckboxId = useId();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  async function handleSignupSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const payload = buildSignupPayload({
      name,
      email,
      password,
      privacyAccepted,
    });

    if (!payload) {
      setError(t('privacyRequired'));
      setIsPending(false);
      return;
    }

    try {
      const result = await signUp.email(payload);

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

        const userLocale = setLocaleCookieIfSupported(
          (signInResult.data.user as { locale?: unknown }).locale,
        );
        router.push(redirectTo, {
          locale: userLocale ?? (currentLocale as Locale),
        });
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
    <form onSubmit={handleSignupSubmit} className="space-y-6">
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

        <div className="flex items-start gap-3">
          <Checkbox
            id={privacyCheckboxId}
            checked={privacyAccepted}
            onCheckedChange={(checked) => setPrivacyAccepted(checked === true)}
            disabled={isPending}
            aria-required
          />
          <label
            htmlFor={privacyCheckboxId}
            className="text-sm leading-snug font-medium"
          >
            {t.rich('privacyAcknowledge', {
              privacyLink: (chunks) => (
                <a
                  href={PRIVACY_POLICY_PDF_PATH}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary hover:underline"
                  onClick={(event) => event.stopPropagation()}
                >
                  {chunks}
                </a>
              ),
            })}
          </label>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isPending || !privacyAccepted}
        className="w-full"
      >
        {isPending ? t('submitting') : t('submit')}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t('hasAccount')}{' '}
        <Link
          href={switchAuthHref('/login', orgUId, redirectTo)}
          prefetch={false}
          className="font-medium text-primary hover:underline"
        >
          {t('signInLink')}
        </Link>
      </p>
    </form>
  );
}

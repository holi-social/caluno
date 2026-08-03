'use client';

import type { Locale } from '@repo/data';
import { Button, Input } from '@repo/ui';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { emailOtp } from '@/lib/auth';
import { setLocaleCookieIfSupported } from '@/lib/locale-cookie';

interface VerifyEmailFormProps {
  initialEmail?: string;
  initialCodeSent?: boolean;
  redirectTo?: string;
}

export function VerifyEmailForm({
  initialEmail = '',
  initialCodeSent = false,
  redirectTo = '/',
}: VerifyEmailFormProps) {
  const t = useTranslations('Auth.verifyEmail');
  const router = useRouter();
  const currentLocale = useLocale();
  const [email, setEmail] = useState(initialEmail);
  const [hasCode, setHasCode] = useState(
    Boolean(initialEmail && initialCodeSent),
  );
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(
    initialEmail && initialCodeSent
      ? t('codeSent', { email: initialEmail })
      : null,
  );
  const [isPending, setIsPending] = useState(false);

  async function sendCode(targetEmail: string) {
    const result = await emailOtp.sendVerificationOtp({
      email: targetEmail,
      type: 'email-verification',
    });

    if (result.error) {
      throw new Error(result.error.message || t('sendCodeFailed'));
    }
  }

  async function handleSendCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setStatus(null);
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    const targetEmail = String(formData.get('email') ?? '').trim();

    try {
      await sendCode(targetEmail);
      setEmail(targetEmail);
      setHasCode(true);
      setStatus(t('codeRequested', { email: targetEmail }));
    } catch (sendError) {
      setError(
        sendError instanceof Error ? sendError.message : t('sendCodeFailed'),
      );
    } finally {
      setIsPending(false);
    }
  }

  async function handleVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    const otp = String(formData.get('otp') ?? '').trim();

    try {
      const result = await emailOtp.verifyEmail({ email, otp });

      if (result.error) {
        setError(result.error.message || t('verifyCodeFailed'));
        setIsPending(false);
        return;
      }

      const userLocale = setLocaleCookieIfSupported(
        (result.data?.user as { locale?: unknown } | undefined)?.locale,
      );
      router.push(redirectTo, {
        locale: userLocale ?? (currentLocale as Locale),
      });
      router.refresh();
    } catch {
      setError(t('verifyCodeFailed'));
      setIsPending(false);
    }
  }

  async function handleResendCode() {
    setError(null);
    setStatus(null);
    setIsPending(true);

    try {
      await sendCode(email);
      setStatus(t('codeRequested', { email }));
    } catch (sendError) {
      setError(
        sendError instanceof Error ? sendError.message : t('sendCodeFailed'),
      );
    } finally {
      setIsPending(false);
    }
  }

  if (!hasCode) {
    return (
      <form onSubmit={handleSendCode} className="mt-8 space-y-6">
        {error && (
          <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        <p className="text-sm text-muted-foreground">
          {t('requestDescription')}
        </p>

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
            defaultValue={email}
          />
        </div>

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? t('sending') : t('sendCode')}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleVerify} className="mt-8 space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {status && (
        <div className="rounded-md bg-primary/10 p-4 text-sm text-primary">
          {status}
        </div>
      )}

      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {t('verificationDescription', { email })}
        </p>

        <div>
          <label htmlFor="otp" className="block text-sm font-medium">
            {t('otpLabel')}
          </label>
          <Input
            id="otp"
            name="otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            minLength={6}
            maxLength={6}
            pattern="[0-9]*"
            className="mt-1"
            placeholder={t('otpPlaceholder')}
            disabled={isPending}
          />
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? t('verifying') : t('verifySubmit')}
      </Button>

      <Button
        type="button"
        variant="ghost"
        disabled={isPending}
        className="w-full"
        onClick={handleResendCode}
      >
        {t('resendCode')}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t('remembered')}{' '}
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

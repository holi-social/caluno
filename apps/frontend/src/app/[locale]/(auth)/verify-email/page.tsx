import { getTranslations, setRequestLocale } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { resolveAuthPageRedirects } from '@/lib/auth-page-redirect';
import { getSession } from '@/lib/auth-server';
import { AuthPageShell } from '../auth-page-shell';
import { VerifyEmailForm } from './verify-email-form';

interface VerifyEmailPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    email?: string;
    redirectTo?: string;
    codeSent?: string;
  }>;
}

export default async function VerifyEmailPage({
  params,
  searchParams,
}: VerifyEmailPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Auth.verifyEmail');

  const resolvedSearchParams = await searchParams;
  const { formRedirectTo, authenticatedRedirect } =
    await resolveAuthPageRedirects(resolvedSearchParams);

  const session = await getSession();

  if (session?.user?.emailVerified) {
    redirect({ href: await authenticatedRedirect(), locale });
  }

  const initialEmail = resolvedSearchParams.email ?? session?.user?.email ?? '';

  return (
    <AuthPageShell title={t('title')}>
      <VerifyEmailForm
        initialEmail={initialEmail}
        initialCodeSent={resolvedSearchParams.codeSent === '1'}
        redirectTo={formRedirectTo}
      />
    </AuthPageShell>
  );
}

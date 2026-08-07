import { getTranslations, setRequestLocale } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { resolveAuthPageRedirects } from '@/lib/auth-page-redirect';
import { getSession } from '@/lib/auth-server';
import { AuthPageShell } from '../auth-page-shell';
import { ForgotPasswordForm } from './forgot-password-form';

interface ForgotPasswordPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ redirectTo?: string }>;
}

export default async function ForgotPasswordPage({
  params,
  searchParams,
}: ForgotPasswordPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Auth.forgotPassword');

  const { authenticatedRedirect } = await resolveAuthPageRedirects(
    await searchParams,
  );

  if (await getSession()) {
    redirect({ href: await authenticatedRedirect(), locale });
  }

  return (
    <AuthPageShell title={t('title')} description={t('description')}>
      <ForgotPasswordForm />
    </AuthPageShell>
  );
}

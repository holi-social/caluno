import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AuthPageShell } from '../auth-page-shell';
import { ResetPasswordForm } from './reset-password-form';

interface ResetPasswordPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    error?: string;
    token?: string;
  }>;
}

export default async function ResetPasswordPage({
  params,
  searchParams,
}: ResetPasswordPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Auth.resetPassword');
  const resolvedSearchParams = await searchParams;

  return (
    <AuthPageShell title={t('title')}>
      <ResetPasswordForm
        token={resolvedSearchParams.token}
        tokenError={resolvedSearchParams.error}
      />
    </AuthPageShell>
  );
}

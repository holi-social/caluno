import { getTranslations, setRequestLocale } from 'next-intl/server';
import { resolveAuthPageRedirects } from '@/lib/auth-page-redirect';
import { AuthPageShell } from '../auth-page-shell';
import { ResetPasswordForm } from './reset-password-form';

interface ResetPasswordPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    error?: string;
    token?: string;
    redirectTo?: string;
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

  const { formRedirectTo } =
    await resolveAuthPageRedirects(resolvedSearchParams);

  return (
    <AuthPageShell title={t('title')} description={t('description')}>
      <ResetPasswordForm
        token={resolvedSearchParams.token}
        tokenError={resolvedSearchParams.error}
        redirectTo={formRedirectTo}
      />
    </AuthPageShell>
  );
}

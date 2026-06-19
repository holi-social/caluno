import { getTranslations, setRequestLocale } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { AuthPageShell } from '../auth-page-shell';
import { resolveAuthPageRedirects } from '@/lib/auth-page-redirect';
import { getSession } from '@/lib/auth-server';
import { LoginForm } from './login-form';

interface LoginPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ redirectTo?: string }>;
}

export default async function LoginPage({
  params,
  searchParams,
}: LoginPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Auth.login');

  const { formRedirectTo, authenticatedRedirect } =
    await resolveAuthPageRedirects(await searchParams);

  if (await getSession()) {
    redirect({ href: await authenticatedRedirect(), locale });
  }

  return (
    <AuthPageShell title={t('title')}>
      <LoginForm redirectTo={formRedirectTo} />
    </AuthPageShell>
  );
}

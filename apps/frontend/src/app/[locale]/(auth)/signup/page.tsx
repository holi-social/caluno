import { getTranslations, setRequestLocale } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { resolveAuthPageRedirects } from '@/lib/auth-page-redirect';
import { isAuthenticated } from '@/lib/auth-server';
import { AuthPageShell } from '../auth-page-shell';
import { SignupForm } from './signup-form';

interface SignupPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ redirectTo?: string }>;
}

export default async function SignupPage({
  params,
  searchParams,
}: SignupPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Auth.signup');

  const { formRedirectTo, authenticatedRedirect } =
    await resolveAuthPageRedirects(await searchParams);

  if (await isAuthenticated()) {
    redirect({ href: await authenticatedRedirect(), locale });
  }

  return (
    <AuthPageShell title={t('title')}>
      <SignupForm redirectTo={formRedirectTo} />
    </AuthPageShell>
  );
}

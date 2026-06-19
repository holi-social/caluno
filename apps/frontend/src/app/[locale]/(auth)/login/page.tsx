import { cookies } from 'next/headers';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { getSession } from '@/lib/auth-server';
import { resolvePostAuthDestination } from '@/lib/post-auth-routing';
import { isSafeRedirect } from '@/lib/safe-redirect';
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

  const session = await getSession();
  const cookieStore = await cookies();
  const searchParamsData = await searchParams;
  const pendingRedirect = cookieStore.get('pending_redirect')?.value;
  const urlRedirectTo = isSafeRedirect(searchParamsData.redirectTo)
    ? searchParamsData.redirectTo
    : undefined;
  const rawRedirect = pendingRedirect ?? urlRedirectTo;
  const explicitRedirect =
    isSafeRedirect(rawRedirect) && rawRedirect !== '/'
      ? rawRedirect
      : undefined;

  if (session) {
    const destination =
      explicitRedirect ?? (await resolvePostAuthDestination());
    redirect({ href: destination, locale });
  }

  const redirectTo = explicitRedirect ?? '/';

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h2 className="page-title">{t('title')}</h2>
        </div>

        <LoginForm redirectTo={redirectTo} />
      </div>
    </div>
  );
}

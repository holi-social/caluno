import { cookies } from 'next/headers';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { getSession } from '@/lib/auth-server';
import { resolvePostAuthDestination } from '@/lib/post-auth-routing';
import { isSafeRedirect } from '@/lib/safe-redirect';
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

  const session = await getSession();
  const cookieStore = await cookies();
  const searchParamsData = await searchParams;
  const pendingInvite = cookieStore.get('pending_invite')?.value;
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
      explicitRedirect ??
      (pendingInvite
        ? `/invite/${pendingInvite}`
        : await resolvePostAuthDestination());
    redirect({ href: destination, locale });
  }

  const redirectTo =
    explicitRedirect ?? (pendingInvite ? `/invite/${pendingInvite}` : '/');

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold">{t('title')}</h2>
        </div>

        <SignupForm redirectTo={redirectTo} />
      </div>
    </div>
  );
}

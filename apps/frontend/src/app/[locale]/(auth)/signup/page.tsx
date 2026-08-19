import { getTranslations, setRequestLocale } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { resolveAuthPageRedirects } from '@/lib/auth-page-redirect';
import { isAuthenticated } from '@/lib/auth-server';
import { resolvePendingInviteOrg } from '@/lib/pending-invite-org';
import { AuthPageShell } from '../auth-page-shell';
import { SignupForm } from './signup-form';

interface SignupPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ redirectTo?: string; orgUId?: string }>;
}

export default async function SignupPage({
  params,
  searchParams,
}: SignupPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Auth.signup');
  const { redirectTo, orgUId } = await searchParams;

  const [{ formRedirectTo, authenticatedRedirect }, joiningOrg] =
    await Promise.all([
      resolveAuthPageRedirects({ redirectTo }),
      resolvePendingInviteOrg(orgUId),
    ]);

  if (await isAuthenticated()) {
    redirect({ href: await authenticatedRedirect(), locale });
  }

  return (
    <AuthPageShell
      title={t('title')}
      description={t('description')}
      joiningOrg={joiningOrg}
    >
      <SignupForm redirectTo={formRedirectTo} orgUId={joiningOrg?.id} />
    </AuthPageShell>
  );
}

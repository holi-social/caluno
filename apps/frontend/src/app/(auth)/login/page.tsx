import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth-server';
import { resolvePostAuthDestination } from '@/lib/post-auth-routing';
import { isSafeRedirect } from '@/lib/safe-redirect';
import { LoginForm } from './login-form';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const session = await getSession();
  const cookieStore = await cookies();
  const params = await searchParams;
  const pendingRedirect = cookieStore.get('pending_redirect')?.value;
  const urlRedirectTo = isSafeRedirect(params.redirectTo)
    ? params.redirectTo
    : undefined;
  const rawRedirect = pendingRedirect ?? urlRedirectTo;
  const explicitRedirect =
    isSafeRedirect(rawRedirect) && rawRedirect !== '/'
      ? rawRedirect
      : undefined;

  if (session) {
    redirect(explicitRedirect ?? (await resolvePostAuthDestination()));
  }

  const redirectTo = explicitRedirect ?? '/';

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h2 className="page-title">Sign in</h2>
        </div>

        <LoginForm redirectTo={redirectTo} />
      </div>
    </div>
  );
}

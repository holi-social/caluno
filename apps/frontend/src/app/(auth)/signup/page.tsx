import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth-server';
import { getSafeRedirect, isSafeRedirect } from '@/lib/safe-redirect';
import { SignupForm } from './signup-form';

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const session = await getSession();
  const cookieStore = await cookies();
  const params = await searchParams;
  const pendingInvite = cookieStore.get('pending_invite')?.value;
  const pendingRedirect = cookieStore.get('pending_redirect')?.value;
  const urlRedirectTo = isSafeRedirect(params.redirectTo)
    ? params.redirectTo
    : undefined;
  const redirectTo =
    getSafeRedirect(pendingRedirect ?? urlRedirectTo) ??
    (pendingInvite ? `/invite/${pendingInvite}` : '/');

  if (session) {
    redirect(redirectTo);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Create your account</h2>
        </div>

        <SignupForm redirectTo={redirectTo} />
      </div>
    </div>
  );
}

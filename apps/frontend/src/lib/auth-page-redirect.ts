import { cookies } from 'next/headers';
import { resolvePostAuthDestination } from './routing';
import { isSafeRedirect } from './safe-redirect';

export async function resolveAuthPageRedirects(searchParams: {
  redirectTo?: string;
}) {
  const cookieStore = await cookies();
  const pendingRedirect = cookieStore.get('pending_redirect')?.value;
  const pendingInvite = cookieStore.get('pending_invite')?.value;

  const urlRedirectTo = isSafeRedirect(searchParams.redirectTo)
    ? searchParams.redirectTo
    : undefined;
  const rawRedirect = pendingRedirect ?? urlRedirectTo;
  const explicitRedirect =
    isSafeRedirect(rawRedirect) && rawRedirect !== '/'
      ? rawRedirect
      : undefined;

  const inviteDestination = pendingInvite
    ? `/invite/${pendingInvite}`
    : undefined;

  const formRedirectTo = explicitRedirect ?? inviteDestination ?? '/';

  async function authenticatedRedirect(): Promise<string> {
    if (explicitRedirect) return explicitRedirect;
    if (inviteDestination) return inviteDestination;
    return resolvePostAuthDestination();
  }

  return { formRedirectTo, authenticatedRedirect };
}

import { JoinOrganizationStatus } from '@repo/data';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth-server';
import { getDataClient } from '@/lib/data-client';
import { getSafeRedirect } from '@/lib/safe-redirect';

interface InvitePageProps {
  params: Promise<{ orgId: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { orgId } = await params;
  const organizationUnitId = orgId;

  if (!(await isAuthenticated())) {
    const searchParams = new URLSearchParams({ orgUId: organizationUnitId });
    redirect(`/api/invite?${searchParams}`);
  }

  const data = await getDataClient();
  const orgUnit = await data.organization.findUnitWithOrg(organizationUnitId);

  if (!orgUnit) {
    notFound();
  }

  try {
    const result = await data.membershipRequest.join(organizationUnitId);

    if (result.status === JoinOrganizationStatus.RequirementsNeeded) {
      const redirectUrl = new URL('/', process.env.NEXT_PUBLIC_WEB_URL ?? '');
      redirectUrl.searchParams.set('orgUId', organizationUnitId);
      redirectUrl.searchParams.set('requirementsNeeded', 'true');
      redirect(redirectUrl.toString());
    }

    const cookieStore = await cookies();
    const pendingRedirect = cookieStore.get('pending_redirect')?.value;
    cookieStore.set('pending_invite', '', { maxAge: 0, path: '/' });
    cookieStore.set('pending_redirect', '', { maxAge: 0, path: '/' });

    redirect(getSafeRedirect(pendingRedirect));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to join organization';
    const redirectUrl = new URL('/', process.env.NEXT_PUBLIC_WEB_URL ?? '');
    redirectUrl.searchParams.set('orgUId', organizationUnitId);
    redirectUrl.searchParams.set('joinError', message);
    redirect(redirectUrl.toString());
  }
}

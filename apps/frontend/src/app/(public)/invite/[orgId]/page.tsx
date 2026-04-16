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
    await data.membershipRequest.create(organizationUnitId);
  } catch {}

  const cookieStore = await cookies();
  const pendingRedirect = cookieStore.get('pending_redirect')?.value;
  cookieStore.set('pending_invite', '', { maxAge: 0, path: '/' });
  cookieStore.set('pending_redirect', '', { maxAge: 0, path: '/' });

  redirect(getSafeRedirect(pendingRedirect));
}

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth-server';
import { getDataClient } from '@/lib/data-client';
import { getLastVisitedOrgServer } from '@/lib/org-context-server';

export default async function Home() {
  const session = await getSession();

  if (!session?.user) {
    return redirect('/login');
  }

  const data = await getDataClient();
  const orgsResult = await data.user.getMyOrganizations({
    limit: 100,
    offset: 0,
  });

  if (orgsResult.pagination.total === 0) {
    return redirect('/create-organization');
  }

  const lastOrgSlug = await getLastVisitedOrgServer();

  if (lastOrgSlug) {
    const hasAccess = orgsResult.items.some((org) => org.slug === lastOrgSlug);
    if (hasAccess) {
      return redirect(`/${lastOrgSlug}/shifts`);
    }
  }

  const firstOrg = orgsResult.items?.[0];
  if (!firstOrg) {
    return redirect('/create-organization');
  }

  redirect(`/${firstOrg.slug}/shifts`);
}

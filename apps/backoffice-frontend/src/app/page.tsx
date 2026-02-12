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

  const orgsResult = await data.user
    .getMyOrganizations({
      limit: 100,
      offset: 0,
    })
    .catch((error) => {
      throw error;
    });

  if (orgsResult.pagination.total === 0) {
    redirect('/create-organization');
  }

  const lastOrgId = await getLastVisitedOrgServer();
  if (lastOrgId) {
    const hasAccess = orgsResult.items.some((org) => org.id === lastOrgId);
    if (hasAccess) {
      redirect(`/${lastOrgId}`);
    }
  }
  redirect('/organizations');
}

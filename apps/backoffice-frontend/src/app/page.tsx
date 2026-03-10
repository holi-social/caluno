import { redirect } from 'next/navigation';
import HomePage from '@/domain/home/components/home-page';
import { isAuthenticated } from '@/lib/auth-server';
import { getDataClient } from '@/lib/data-client';
import { getLastVisitedOrgServer } from '@/lib/org-context-server';

export default async function Home() {
  if (!(await isAuthenticated())) {
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

  const lastOrgId = await getLastVisitedOrgServer();
  if (lastOrgId) {
    const hasAccess = orgsResult.items.some((org) => org.id === lastOrgId);
    if (hasAccess) {
      redirect(`/${lastOrgId}`);
    }
  }

  return <HomePage />;
}

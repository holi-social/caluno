import { redirect } from 'next/navigation';
import HomePage from '@/domain/home/components/home-page';
import { isAuthenticated } from '@/lib/auth-server';
import {
  getLastVisitedOrgServer,
  getMyAccessibleOrganizationUnits,
} from '@/lib/org-context-server';

export default async function Home() {
  if (!(await isAuthenticated())) {
    return redirect('/login');
  }

  const orgs = await getMyAccessibleOrganizationUnits();

  const lastorgUId = await getLastVisitedOrgServer();
  if (lastorgUId) {
    const hasAccess = orgs.some((org) => org.id === lastorgUId);
    if (hasAccess) {
      redirect(`/${lastorgUId}`);
    }
  }

  return <HomePage />;
}

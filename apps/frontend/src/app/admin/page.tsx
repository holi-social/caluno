import { redirect } from 'next/navigation';
import HomePage from '@/domain/home/components/home-page';
import {
  getLastVisitedOrgServer,
  getMyAccessibleOrganizationUnits,
} from '@/lib/org-context-server';

export default async function Home() {
  const orgs = await getMyAccessibleOrganizationUnits();

  const lastorgUId = await getLastVisitedOrgServer();
  if (lastorgUId) {
    const hasAccess = orgs.some((org) => org.id === lastorgUId);
    if (hasAccess) {
      redirect(`/admin/${lastorgUId}`);
    }
  }

  return <HomePage />;
}

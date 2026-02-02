import { redirect } from 'next/navigation';
import { getDataClient } from '@/lib/data-client';

export default async function DashboardPage() {
  const data = await getDataClient();
  const orgsResult = await data.user.getMyOrganizations({
    limit: 1,
    offset: 0,
  });

  if (orgsResult.pagination.total === 0) {
    redirect('/create-organization');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Shifts</h1>
      </div>
    </div>
  );
}

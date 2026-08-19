import { DiscoverView } from '@/domain/home/components/discover-view';
import { getDiscoverWindow } from '@/domain/home/lib/date-helpers';
import { getDataClient } from '@/lib/data-client';

interface DiscoverPageProps {
  params: Promise<{ locale: string }>;
}

export default async function DiscoverPage({ params }: DiscoverPageProps) {
  await params;
  const client = await getDataClient();

  const availableShiftInstancesPage =
    await client.shift.findAvailableShiftInstances(getDiscoverWindow());

  return (
    <DiscoverView
      initialAvailableShiftInstancesPage={availableShiftInstancesPage}
    />
  );
}

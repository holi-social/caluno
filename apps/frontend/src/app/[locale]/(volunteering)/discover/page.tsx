import { DiscoverView } from '@/domain/home/components/discover-view';
import { getDiscoverWindow } from '@/domain/home/lib/date-helpers';
import { getDataClient } from '@/lib/data-client';

interface DiscoverPageProps {
  params: Promise<{ locale: string }>;
}

export default async function DiscoverPage({ params }: DiscoverPageProps) {
  await params;
  const client = await getDataClient();

  const [availableShiftInstancesPage, availableEventsPage] = await Promise.all([
    client.shift.findAvailableShiftInstances(getDiscoverWindow()),
    client.event.findAvailableEvents({ limit: 15 }),
  ]);

  return (
    <DiscoverView
      initialAvailableShiftInstancesPage={availableShiftInstancesPage}
      initialAvailableEventsPage={availableEventsPage}
    />
  );
}

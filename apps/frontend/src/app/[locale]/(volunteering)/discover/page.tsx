import { DiscoverView } from '@/domain/home/components/discover-view';
import { getDiscoverWindow } from '@/domain/home/lib/date-helpers';
import { requireAuth } from '@/lib/auth-server';
import { getDataClient } from '@/lib/data-client';

interface DiscoverPageProps {
  params: Promise<{ locale: string }>;
}

export default async function DiscoverPage({ params }: DiscoverPageProps) {
  const { locale } = await params;
  await requireAuth(`/${locale}/auth/login`);
  const client = await getDataClient();

  const availableShiftInstancesPage =
    await client.shift.findAvailableShiftInstances(getDiscoverWindow());

  return (
    <DiscoverView
      initialAvailableShiftInstancesPage={availableShiftInstancesPage}
    />
  );
}

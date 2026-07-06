import { DiscoverView } from '@/domain/home/components/discover-view';
import { requireAuth } from '@/lib/auth-server';
import { getDataClient } from '@/lib/data-client';

interface DiscoverPageProps {
  params: Promise<{ locale: string }>;
}

export default async function DiscoverPage({ params }: DiscoverPageProps) {
  const { locale } = await params;
  await requireAuth(`/${locale}/auth/login`);
  const client = await getDataClient();

  const [availableShiftInstances, organizationUnits] = await Promise.all([
    client.shift.findAvailableShiftInstances({}),
    client.organization.findMyAccessibleOrganizationUnits(),
  ]);

  return (
    <DiscoverView
      initialAvailableShiftInstances={availableShiftInstances}
      initialOrganizationUnits={organizationUnits}
    />
  );
}

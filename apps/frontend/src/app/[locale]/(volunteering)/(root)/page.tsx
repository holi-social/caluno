import { VolunteerHomeContent } from '@/domain/home/components/volunteer-home-content';
import { getDiscoverWindow } from '@/domain/home/lib/date-helpers';
import { getDataClient } from '@/lib/data-client';

interface VolunteeringHomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function VolunteeringHomePage({
  params,
}: VolunteeringHomePageProps) {
  await params;
  const client = await getDataClient();

  const [myShiftInstances, availableShiftInstances] = await Promise.all([
    client.shift.findMyShiftInstances(false),
    client.shift.findAvailableShiftInstances(getDiscoverWindow()),
  ]);

  return (
    <VolunteerHomeContent
      initialMyShiftInstances={myShiftInstances}
      initialAvailableShiftInstances={availableShiftInstances}
    />
  );
}

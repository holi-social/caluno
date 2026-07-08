import { VolunteerHomeContent } from '@/domain/home/components/volunteer-home-content';
import { getDataClient } from '@/lib/data-client';

interface VolunteeringHomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function VolunteeringHomePage({
  params,
}: VolunteeringHomePageProps) {
  await params;
  const client = await getDataClient();

  const [myShiftInstances, availableShiftInstances, organizationUnits] =
    await Promise.all([
      client.shift.findMyShiftInstances(false),
      client.shift.findAvailableShiftInstances({}),
      client.organization.findMyAccessibleOrganizationUnits(),
    ]);

  return (
    <VolunteerHomeContent
      initialMyShiftInstances={myShiftInstances}
      initialAvailableShiftInstances={availableShiftInstances}
      initialOrganizationUnits={organizationUnits}
    />
  );
}

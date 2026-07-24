import { ShiftInviteStatus } from '@repo/data';
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

  const [myShiftInstancesPage, availableShiftInstancesPage, invitationsPage] =
    await Promise.all([
      client.shift.findMyShiftInstances({ limit: 10 }),
      client.shift.findAvailableShiftInstances(getDiscoverWindow()),
      client.shift.findMyShiftInstances({
        limit: 10,
        statuses: [ShiftInviteStatus.Invited],
      }),
    ]);

  return (
    <VolunteerHomeContent
      initialMyShiftInstances={myShiftInstancesPage.items}
      initialAvailableShiftInstances={availableShiftInstancesPage.items}
      initialInvitations={invitationsPage.items}
    />
  );
}

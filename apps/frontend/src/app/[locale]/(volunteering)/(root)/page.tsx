import {
  EventInviteStatus,
  MembershipRequestStatus,
  ShiftInviteStatus,
} from '@repo/data';
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

  const [
    myShiftInstancesPage,
    availableShiftInstancesPage,
    shiftInvitationsPage,
    eventInvitationsPage,
    myMemberships,
    myMembershipRequests,
  ] = await Promise.all([
    client.shift.findMyShiftInstances({ limit: 10, includeIntended: true }),
    client.shift.findAvailableShiftInstances(getDiscoverWindow()),
    client.shift.findMyShiftInstances({
      limit: 10,
      statuses: [ShiftInviteStatus.Invited],
    }),
    client.event.findMyEvents({
      limit: 10,
      statuses: [EventInviteStatus.Invited],
    }),
    client.membership.findMyMemberships(),
    client.membership.findMine(),
    client.membershipRequest.findMine({ limit: 10, offset: 0 }),
  ]);

  const hasMemberships = myMemberships.length > 0;

  const pendingRequest = myMembershipRequests.items.find(
    (request) => request.status === MembershipRequestStatus.Pending,
  );

  return (
    <VolunteerHomeContent
      initialMyShiftInstances={myShiftInstancesPage.items}
      initialAvailableShiftInstances={availableShiftInstancesPage.items}
      initialShiftInvitations={shiftInvitationsPage.items}
      initialEventInvitations={eventInvitationsPage.items}
      hasMemberships={hasMemberships}
      pendingRequest={
        pendingRequest
          ? {
              id: pendingRequest.id,
              organizationName:
                pendingRequest.organizationUnit.organization.name,
              contactName: pendingRequest.contact?.name,
            }
          : null
      }
    />
  );
}

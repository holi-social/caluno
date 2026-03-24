import { redirect } from 'next/navigation';
import { getDataClient } from '@/lib/data-client';
import { requireOrgAccess } from '@/lib/org-context-server';

interface CheckinPageProps {
  params: Promise<{ orgId: string; checkInId: string }>;
}

export default async function DecidePage({ params }: CheckinPageProps) {
  const { orgId, checkInId } = await params;

  const { org } = await requireOrgAccess(orgId);
  const data = await getDataClient(org.id);
  const user = await data.user.findByCheckInId(checkInId);

  if (!user) {
    return;
  }

  const timeEntries = await data.timeEntry.findByUser(user.id);
  const hasOpenTimeEntries = timeEntries.items.some((entry) => !entry.endedAt);

  if (hasOpenTimeEntries) {
    redirect(`/${orgId}/check-in/${checkInId}/check-out`);
  } else {
    redirect(`/${orgId}/check-in/${checkInId}/check-in`);
  }
}

import { redirect } from 'next/navigation';
import { getDataClient } from '@/lib/data-client';
import { requireOrgAccess } from '@/lib/org-context-server';

interface CheckinPageProps {
  params: Promise<{ orgUId: string; checkInId: string }>;
}

export default async function DecidePage({ params }: CheckinPageProps) {
  const { orgUId, checkInId } = await params;

  await requireOrgAccess(orgUId);
  const data = await getDataClient({ orgUId });
  const user = await data.user.findByCheckInId(checkInId);

  if (!user) {
    return;
  }

  const timeEntries = await data.timeEntry.findByUser(user.id);
  const hasOpenTimeEntries = timeEntries.items.some((entry) => !entry.endedAt);

  if (hasOpenTimeEntries) {
    redirect(`/admin/${orgUId}/check-in/${checkInId}/check-out`);
  } else {
    redirect(`/admin/${orgUId}/check-in/${checkInId}/check-in`);
  }
}

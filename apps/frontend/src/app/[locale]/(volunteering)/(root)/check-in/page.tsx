import { CheckInView } from '@/domain/shift/components/check-in-view';
import { getDataClient } from '@/lib/data-client';
import { getMyCheckInOrgUnits } from '@/lib/org-context-server';

export default async function CheckInPage() {
  const data = await getDataClient();

  const [{ checkInId, name }, checkInOrgUnits] = await Promise.all([
    data.user.getMe(),
    getMyCheckInOrgUnits(),
  ]);

  return (
    <CheckInView
      checkInId={checkInId}
      name={name}
      canCheckIn={checkInOrgUnits.length > 0}
    />
  );
}

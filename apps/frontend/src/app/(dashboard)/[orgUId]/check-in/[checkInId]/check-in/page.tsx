import { Alert, AlertDescription, AlertTitle } from '@repo/ui';
import { AlertCircle } from 'lucide-react';
import { CheckinForm } from '@/domain/shift/components/checkin-form';
import { getDataClient } from '@/lib/data-client';
import { requireOrgAccess } from '@/lib/org-context-server';

interface CheckinPageProps {
  params: Promise<{ orgUId: string; checkInId: string }>;
}

//  TODO: what's the true different states
export type CheckInStatus =
  | 'valid'
  | 'blocked'
  | 'information-required'
  | 'id-check'
  | 'already-checked-in';

export default async function CheckinPage({ params }: CheckinPageProps) {
  const { orgUId, checkInId } = await params;

  await requireOrgAccess(orgUId);
  const data = await getDataClient(orgUId);
  const user = await data.user.findByCheckInId(checkInId);

  const activeShiftsResult = await data.shift.activeShifts({
    limit: 100,
    offset: 0,
  });

  if (!user) {
    return;
  }

  //  TODO: temporary status checking, until blocking & dossier features land
  const status: CheckInStatus = 'valid' as CheckInStatus;

  return (
    <div className="max-w-2xl">
      <div>
        <div>
          <h1 className="text-3xl font-bold">Check-in</h1>
        </div>
        <div className="lg:px-2 lg:py-8 py-4 space-y-4">
          {status === 'blocked' && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertTitle>Check-in denied</AlertTitle>
              <AlertDescription>
                The volunteer is not permitted to check-in. They must contact
                Headquarters for assistance.
              </AlertDescription>
            </Alert>
          )}

          <CheckinForm
            volunteer={user}
            shifts={activeShiftsResult.items}
            organizationUnitId={orgUId}
            status={status}
          />
        </div>
      </div>
    </div>
  );
}

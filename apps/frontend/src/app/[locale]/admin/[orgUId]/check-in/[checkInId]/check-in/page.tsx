import { Alert, AlertDescription, AlertTitle } from '@repo/ui';
import { AlertCircle } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { CheckinForm } from '@/domain/shift/components/checkin-form';
import { getDataClient } from '@/lib/data-client';
import { requireOrgAccess } from '@/lib/org-context-server';

interface CheckinPageProps {
  params: Promise<{ orgUId: string; checkInId: string }>;
}

//  TODO: what's the true different states
export type CheckInStatus =
  | 'valid'
  | 'notMember'
  | 'blocked'
  | 'informationRequired'
  | 'idCheckRequired'
  | 'alreadyCheckedIn';

export default async function CheckinPage({ params }: CheckinPageProps) {
  const { orgUId, checkInId } = await params;
  const t = await getTranslations('Shift.checkIn');

  await requireOrgAccess(orgUId);
  const data = await getDataClient({ orgUId });
  const user = await data.user.findByCheckInId(checkInId);

  if (!user) {
    notFound();
  }

  const isMember = await data.organizationUnit.isMemberOfOrgUnitOrAncestor(
    orgUId,
    user.id,
  );

  const shifts = await data.shift.activeShifts(user.id);

  //  TODO: temporary status checking, until blocking & requirement profile checks land
  const status: CheckInStatus = isMember ? 'valid' : 'notMember';

  return (
    <div className="max-w-2xl">
      <div>
        <div>
          <h1 className="page-title">{t('checkInTitle')}</h1>
        </div>
        <div className="lg:px-2 lg:py-8 py-4 space-y-4">
          {status !== 'valid' && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertTitle>{t(`invalidCheckin.${status}.title`)}</AlertTitle>
              <AlertDescription>
                {t(`invalidCheckin.${status}.description`)}
              </AlertDescription>
            </Alert>
          )}

          <CheckinForm
            volunteer={user}
            shifts={shifts}
            organizationUnitId={orgUId}
            status={status}
          />
        </div>
      </div>
    </div>
  );
}

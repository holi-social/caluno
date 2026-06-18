import { Alert, AlertDescription, AlertTitle } from '@repo/ui';
import { AlertCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from '@/i18n/navigation';
import { getDataClient } from '@/lib/data-client';
import { requireOrgAccess } from '@/lib/org-context-server';

type CheckInLayoutProps = {
  params: Promise<{ orgUId: string; checkInId: string }>;
  children: ReactNode;
};

export default async function CheckOutPage({
  params,
  children,
}: CheckInLayoutProps) {
  const { orgUId, checkInId } = await params;

  await requireOrgAccess(orgUId);
  const data = await getDataClient(orgUId);
  const user = await data.user.findByCheckInId(checkInId);

  if (user) {
    return children;
  } else {
    return (
      <Alert variant="destructive">
        <AlertCircle />
        <AlertTitle>Volunteer does not exist</AlertTitle>
        <AlertDescription className="block">
          There is no volunteer that matches this QR iD. The QR iD may have been
          re-generated and so this QR iD is no longer valid.{' '}
          <Link className="underline" href={`/admin/${orgUId}/check-in/scan`}>
            Try again
          </Link>{' '}
          by entering the QR iD manually or search for the volunteer to check
          them in .
        </AlertDescription>
      </Alert>
    );
  }
}

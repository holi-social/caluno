import { PermissionKey } from '@repo/data';
import { Alert, AlertDescription, AlertTitle } from '@repo/ui';
import { AlertCircle } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';
import { Link } from '@/i18n/navigation';
import { getDataClient } from '@/lib/data-client';
import { requireOrgAccess } from '@/lib/org-context-server';
import { requirePermission } from '@/lib/permissions-server';

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
  await requirePermission(orgUId, PermissionKey.CheckInManage);
  const data = await getDataClient({ orgUId });
  const user = await data.user.findByCheckInId(checkInId);

  const t = await getTranslations('Shift.checkIn');

  if (user) {
    return children;
  } else {
    return (
      <Alert variant="destructive">
        <AlertCircle />
        <AlertTitle>{t('volunteerNotFoundTitle')}</AlertTitle>
        <AlertDescription className="block">
          {t.rich('volunteerNotFoundDescription', {
            tryAgain: (chunks) => (
              <Link
                className="underline"
                href={`/admin/${orgUId}/check-in/scan`}
              >
                {chunks}
              </Link>
            ),
          })}
        </AlertDescription>
      </Alert>
    );
  }
}

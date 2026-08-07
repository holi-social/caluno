import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui';
import { ScanQrCode } from 'lucide-react';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import {
  getLastVisitedOrgServer,
  getMyAdministrableOrgUnits,
} from '@/lib/org-context-server';

type CheckInPageProps = {
  params: Promise<{ checkInId: string }>;
};

export default async function CheckInPage({ params }: CheckInPageProps) {
  const { checkInId } = await params;
  const t = await getTranslations('Shift.checkIn');

  const lastVisitedOrganizationId = await getLastVisitedOrgServer();

  if (lastVisitedOrganizationId) {
    return redirect(
      `/admin/${lastVisitedOrganizationId}/check-in/${checkInId}/decide`,
    );
  }

  const organizations = await getMyAdministrableOrgUnits();

  if (organizations.length === 1) {
    return redirect(
      `/admin/${organizations[0]?.id}/check-in/${checkInId}/decide`,
    );
  }

  return (
    <div className="flex justify-center p-4 pt-20">
      <Card className="w-2xl">
        <CardHeader>
          <CardTitle>{t('selectOrgTitle')}</CardTitle>
          <CardDescription>{t('selectOrgDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {organizations.map((o) => (
            <Link
              key={o.id}
              href={`/admin/${o.id}/check-in/${checkInId}/decide`}
              className="flex gap-4 items-center text-xl"
            >
              {o.name}
              <Button type="button" size="icon-sm">
                <ScanQrCode />
              </Button>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

import { Card, CardContent } from '@repo/ui';
import { Calendar, Hand, ScanQrCode } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { UserCard } from '@/components/user-card';
import { CheckOutButton } from '@/domain/shift/components/checkout-button';
import { getDataClient } from '@/lib/data-client';
import { getFormatting } from '@/lib/formatting/formatting-server';
import { requireOrgAccess } from '@/lib/org-context-server';

interface CheckOutPageProps {
  params: Promise<{ orgUId: string; checkInId: string }>;
}

export default async function CheckOutPage({ params }: CheckOutPageProps) {
  const { orgUId, checkInId } = await params;

  await requireOrgAccess(orgUId);
  const data = await getDataClient({ orgUId });
  const user = await data.user.findByCheckInId(checkInId);

  const t = await getTranslations('Shift.checkIn');
  const { formatDateTime } = await getFormatting();

  if (!user) {
    notFound();
  }

  const timeEntries = await data.timeEntry.findByUser(user.id);
  const openTimeEntries = timeEntries.items.filter((entry) => !entry.endedAt);
  const entry = openTimeEntries[0];

  if (!entry) {
    notFound();
  }

  return (
    <div className="max-w-2xl">
      <div>
        <div>
          <h1 className="page-title">{t('checkOutTitle')}</h1>
        </div>
        <div className="lg:px-2 lg:py-8 py-4 space-y-6">
          <Card className="mb-6">
            <CardContent>
              <ul className="space-y-3">
                <li className="flex gap-2">
                  <Calendar className="text-muted-foreground" />
                  {entry.shiftInstance.overrideTitle ??
                    entry.shiftInstance.master.title}
                </li>
                <li className="flex gap-2">
                  <ScanQrCode className="text-muted-foreground" />{' '}
                  {t('checkedInAt', {
                    time: formatDateTime(new Date(entry.startedAt)),
                  })}
                </li>
                <li className="flex gap-2">
                  <Hand className="text-muted-foreground" />{' '}
                  {t('checkingOutAt', {
                    time: formatDateTime(new Date()),
                  })}
                </li>
              </ul>
            </CardContent>
          </Card>

          <UserCard user={user} size="lg" />

          <div className="mt-2 fixed bottom-0 left-4 right-4 z-50 pb-[calc(1rem+env(safe-area-inset-bottom))] md:static md:w-full">
            <CheckOutButton
              organizationUnitId={orgUId}
              timeEntryId={entry.id}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

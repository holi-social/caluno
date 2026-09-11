import { Card, CardContent } from '@repo/ui';
import { Calendar, Hand, ScanQrCode } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { UserCard } from '@/components/user-card';
import { CheckOutButton } from '@/domain/shift/components/checkout-button';
import { getDataClient } from '@/lib/data-client';
import { getFormatting } from '@/lib/formatting/formatting-server';

interface VolunteeringCheckOutPageProps {
  params: Promise<{ checkInId: string }>;
  searchParams: Promise<{ entryId?: string }>;
}

export default async function VolunteeringCheckOutPage({
  params,
  searchParams,
}: VolunteeringCheckOutPageProps) {
  const { checkInId } = await params;
  const { entryId } = await searchParams;

  const data = await getDataClient();
  const context = await data.timeEntry.getCheckInContext(checkInId);

  if (!context) {
    notFound();
  }

  const entry = context.openTimeEntries.find((item) => item.id === entryId);

  if (!entry) {
    notFound();
  }

  const t = await getTranslations('Shift.checkIn');
  const { formatDateTime } = await getFormatting();

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
                  {entry.shiftInstance
                    ? (entry.shiftInstance.overrideTitle ??
                      entry.shiftInstance.master.title)
                    : t('generalCheckIn')}
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

          <UserCard user={context.volunteer} size="lg" />

          <div className="mt-2 fixed bottom-0 left-4 right-4 z-50 pb-[calc(1rem+env(safe-area-inset-bottom))] md:static md:w-full">
            <CheckOutButton
              organizationUnitId={entry.organizationUnit.id}
              timeEntryId={entry.id}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

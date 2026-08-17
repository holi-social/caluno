import { SortOrder } from '@repo/data/react';
import { MyShiftsView } from '@/domain/home/components/my-shifts-view';
import { startOfDay } from '@/domain/home/lib/date-helpers';
import { requireAuth } from '@/lib/auth-server';
import { getDataClient } from '@/lib/data-client';

interface MyShiftsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function MyShiftsPage({ params }: MyShiftsPageProps) {
  const { locale } = await params;
  await requireAuth(`/${locale}/auth/login`);
  const client = await getDataClient();
  const myShiftInstancesPage = await client.shift.findMyShiftInstances({
    startsAfter: startOfDay(new Date()),
    order: SortOrder.Asc,
    limit: 15,
    includeIntended: true,
  });

  return <MyShiftsView initialFuturePage={myShiftInstancesPage} />;
}

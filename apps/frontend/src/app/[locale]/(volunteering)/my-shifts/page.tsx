import { SortOrder } from '@repo/data/react';
import { MyShiftsView } from '@/domain/home/components/my-shifts-view';
import { startOfDay } from '@/domain/home/lib/date-helpers';
import { getDataClient } from '@/lib/data-client';

interface MyShiftsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function MyShiftsPage({ params }: MyShiftsPageProps) {
  await params;
  const client = await getDataClient();
  const myShiftInstancesPage = await client.shift.findMyShiftInstances({
    from: startOfDay(new Date()),
    order: SortOrder.Asc,
    limit: 15,
    includeIntended: true,
  });

  return <MyShiftsView initialFuturePage={myShiftInstancesPage} />;
}

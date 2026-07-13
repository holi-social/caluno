import { MyShiftsView } from '@/domain/home/components/my-shifts-view';
import { requireAuth } from '@/lib/auth-server';
import { getDataClient } from '@/lib/data-client';

interface MyShiftsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function MyShiftsPage({ params }: MyShiftsPageProps) {
  const { locale } = await params;
  await requireAuth(`/${locale}/auth/login`);
  const client = await getDataClient();
  const myShiftInstances = await client.shift.findMyShiftInstances(true);

  return <MyShiftsView initialMyShiftInstances={myShiftInstances} />;
}

import { ShiftTabSwitcher } from '@/domain/shift/components/shift-tab-switcher';

type ShiftViewType = 'weekplan' | 'shifts';

interface ShiftsPageProps {
  params: Promise<{ orgUId: string }>;
  searchParams: Promise<{ view?: ShiftViewType; page?: string; week?: string }>;
}

export default async function ShiftsPage({
  params,
  searchParams,
}: ShiftsPageProps) {
  const { orgUId } = await params;
  const { view = 'weekplan', week } = await searchParams;

  const isWeekplan = view !== 'shifts';

  return (
    <ShiftTabSwitcher
      orgUId={orgUId}
      activeTab={isWeekplan ? 'weekplan' : 'shifts'}
      week={week}
    />
  );
}

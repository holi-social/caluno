import { Pagination } from '@/components/pagination';
import { EmptyMyTime } from '@/domain/time-entry/components/empty-my-time';
import { MyTimeView } from '@/domain/time-entry/components/my-time-view';
import { groupMyTime } from '@/domain/time-entry/my-time-grouping';
import { getDataClient } from '@/lib/data-client';

const PAGE_SIZE = 50;

type MyTimePageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function MyTimePage({ searchParams }: MyTimePageProps) {
  const data = await getDataClient();

  const { page } = await searchParams;
  const currentPage = Math.max(1, Number.parseInt(page ?? '1', 10) || 1);
  const offset = (currentPage - 1) * PAGE_SIZE;

  const result = await data.timeEntry.findMyTime({ limit: PAGE_SIZE, offset });
  const hasTimeEntries = result.pagination.total > 0;

  if (!hasTimeEntries) {
    return <EmptyMyTime />;
  }

  const grouped = groupMyTime(result.items);

  return (
    <>
      <MyTimeView grouped={grouped} />
      {result.pagination.total > PAGE_SIZE && (
        <Pagination
          pagination={result.pagination}
          url="/timesheets"
          currentPage={currentPage}
          name="entries"
        />
      )}
    </>
  );
}

import { getTranslations } from 'next-intl/server';
import { Pagination } from '@/components/pagination';
import { EmptyMyTime } from '@/domain/time-entry/components/empty-my-time';
import { MyTimeView } from '@/domain/time-entry/components/my-time-view';
import { groupMyTime } from '@/domain/time-entry/my-time-grouping';
import { requireAuth } from '@/lib/auth-server';
import { getDataClient } from '@/lib/data-client';

const PAGE_SIZE = 50;

export default async function MyTimePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireAuth();
  const data = await getDataClient();
  const t = await getTranslations('MyTime');

  const { page } = await searchParams;
  const currentPage = Math.max(1, Number.parseInt(page ?? '1', 10) || 1);
  const offset = (currentPage - 1) * PAGE_SIZE;

  const result = await data.timeEntry.findMyTime({ limit: PAGE_SIZE, offset });
  const { items } = result;

  if (items.length === 0 && currentPage === 1) {
    return (
      <div className="space-y-6">
        <h1 className="page-title">{t('title')}</h1>
        <EmptyMyTime />
      </div>
    );
  }

  const grouped = groupMyTime(items);

  return (
    <div className="space-y-6">
      <h1 className="page-title">{t('title')}</h1>
      <MyTimeView grouped={grouped} />
      {result.pagination.total > result.pagination.limit && (
        <Pagination
          pagination={result.pagination}
          url="/timesheets"
          currentPage={currentPage}
          name="entries"
        />
      )}
    </div>
  );
}

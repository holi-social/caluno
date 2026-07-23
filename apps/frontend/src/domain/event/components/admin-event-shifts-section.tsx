import type { GetEventShiftsQuery, PaginationInfo } from '@repo/data';
import {
  Button,
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@repo/ui';
import { CalendarRange } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Pagination } from '@/components/pagination';
import { eventShiftNewPath } from '@/domain/event/routes';
import { ShiftsTable } from '@/domain/shift/components/shifts-table';
import { Link } from '@/i18n/navigation';

type EventShift = GetEventShiftsQuery['eventShifts']['items'][number];

const ITEMS_PER_PAGE = 10;

interface AdminEventShiftsSectionProps {
  orgUId: string;
  eventId: string;
  shifts: EventShift[];
  pagination: PaginationInfo;
  currentPage: number;
  canEdit: boolean;
}

export async function AdminEventShiftsSection({
  orgUId,
  eventId,
  shifts,
  pagination,
  currentPage,
  canEdit,
}: AdminEventShiftsSectionProps) {
  const t = await getTranslations('Event.detail.shiftsCard');

  const addShiftHref = eventShiftNewPath(orgUId, eventId);

  return (
    <Card className="bg-transparent border-none shadow-none">
      <CardHeader className="px-0">
        <CardTitle>{t('title')}</CardTitle>

        {canEdit && (
          <CardAction>
            <Link href={addShiftHref}>
              <Button>{t('addButton')}</Button>
            </Link>
          </CardAction>
        )}
      </CardHeader>

      <CardContent className="px-0">
        {pagination.total === 0 ? (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CalendarRange />
              </EmptyMedia>
              <EmptyTitle>{t('emptyTitle')}</EmptyTitle>
              <EmptyDescription>{t('emptyDescription')}</EmptyDescription>
            </EmptyHeader>

            {canEdit && (
              <EmptyContent>
                <Link href={addShiftHref}>
                  <Button>{t('addButton')}</Button>
                </Link>
              </EmptyContent>
            )}
          </Empty>
        ) : (
          <div className="flex flex-col gap-4">
            <ShiftsTable
              shifts={shifts}
              orgUId={orgUId}
              page={currentPage}
              eventId={eventId}
            />
            {pagination.total > ITEMS_PER_PAGE && (
              <Pagination
                pagination={pagination}
                url={`/admin/${orgUId}/events/${eventId}`}
                currentPage={currentPage}
                name="shifts"
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

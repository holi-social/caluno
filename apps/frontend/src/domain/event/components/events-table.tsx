'use client';

import type { GetEventsQuery } from '@repo/data/react';
import {
  Badge,
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui';
import { PlusIcon, TicketIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useFormatting } from '@/lib/formatting/use-formatting';
import { eventDetailPath } from '../routes';
import { EventActionBar } from './event-action-bar';

interface EventsTableProps {
  events: GetEventsQuery['events']['items'];
  orgUId: string;
  canEdit: boolean;
}

export function EventsTable({ events, orgUId, canEdit }: EventsTableProps) {
  const t = useTranslations('Event');
  const { formatRange } = useFormatting();
  if (events.length === 0) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <TicketIcon />
          </EmptyMedia>
          <EmptyTitle>{t('empty.title')}</EmptyTitle>
          <EmptyDescription>{t('empty.description')}</EmptyDescription>
        </EmptyHeader>
        {canEdit && (
          <EmptyContent>
            <Button asChild>
              <Link href={`/admin/${orgUId}/events/new`}>
                <PlusIcon />
                {t('list.createButton')}
              </Link>
            </Button>
          </EmptyContent>
        )}
      </Empty>
    );
  }

  return (
    <div className="rounded-md border">
      <Table className="table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%] sm:w-[35%] lg:w-[30%]">
              {t('table.event')}
            </TableHead>
            <TableHead className="w-[100px] sm:w-[120px] lg:w-[140px]">
              {t('table.dates')}
            </TableHead>
            <TableHead className="hidden sm:table-cell w-[20%] lg:w-[18%]">
              {t('table.location')}
            </TableHead>
            <TableHead className="w-[60px] sm:w-[70px]">
              {t('table.shifts')}
            </TableHead>
            <TableHead className="w-[60px] sm:w-[70px]">
              {t('table.requiredForms')}
            </TableHead>
            <TableHead className="w-[120px] sm:w-[140px]">
              <span className="sr-only">{t('action.viewAria')}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event.id}>
              <TableCell className="min-w-0">
                <Link
                  href={eventDetailPath(orgUId, event.id)}
                  className="hover:underline block truncate"
                  title={event.title}
                >
                  {event.title}
                </Link>
              </TableCell>
              <TableCell
                className="text-muted-foreground truncate"
                title={formatRange(event.startsAt, event.endsAt)}
              >
                {formatRange(event.startsAt, event.endsAt)}
              </TableCell>
              <TableCell
                className="text-muted-foreground truncate hidden sm:table-cell"
                title={event.location ?? undefined}
              >
                {event.location ?? '—'}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{event.shiftsCount}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{event.requiredFormsCount}</Badge>
              </TableCell>
              <TableCell>
                <EventActionBar
                  id={event.id}
                  slug={event.slug}
                  orgUId={orgUId}
                  canEdit={canEdit}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

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
import { TicketIcon } from 'lucide-react';
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
            <Link href={`/admin/${orgUId}/events/new`}>
              <Button size="sm">{t('list.createButton')}</Button>
            </Link>
          </EmptyContent>
        )}
      </Empty>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('table.event')}</TableHead>
            <TableHead>{t('table.dates')}</TableHead>
            <TableHead>{t('table.location')}</TableHead>
            <TableHead>{t('table.shifts')}</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event.id}>
              <TableCell>
                <Link
                  href={eventDetailPath(orgUId, event.id)}
                  className="hover:underline block truncate"
                >
                  {event.title}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatRange(event.startsAt, event.endsAt)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {event.location ?? '—'}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{event.shiftsCount}</Badge>
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

'use client';

import type { RawEvent } from '@repo/data';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui';
import { CalendarPlus, CalendarRange } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { shiftDetailPath } from '@/domain/shift/routes';
import { Link } from '@/i18n/navigation';
import { useFormatting } from '@/lib/formatting/use-formatting';

type EventShift = RawEvent['shifts'][number];

interface EventShiftsCardProps {
  orgUId: string;
  eventId: string;
  shifts: EventShift[];
  canEdit: boolean;
}

function volunteersLabel(min?: number | null, max?: number | null): string {
  if (min == null && max == null) return '—';
  if (max == null) return `${min ?? 0}+`;
  return `${min ?? 0}–${max}`;
}

export function EventShiftsCard({
  orgUId,
  eventId,
  shifts,
  canEdit,
}: EventShiftsCardProps) {
  const t = useTranslations('Event.detail.shiftsCard');
  const { formatRange } = useFormatting();

  const addShiftHref = `?sheet=shift-form&eventId=${eventId}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>

        {canEdit && (
          <CardAction>
            <Link href={addShiftHref}>
              <Button
                size="icon-xs"
                variant="outline"
                aria-label={t('addAria')}
              >
                <CalendarPlus />
              </Button>
            </Link>
          </CardAction>
        )}
      </CardHeader>

      <CardContent>
        {shifts.length === 0 ? (
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
                  <Button size="sm">{t('addButton')}</Button>
                </Link>
              </EmptyContent>
            )}
          </Empty>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('table.name')}</TableHead>
                  <TableHead>{t('table.schedule')}</TableHead>
                  <TableHead>{t('table.volunteers')}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {shifts.map((shift) => {
                  const startsAt = new Date(shift.originalStartsAt);
                  const endsAt = new Date(
                    startsAt.getTime() + shift.durationMinutes * 60000,
                  );

                  return (
                    <TableRow key={shift.id}>
                      <TableCell>
                        <Link
                          href={shiftDetailPath(orgUId, shift.id)}
                          className="hover:underline block truncate"
                        >
                          {shift.title}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatRange(startsAt, endsAt)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {volunteersLabel(
                          shift.minVolunteers,
                          shift.maxVolunteers,
                        )}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

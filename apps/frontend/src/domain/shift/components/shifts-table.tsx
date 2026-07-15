import type { GetShiftsQuery } from '@repo/data';
import { formatRrulePattern } from '@repo/data';
import {
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getFormatting } from '@/lib/formatting/formatting-server';
import { shiftDetailPath } from '../routes';
import { ActionBar } from './action-bar';

type ShiftListItem = GetShiftsQuery['shifts']['items'][number];

type ShiftsTableProps = {
  shifts: ShiftListItem[];
  orgUId: string;
  page?: number;
};

export function getVisibilityConfig(t: (key: string) => string) {
  return {
    ALL_MEMBERS: {
      variant: 'outline' as const,
      label: t('visibility.ALL_MEMBERS'),
    },
    INVITED_MEMBERS: {
      variant: 'secondary' as const,
      label: t('visibility.INVITED_MEMBERS'),
    },
  };
}

export async function ShiftsTable({ shifts, orgUId, page }: ShiftsTableProps) {
  const t = await getTranslations('Shift');
  const { formatDate, formatTimeRange } = await getFormatting();
  const visibilityConfig = getVisibilityConfig(t);

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table className="table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead className="w-1/5">{t('table.name')}</TableHead>
            <TableHead>{t('table.firstDate')}</TableHead>
            <TableHead>{t('table.pattern')}</TableHead>
            <TableHead>{t('table.time')}</TableHead>
            <TableHead>{t('table.visibility')}</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shifts.map((shift) => {
            const startDate = new Date(shift.originalStartsAt);
            const endDate = new Date(
              startDate.getTime() + shift.durationMinutes * 60000,
            );

            return (
              <TableRow key={shift.id}>
                <TableCell>
                  <Link
                    className="hover:underline block truncate"
                    href={shiftDetailPath(orgUId, shift.id, {
                      view: 'shifts',
                      ...(page && page > 1 ? { page: String(page) } : {}),
                    })}
                  >
                    {shift.title}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(startDate)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {formatRrulePattern(shift.rrule)}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatTimeRange(startDate, endDate)}
                </TableCell>
                <TableCell>
                  <Badge variant={visibilityConfig[shift.visibility].variant}>
                    {visibilityConfig[shift.visibility].label}
                  </Badge>
                </TableCell>
                <TableCell className="space-x-2">
                  <ActionBar organizationUnitId={orgUId} id={shift.id} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

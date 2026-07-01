import type { GetTimeEntriesQuery } from '@repo/data';
import {
  cn,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useFormatting } from '@/lib/formatting/use-formatting';
import { ActionBar } from './action-bar';

type TimeEntry = GetTimeEntriesQuery['timeEntries']['items'][number];

interface TimesheetsTableProps {
  entries: TimeEntry[];
  organizationUnitId: string;
}

export const TimesheetsTable = ({
  entries,
  organizationUnitId,
}: TimesheetsTableProps) => {
  const t = useTranslations('TimeEntry');
  const { formatRange, formatDuration } = useFormatting();

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('table.shift')}</TableHead>
            <TableHead>{t('table.volunteer')}</TableHead>
            <TableHead>{t('table.time')}</TableHead>
            <TableHead>{t('table.duration')}</TableHead>
            <TableHead className="w-0" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow
              key={entry.id}
              className={cn({ 'bg-muted/80': !entry.endedAt })}
            >
              <TableCell>
                <Link
                  className="hover:underline block"
                  href={`/admin/${organizationUnitId}/timesheets/${entry.id}`}
                >
                  {entry.shiftInstance?.master?.title ??
                    t('table.notAvailable')}
                </Link>
              </TableCell>
              <TableCell>
                {entry.volunteer?.name ??
                  entry.volunteer?.email ??
                  t('table.notAvailable')}
              </TableCell>
              <TableCell>
                {formatRange(entry.startedAt, entry.endedAt, t('format.open'))}
              </TableCell>
              <TableCell>
                {formatDuration(entry.startedAt, entry.endedAt)}
              </TableCell>
              <TableCell>
                <ActionBar
                  id={entry.id}
                  organizationUnitId={organizationUnitId}
                  size="xs"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

'use client';

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
import { format } from 'date-fns';

type TimeEntry = GetTimeEntriesQuery['timeEntries']['items'][number];

interface TimesheetsTableProps {
  entries: TimeEntry[];
  organizationId: string;
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';
  try {
    return format(new Date(dateString), 'MMM d, yyyy');
  } catch {
    return 'Invalid date';
  }
}

function formatTimeRange(entry: TimeEntry): string {
  const start = new Date(entry.startedAt);

  if (entry.endedAt) {
    const end = new Date(entry.endedAt);
    return `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`;
  } else {
    return `${format(start, 'HH:mm')} - open`;
  }
}

function calculateDuration(entry: TimeEntry): string {
  const start = new Date(entry.startedAt);
  const end = entry.endedAt ? new Date(entry.endedAt) : new Date();
  const totalMinutes = (end.getTime() - start.getTime()) / (1000 * 60);

  const hours = Math.max(Math.floor(totalMinutes / 60), 0);
  const minutes = Math.max(Math.floor(totalMinutes % 60), 0);

  return `${hours}h ${minutes}m`;
}

export function TimesheetsTable({ entries }: TimesheetsTableProps) {
  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Shift</TableHead>
            <TableHead>Volunteer</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Duration</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow
              key={entry.id}
              className={cn({ 'bg-muted/80': !entry.endedAt })}
            >
              <TableCell>{entry.shift?.title ?? 'N/A'}</TableCell>
              <TableCell>
                {entry.volunteer?.name ?? entry.volunteer?.email ?? 'N/A'}
              </TableCell>
              <TableCell>{formatDate(entry.startedAt)}</TableCell>
              <TableCell>{formatTimeRange(entry)}</TableCell>
              <TableCell>{calculateDuration(entry)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

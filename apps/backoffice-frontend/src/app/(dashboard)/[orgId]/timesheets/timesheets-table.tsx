'use client';

import type { GetVolunteerSessionsQuery } from '@repo/data';
import {
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui';
import { format } from 'date-fns';
import { TimesheetActionButtons } from './timesheet-action-buttons';

type VolunteerSession = GetVolunteerSessionsQuery['volunteerSessions'][number];

interface TimesheetsTableProps {
  sessions: VolunteerSession[];
  organizationId: string;
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';
  try {
    return format(new Date(dateString), 'MMM d, yyyy');
  } catch {
    return 'Invalid date';
  }
}

function formatTimeRange(entries: VolunteerSession['entries']): string {
  if (!entries || entries.length === 0) return 'No entries';

  const validEntries = entries.filter(
    (e): e is typeof e & { startedAt: string; endedAt: string } =>
      !!e.startedAt && !!e.endedAt,
  );

  if (validEntries.length === 0) return 'No entries';

  const startTimes = validEntries.map((e) => new Date(e.startedAt));
  const endTimes = validEntries.map((e) => new Date(e.endedAt));

  const earliest = new Date(Math.min(...startTimes.map((d) => d.getTime())));
  const latest = new Date(Math.max(...endTimes.map((d) => d.getTime())));

  return `${format(earliest, 'HH:mm')} - ${format(latest, 'HH:mm')}`;
}

function calculateDuration(entries: VolunteerSession['entries']): string {
  if (!entries || entries.length === 0) return '0h 0m';

  const totalMinutes = entries.reduce((total, entry) => {
    if (!entry.startedAt || !entry.endedAt) return total;

    const start = new Date(entry.startedAt);
    const end = new Date(entry.endedAt);
    const minutes = (end.getTime() - start.getTime()) / (1000 * 60);

    return total + minutes;
  }, 0);

  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.floor(totalMinutes % 60);

  return `${hours}h ${minutes}m`;
}

function getSessionDate(session: VolunteerSession): string {
  if (session.entries && session.entries.length > 0) {
    const firstEntry = session.entries[0];
    return formatDate(firstEntry?.startedAt);
  }
  return formatDate(session.createdAt);
}

export function TimesheetsTable({
  sessions,
  organizationId,
}: TimesheetsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Shift</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Volunteer</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.map((session) => (
            <TableRow key={session.id} className="hover:bg-accent/25">
              <TableCell>{session.shift?.title ?? 'N/A'}</TableCell>
              <TableCell>{session.task.project?.title ?? 'N/A'}</TableCell>
              <TableCell>
                {session.user?.name ?? session.user?.email ?? 'N/A'}
              </TableCell>
              <TableCell>{getSessionDate(session)}</TableCell>
              <TableCell>{formatTimeRange(session.entries)}</TableCell>
              <TableCell>{calculateDuration(session.entries)}</TableCell>
              <TableCell>
                <Badge variant="secondary">{session.status}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <TimesheetActionButtons
                  sessionId={session.id}
                  organizationId={organizationId}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

import { Badge, Card, CardContent } from '@repo/ui';
import {
  Calendar,
  CalendarFold,
  Calendars,
  Clock,
  FileText,
  Timer,
  User,
} from 'lucide-react';
import { notFound } from 'next/navigation';
import { ActionBar } from '@/domain/time-entry/components/action-bar';
import { formatDuration, formatTimeRange } from '@/domain/time-entry/formating';
import { getDataClient } from '@/lib/data-client';
import { formatDateTime } from '@/lib/formatting';

interface TimeEntryDetailPageProps {
  params: Promise<{ orgUId: string; timeEntryId: string }>;
}

export default async function TimeEntryDetailPage({
  params,
}: TimeEntryDetailPageProps) {
  const { orgUId, timeEntryId } = await params;

  const data = await getDataClient(orgUId);
  const entry = await data.timeEntry.findById(timeEntryId);

  if (!entry) {
    notFound();
  }

  const isOpen = !entry.endedAt;

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div>
          <h1 className="page-title">Time Entry</h1>
        </div>
        <ActionBar
          id={timeEntryId}
          organizationUnitId={orgUId}
          isOpen={isOpen}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardContent>
              <ul className="space-y-4">
                <li className="flex gap-2">
                  <User className="text-muted-foreground shrink-0" />
                  <span>
                    {entry.volunteer?.name ??
                      entry.volunteer?.email ??
                      'Unknown volunteer'}
                  </span>
                </li>
                <li className="flex gap-2">
                  <Timer className="text-muted-foreground shrink-0" />
                  <span>{formatDuration(entry)}</span>
                </li>
                <li className="flex gap-2">
                  <Calendars className="text-muted-foreground shrink-0" />
                  <span>{formatTimeRange(entry)}</span>
                </li>

                {entry.notes && (
                  <li className="flex gap-2">
                    <FileText className="text-muted-foreground shrink-0" />
                    <span className="whitespace-pre-wrap">{entry.notes}</span>
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>

        <aside>
          <Card>
            <CardContent>
              <dl className="space-y-4">
                <div>
                  <dt className="text-muted-foreground mb-2 flex gap-2 items-center">
                    <Calendar className="size-4 shrink-0" /> Shift
                  </dt>
                  <dd className="ml-6">{entry.shiftInstance?.master?.title}</dd>
                </div>

                <div>
                  <dt className="text-muted-foreground mb-2 flex gap-2 items-center">
                    <CalendarFold className="size-4 shrink-0" /> Status
                  </dt>
                  <dd className="ml-6">
                    {isOpen ? (
                      <Badge variant="info">Open</Badge>
                    ) : (
                      <Badge variant="success">Closed</Badge>
                    )}
                  </dd>
                </div>

                <div>
                  <dt className="text-muted-foreground mb-2 flex gap-2 items-center">
                    <Clock className="size-4 shrink-0" /> Created
                  </dt>
                  <dd className="ml-6">
                    {formatDateTime(new Date(entry.createdAt))}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

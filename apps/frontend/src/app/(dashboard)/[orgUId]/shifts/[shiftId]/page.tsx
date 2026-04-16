import { formatRrulePattern } from '@repo/data';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui';
import {
  Calendar,
  CalendarFold,
  CalendarSync,
  Clock,
  ClockPlus,
  FileText,
  LockKeyholeOpen,
  MapPin,
  User,
  UserPlus,
} from 'lucide-react';
import { notFound } from 'next/navigation';
import { UserCard } from '@/components/user-card';
import { ActionBar } from '@/domain/shift/components/action-bar';
import { visibilityConfig } from '@/domain/shift/components/shifts-table';
import { getDataClient } from '@/lib/data-client';
import { formatDateTime, formatRange } from '@/lib/formatting';

interface ShiftViewPageProps {
  params: Promise<{ orgUId: string; shiftId: string }>;
}

export default async function ShiftViewPage({ params }: ShiftViewPageProps) {
  const { orgUId, shiftId } = await params;

  const data = await getDataClient(orgUId);
  const shift = await data.shift.findById(shiftId);

  if (!shift) {
    notFound();
  }

  const startsAt = new Date(shift.originalStartsAt);
  const endsAt = new Date(startsAt.getTime() + shift.durationMinutes * 60000);
  const isFinished = new Date() > endsAt;

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div>
          <h1 className="page-title">{shift.title}</h1>
          <p className="text-muted-foreground mt-1">
            Shift details and volunteers
          </p>
        </div>
        <ActionBar id={shiftId} organizationUnitId={orgUId} size="sm" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardContent>
              <ul className="space-y-4">
                <li className="flex gap-2">
                  <Calendar className="text-muted-foreground shrink-0" />
                  <span>{formatRange(startsAt, endsAt)}</span>
                </li>
                <li className="flex gap-2">
                  <CalendarSync className="text-muted-foreground shrink-0" />
                  <span>{formatRrulePattern(shift.rrule)}</span>
                </li>
                {shift.location && (
                  <li className="flex gap-2">
                    <MapPin className="text-muted-foreground shrink-0" />
                    <span>{shift.location}</span>
                  </li>
                )}
                {shift.instructions && (
                  <li className="flex gap-2">
                    <FileText className="text-muted-foreground shrink-0" />
                    <span className="whitespace-pre-wrap">
                      {shift.instructions}
                    </span>
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between">
                <span>
                  Volunteers{' '}
                  <Badge variant="outline">
                    x {shift.maxVolunteers && ` of ${shift.maxVolunteers}`}
                  </Badge>
                </span>
                <Button size="xs">
                  <UserPlus /> invite
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>TODO</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between">
                <span>
                  Timesheets <Badge variant="outline">x</Badge>
                </span>
                <Button size="xs">
                  <ClockPlus /> Add time
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>TODO</CardContent>
          </Card>
        </div>

        <aside>
          <Card>
            <CardContent>
              <dl className="space-y-4">
                <div>
                  <dt className="text-muted-foreground mb-2 flex gap-2 items-center">
                    <LockKeyholeOpen className="size-4 shrink-0" /> Visibility
                  </dt>
                  <dd className="ml-6">
                    <Badge variant={visibilityConfig[shift.visibility].variant}>
                      {visibilityConfig[shift.visibility].label}
                    </Badge>
                  </dd>
                </div>

                <div>
                  <dt className="text-muted-foreground mb-2 flex gap-2 items-center">
                    <CalendarFold className="size-4 shrink-0" /> Status
                  </dt>
                  <dd className="ml-6">
                    {isFinished ? (
                      <Badge variant="secondary">Finished</Badge>
                    ) : (
                      <Badge variant="success">Active</Badge>
                    )}
                  </dd>
                </div>

                <div>
                  <dt className="text-muted-foreground mb-2 flex gap-2 items-center">
                    <User className="size-4 shrink-0" /> Created by
                  </dt>
                  <dd className="ml-6">
                    <UserCard user={shift.createdBy} size="sm" hideEmail />
                  </dd>
                </div>

                <div>
                  <dt className="text-muted-foreground mb-2 flex gap-2 items-center">
                    <Clock className="size-4 shrink-0" /> Created
                  </dt>
                  <dd className="ml-6">
                    {formatDateTime(new Date(shift.createdAt))}
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

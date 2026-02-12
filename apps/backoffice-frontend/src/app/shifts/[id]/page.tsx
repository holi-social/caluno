import { type GetShiftQuery, ShiftVisibility } from '@repo/data';
import { Badge, Button, Card, CardContent } from '@repo/ui';
import { Calendar, Clock, DoorOpen, FileText } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getDataClient } from '@/lib/data-client';
import { formatRange } from '@/lib/formatting';
import { UserCard } from '../../../components/user-card';
import { getSession } from '../../../lib/auth-server';

interface ShiftPageProps {
  params: Promise<{ orgSlug: string; id: string }>;
}

const status = (shift: GetShiftQuery['shift']) => {
  if (new Date() > new Date(shift.endsAt)) {
    return 'Finished';
  }

  if (shift.visibility === ShiftVisibility.AllMembers) {
    return 'Open';
  } else {
    return 'Invite Only';
  }
};

export default async function ShiftPage({ params }: ShiftPageProps) {
  const { id } = await params;

  const data = await getDataClient();
  const shift = await data.shift.findById(id);

  // TODO: gate access to shift, based on org and shift access

  if (!shift) {
    notFound();
  }

  return (
    <div className="flex flex-col items-center p-4 mt-8">
      <div className="flex justify-between w-full max-w-2xl py-6 px-2">
        <div>
          <h1 className="text-3xl font-bold">{shift.title}</h1>
          <p className="text-muted-foreground">{shift.project?.title}</p>
        </div>
        <Badge variant="secondary">{status(shift)}</Badge>

        {/* button/s to leave or decline/accept(if invitations are thing) the shift} */}
      </div>

      <div className="w-full max-w-2xl space-y-4">
        <Card>
          <CardContent className="py-4">
            <div className="mb-4">
              <ul className="space-y-3">
                <li className="flex gap-2 items-center">
                  <Calendar className="size-4 text-muted-foreground shrink-0" />
                  <span>{formatRange(shift.startsAt, shift.endsAt)}</span>
                </li>
                <li className="flex gap-2">
                  <FileText className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span>{shift.instructions}</span>
                </li>
              </ul>
            </div>

            <UserCard user={shift.createdBy} />
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <ul className="space-y-2">
              {shift.volunteers?.map((v) => (
                <li key={v.id}>
                  <UserCard user={v} size="sm" />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            {/* If shift has finished, simple button to fill timesheet for whole shift */}
            {/* If it's ended. Then UI might be different */}

            {(await getSession()) ? (
              <div className="space-x-2">
                <Button>
                  <Clock /> Record time
                </Button>
                <Button variant="destructive">
                  <DoorOpen /> Leave shift
                </Button>
              </div>
            ) : (
              <Button>Sign-in</Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

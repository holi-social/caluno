import { type GetShiftQuery, ShiftVisibility } from '@repo/data';
import { Badge, Button, Card, CardContent } from '@repo/ui';
import { Calendar, Clock, DoorOpen, FileText } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getDataClient } from '@/lib/data-client';
import { formatRange } from '@/lib/formatting';
import { UserCard } from '../../../../components/user-card';
import { getSession } from '../../../../lib/auth-server';

interface ShiftPageProps {
  params: Promise<{ shiftId: string }>;
}

const status = (shift: GetShiftQuery['shift']) => {
  if (shift.visibility === ShiftVisibility.AllMembers) {
    return 'Open';
  } else {
    return 'Invite Only';
  }
};

export default async function ShiftPage({ params }: ShiftPageProps) {
  const { shiftId } = await params;

  const data = await getDataClient();
  const shift = await data.shift.findById(shiftId);

  if (!shift) {
    notFound();
  }

  const startDate = new Date(shift.originalStartsAt);
  const endDate = new Date(startDate.getTime() + shift.durationMinutes * 60000);

  return (
    <div className="flex flex-col items-center p-4 mt-8">
      <div className="flex justify-between w-full max-w-2xl py-6 px-2">
        <div>
          <h1 className="page-title">{shift.title}</h1>
        </div>
        <Badge variant="secondary">{status(shift)}</Badge>
      </div>

      <div className="w-full max-w-2xl space-y-4">
        <Card>
          <CardContent className="py-4">
            <div className="mb-4">
              <ul className="space-y-3">
                <li className="flex gap-2 items-center">
                  <Calendar className="size-4 text-muted-foreground shrink-0" />
                  <span>
                    {formatRange(
                      startDate.toISOString(),
                      endDate.toISOString(),
                    )}
                  </span>
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

import { type GetShiftQuery, ShiftVisibility } from '@repo/data';
import { Badge, Button, Card, CardContent } from '@repo/ui';
import { Calendar, Clock, DoorOpen, FileText } from 'lucide-react';
import { notFound, redirect } from 'next/navigation';
import { RequestJoinButton } from '@/domain/shift/components/request-join-button';
import { getDataClient } from '@/lib/data-client';
import { formatRange } from '@/lib/formatting';
import { UserCard } from '../../../../components/user-card';
import { isAuthenticated } from '../../../../lib/auth-server';
import { validateUserOrgAccess } from '../../../../lib/org-context-server';

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

  const authenticated = await isAuthenticated();

  if (!authenticated) {
    const searchParams = new URLSearchParams({
      orgUId: shift.organizationUnitId,
      redirectTo: `/shifts/${shiftId}`,
    });
    redirect(`/api/invite?${searchParams}`);
  }

  const isMember = await validateUserOrgAccess(shift.organizationUnitId);

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

            {shift.createdBy && <UserCard user={shift.createdBy} />}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            {isMember ? (
              <div className="space-x-2">
                <Button>
                  <Clock /> Record time
                </Button>
                <Button variant="destructive">
                  <DoorOpen /> Leave shift
                </Button>
              </div>
            ) : (
              <RequestJoinButton
                organizationUnitId={shift.organizationUnitId}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

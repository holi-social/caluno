import {
  type GetShiftQuery,
  MembershipRequestStatus,
  ShiftVisibility,
} from '@repo/data';
import { Badge, Button, Card, CardContent } from '@repo/ui';
import { Calendar, Clock, DoorOpen, FileText } from 'lucide-react';
import { notFound } from 'next/navigation';
import { UserCard } from '@/components/user-card';
import { JoinShiftButton } from '@/domain/shift/components/join-shift-button';
import { isAuthenticated } from '@/lib/auth-server';
import { getDataClient } from '@/lib/data-client';
import { formatRange } from '@/lib/formatting';
import { validateUserOrgAccess } from '@/lib/org-context-server';

interface ShiftPageProps {
  params: Promise<{ shiftId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const status = (shift: GetShiftQuery['shift']) => {
  if (shift.visibility === ShiftVisibility.AllMembers) {
    return 'Open';
  } else {
    return 'Invite Only';
  }
};

export default async function ShiftPage({
  params,
  searchParams,
}: ShiftPageProps) {
  const { shiftId } = await params;
  const search = await searchParams;
  const autoJoin = search.autoJoin === 'true';

  const data = await getDataClient();
  const shift = await data.shift.findById(shiftId);

  if (!shift) {
    notFound();
  }

  const startDate = new Date(shift.originalStartsAt);
  const endDate = new Date(startDate.getTime() + shift.durationMinutes * 60000);

  const authenticated = await isAuthenticated();
  const isMember = authenticated
    ? await validateUserOrgAccess(shift.organizationUnitId)
    : false;

  const pendingRequest =
    authenticated && !isMember
      ? await data.membershipRequest
          .findMine({ status: MembershipRequestStatus.Pending, limit: 100 })
          .then(
            (res) =>
              res.items.find(
                (r) => r.organizationUnit.id === shift.organizationUnitId,
              ) ?? null,
          )
          .catch(() => null)
      : null;

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
            ) : pendingRequest ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Your membership request for this organization is pending
                  approval. You will be able to join this shift once approved.
                </p>
                <Button disabled>Request sent</Button>
              </div>
            ) : (
              <JoinShiftButton
                shiftId={shiftId}
                visibility={shift.visibility}
                isAuthenticated={authenticated}
                autoJoin={autoJoin}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

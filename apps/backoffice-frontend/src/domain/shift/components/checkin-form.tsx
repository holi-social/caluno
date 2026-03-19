'use client';

import type { ActiveShift, User } from '@repo/data';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { CheckCircle2, UserIcon } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import type { CheckInStatus } from '@/app/(dashboard)/[orgId]/check-in/[checkInId]/page';
import { createTimeEntry } from '@/domain/time-entry/actions';
import { ShiftSelectorCard } from './shift-selector-card';

type CheckinFormProps = {
  organizationId: string;
  volunteer: User;
  shifts: ActiveShift[];
  status: CheckInStatus;
};

export const CheckinForm = ({
  volunteer,
  organizationId,
  shifts,
  status,
}: CheckinFormProps) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [selectedShiftId, setSelectedShiftId] = useState<string | undefined>(
    shifts.length === 1 ? shifts[0]?.id : undefined,
  );
  const [serverError, setServerError] = useState<string | null>(null);

  const handleCheckin = () => {
    setServerError(null);

    startTransition(async () => {
      if (!selectedShiftId) {
        toast.warning('No shift selected');
        return;
      }

      const result = await createTimeEntry({
        volunteerId: volunteer.id,
        startedAt: new Date().toISOString(),
        shiftId: selectedShiftId,
      });

      if (result?.serverError) {
        setServerError(result.serverError);
      } else {
        // TODO: prolly need a prompt, so they get clearer confirmation that the volunteer was checked and then they can move on to checking in another,
        // or not. DO we block them and ask for a click or just take them to check-in again ?
        toast.success('Volunteer checked-in');
        router.push(`/${organizationId}/check-in/scan`);
      }
    });
  };

  const canCheckin = status === 'valid' && selectedShiftId;

  return (
    <div className="space-y-4">
      {serverError && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive mb-4">
          {serverError}
        </div>
      )}

      <Card className="p-4 gap-2">
        <CardHeader className="px-0">
          <CardTitle>
            {volunteer.name}{' '}
            <span className="font-light">({volunteer.email})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          {volunteer.image ? (
            <Image src={volunteer.image} alt="Volunteers profile photo" />
          ) : (
            <div className="border-8 rounded-2xl inline-block">
              <UserIcon className="size-72 max-w-full text-accent/90" />
            </div>
          )}
        </CardContent>
      </Card>
      <div className="grid grid-cols-2 gap-4">
        <Card className="gap-2">
          <CardHeader>
            <CardTitle>Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <CheckCircle2 className="text-green-500" /> All met
            </div>
          </CardContent>
        </Card>
        <Card className="gap-2">
          <CardHeader>
            <CardTitle>Shift</CardTitle>
          </CardHeader>
          <CardContent>
            <ShiftSelectorCard
              shifts={shifts}
              organizationId={organizationId}
              onChange={setSelectedShiftId}
              value={selectedShiftId}
            />
          </CardContent>
        </Card>
      </div>

      <Button
        size="lg"
        className="w-full"
        disabled={!canCheckin}
        onClick={handleCheckin}
        type="button"
      >
        {isPending ? 'Checking-in...' : 'Check-in'}
      </Button>
    </div>
  );
};

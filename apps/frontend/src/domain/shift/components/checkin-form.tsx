'use client';

import type { ActiveShift, User } from '@repo/data';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { CheckCircle2, PlaneTakeoff, UserIcon } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import type { CheckInStatus } from '@/app/[locale]/admin/[orgUId]/check-in/[checkInId]/check-in/page';
import { createTimeEntry } from '@/domain/time-entry/actions';
import { useRouter } from '@/i18n/navigation';
import { UserCard } from '../../../components/user-card';
import { ShiftSelector } from './shift-selector';

type CheckinFormProps = {
  organizationUnitId: string;
  volunteer: User;
  shifts: ActiveShift[];
  status: CheckInStatus;
};

export const CheckinForm = ({
  volunteer,
  organizationUnitId,
  shifts,
  status,
}: CheckinFormProps) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations('Shift');
  const [selectedShiftId, setSelectedShiftId] = useState<string | undefined>(
    shifts.length === 1 ? shifts[0]?.id : undefined,
  );
  const [serverError, setServerError] = useState<string | null>(null);

  const handleCheckin = () => {
    setServerError(null);

    startTransition(async () => {
      if (!selectedShiftId) {
        toast.warning(t('checkIn.noShiftSelected'));
        return;
      }

      const result = await createTimeEntry({
        organizationUnitId,
        volunteerId: volunteer.id,
        startedAt: new Date(),
        endedAt: null,
        shiftInstanceId: selectedShiftId,
      });

      if (result?.serverError) {
        setServerError(result.serverError);
      } else {
        // TODO: prolly need a prompt, so they get clearer confirmation that the volunteer was checked and then they can move on to checking in another,
        // or not. DO we block them and ask for a click or just take them to check-in again ?
        toast.success(t('checkIn.volunteerCheckedIn'));
        router.push(`/admin/${organizationUnitId}/check-in/scan`);
      }
    });
  };

  const canCheckin = status === 'valid' && selectedShiftId;

  return (
    <div className="space-y-6">
      {serverError && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive mb-4">
          {serverError}
        </div>
      )}

      <ShiftSelector
        shifts={shifts}
        organizationUnitId={organizationUnitId}
        onChange={setSelectedShiftId}
        value={selectedShiftId}
      />

      <UserCard user={volunteer} size="lg" />

      <div className="mt-2 fixed bottom-0 left-4 right-4 z-50 pb-[calc(1rem+env(safe-area-inset-bottom))] md:static md:w-full">
        <Button
          size="lg"
          disabled={!canCheckin || isPending}
          onClick={handleCheckin}
          className="w-full"
          type="button"
        >
          <PlaneTakeoff />{' '}
          {isPending ? t('checkIn.checkingIn') : t('checkIn.checkIn')}
        </Button>
      </div>
    </div>
  );
};

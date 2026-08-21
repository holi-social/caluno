'use client';

import type { ActiveShiftInstance, User } from '@repo/data';
import {
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from '@repo/ui';
import { Check, ScanQrCode, SkipForward } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import type { CheckInStatus } from '@/app/[locale]/admin/[orgUId]/check-in/[checkInId]/check-in/page';
import { createTimeEntry } from '@/domain/time-entry/actions';
import { useRouter } from '@/i18n/navigation';
import { UserCard } from '../../../components/user-card';
import { ShiftSelectItem, ShiftSelector } from './shift-selector';

type CheckinFormProps = {
  organizationUnitId: string;
  volunteer: User;
  shifts: ActiveShiftInstance[];
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
  const [serverError, setServerError] = useState<string | null>(null);
  const [selectedShiftId, setSelectedShiftId] = useState(shifts[0]?.id);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [checkInMode, setCheckInMode] = useState<'shift' | 'none'>(
    shifts.length > 0 ? 'shift' : 'none',
  );

  const handleCheckin = () => {
    setServerError(null);

    startTransition(async () => {
      if (checkInMode === 'shift' && !selectedShiftId) {
        toast.warning(t('checkIn.noShiftSelected'));
        return;
      }

      const result = await createTimeEntry({
        organizationUnitId,
        volunteerId: volunteer.id,
        startedAt: new Date(),
        endedAt: null,
        shiftInstanceId: checkInMode === 'shift' ? selectedShiftId : undefined,
      });

      if (result?.serverError) {
        setServerError(result.serverError);
      } else {
        toast.success(t('checkIn.volunteerCheckedIn'));
        setSuccessDialogOpen(true);
      }
    });
  };

  const handleNextCheckin = () =>
    router.push(`/admin/${organizationUnitId}/check-in/scan`);

  const selectedShift = shifts.find((s) => s.id === selectedShiftId);
  const canCheckin =
    status === 'valid' && (checkInMode === 'none' || !!selectedShiftId);

  return (
    <>
      <div className="space-y-6">
        {serverError && (
          <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive mb-4">
            {serverError}
          </div>
        )}

        <button
          type="button"
          className="text-sm underline text-muted-foreground"
          onClick={() =>
            setCheckInMode((mode) => (mode === 'shift' ? 'none' : 'shift'))
          }
        >
          {checkInMode === 'shift'
            ? t('checkIn.checkInWithoutShift')
            : t('checkIn.checkInWithShift')}
        </button>

        {checkInMode === 'shift' && (
          <ShiftSelector
            shifts={shifts}
            organizationUnitId={organizationUnitId}
            onChange={setSelectedShiftId}
            value={selectedShiftId}
          />
        )}

        <UserCard user={volunteer} size="lg" />

        <div className="mt-2 fixed bottom-0 left-4 right-4 z-50 pb-[calc(1rem+env(safe-area-inset-bottom))] md:static md:w-full">
          <Button
            size="lg"
            disabled={!canCheckin || isPending}
            onClick={handleCheckin}
            className="w-full"
            type="button"
          >
            <ScanQrCode />{' '}
            {isPending ? t('checkIn.checkingIn') : t('checkIn.checkIn')}
          </Button>
        </div>
      </div>

      <Dialog open={successDialogOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader className="flex items-center justify-center p-4">
            <div className="bg-primary rounded-full p-6 text-primary-foreground">
              <Check className="size-32" />
            </div>
          </DialogHeader>

          <div className="min-w-0 space-y-4">
            <UserCard user={volunteer} size="lg" />
            {checkInMode === 'shift' && selectedShift && (
              <Card className="p-2 bg-accent mb-6">
                <ShiftSelectItem shift={selectedShift} />
              </Card>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleNextCheckin}>
              <SkipForward /> {t('checkIn.successNext')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

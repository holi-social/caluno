'use client';

import { Button } from '@repo/ui';
import { Timer } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { closeTimeEntry } from '@/domain/time-entry/actions';
import { useRouter } from '@/i18n/navigation';

type CheckinFormProps = {
  organizationUnitId: string;
  timeEntryId: string;
};

export const CheckOutButton = ({
  organizationUnitId,
  timeEntryId,
}: CheckinFormProps) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations('Shift');

  const [serverError, setServerError] = useState<string | null>(null);

  const handleCheckin = () => {
    setServerError(null);

    startTransition(async () => {
      const result = await closeTimeEntry({
        id: timeEntryId,
        organizationUnitId,
        endedAt: new Date(),
      });

      if (result?.serverError) {
        setServerError(result.serverError);
      } else {
        toast.success(t('checkIn.volunteerCheckedOut'));
        router.push('/check-in');
      }
    });
  };

  return (
    <div className="space-y-4">
      {serverError && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive mb-4">
          {serverError}
        </div>
      )}

      <Button
        size="lg"
        className="w-full"
        disabled={isPending}
        onClick={handleCheckin}
        type="button"
      >
        <Timer /> {isPending ? t('checkIn.checkingOut') : t('checkIn.checkOut')}
      </Button>
    </div>
  );
};

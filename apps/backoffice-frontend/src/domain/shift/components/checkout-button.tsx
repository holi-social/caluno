'use client';

import { Button } from '@repo/ui';
import { Timer } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { closeTimeEntry } from '@/domain/time-entry/actions';

type CheckinFormProps = {
  organizationId: string;
  timeEntryId: string;
};

export const CheckOutButton = ({
  organizationId,
  timeEntryId,
}: CheckinFormProps) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [serverError, setServerError] = useState<string | null>(null);

  const handleCheckin = () => {
    setServerError(null);

    startTransition(async () => {
      const result = await closeTimeEntry({
        id: timeEntryId,
        endedAt: new Date(),
      });

      if (result?.serverError) {
        setServerError(result.serverError);
      } else {
        toast.success('Volunteer checked-out');
        router.push(`/${organizationId}/check-in/scan`);
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
        <Timer /> {isPending ? 'Checking-out...' : 'Check-out'}
      </Button>
    </div>
  );
};

'use client';

import { useOrgId } from '@repo/data/react';
import { useState, useTransition } from 'react';
import { createShift } from '../actions';
import type { ShiftFormValues } from '../schemas';
import { ShiftForm } from './shift-form';

interface CreateShiftFormProps {
  onSuccess?: (shiftId: string) => void;
}

export function CreateShiftForm({ onSuccess }: CreateShiftFormProps = {}) {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const orgId = useOrgId();

  const onSubmit = async (formData: ShiftFormValues) => {
    setServerError(null);

    startTransition(async () => {
      const result = await createShift(formData);
      if (result?.serverError) {
        setServerError(result.serverError);
      } else {
        onSuccess?.(result.data?.id ?? '');
      }
    });
  };

  return (
    <>
      {serverError && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive mb-4">
          {serverError}
        </div>
      )}

      <ShiftForm
        organizationId={orgId}
        onSubmit={onSubmit}
        isPending={isPending}
      />
    </>
  );
}

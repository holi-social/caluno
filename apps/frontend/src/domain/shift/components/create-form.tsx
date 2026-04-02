'use client';

import { useCurrentOrg, useOrgUId } from '@repo/data/react';
import { useState, useTransition } from 'react';
import { useSheet } from '@/hooks/use-sheet';
import { createShift } from '../actions';
import type { ShiftFormValues } from '../schemas';
import { ShiftForm } from './shift-form';

interface CreateShiftFormProps {
  onCancel?: () => void;
}

export function CreateShiftForm({ onCancel }: CreateShiftFormProps) {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const orgUId = useOrgUId();
  const { address } = useCurrentOrg();
  const inviteSheet = useSheet('invite-shift', 'id');

  const onSubmit = (formData: ShiftFormValues) => {
    setServerError(null);
    startTransition(async () => {
      const result = await createShift({ ...formData, invitedMemberIds: [] });
      if (result?.serverError) {
        setServerError(result.serverError);
      } else {
        const shiftId = result?.data?.id;
        if (shiftId) {
          inviteSheet.open({ id: shiftId });
        }
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
        organizationUnitId={orgUId}
        onSubmit={onSubmit}
        onCancel={onCancel}
        isPending={isPending}
        submitLabel="Create shift"
        defaultLocation={address ?? ''}
      />
    </>
  );
}

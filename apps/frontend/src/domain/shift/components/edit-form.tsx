'use client';

import { type GetShiftQuery, ShiftVisibility } from '@repo/data/react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { updateShift } from '../actions';
import type { ShiftFormValues } from '../schemas';
import { ShiftForm } from './shift-form';

interface EditShiftFormProps {
  orgUId: string;
  shift: GetShiftQuery['shift'];
}

export function EditShiftForm({ orgUId, shift }: EditShiftFormProps) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const onSubmit = async (formData: ShiftFormValues) => {
    setServerError(null);

    startTransition(async () => {
      const result = await updateShift({
        ...formData,
        ...{
          id: shift.id,
        },
      });
      if (result?.serverError) {
        setServerError(result.serverError);
      } else {
        router.push(`/${orgUId}/shifts`);
      }
    });
  };

  const shiftFormValues = {
    organizationUnitId: orgUId,
    name: shift.title,
    instructions: shift.instructions || undefined,
    location: shift.location || undefined,
    startsAt: new Date(shift.startsAt),
    endsAt: new Date(shift.endsAt),
    openShift: shift.visibility === ShiftVisibility.AllMembers,
    invitedMemberIds: shift.volunteers?.map((v) => v.id),
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
        isPending={isPending}
        initialValues={shiftFormValues}
      />
    </>
  );
}

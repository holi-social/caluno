'use client';

import { ShiftVisibility, useShift } from '@repo/data/react';
import { useMemo, useState, useTransition } from 'react';
import { updateShift } from '../actions';
import type { ShiftFormValues } from '../schemas';
import { ShiftForm } from './shift-form';

interface EditShiftFormProps {
  orgUId: string;
  shiftId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EditShiftForm({
  orgUId,
  shiftId,
  onSuccess,
  onCancel,
}: EditShiftFormProps) {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const { data: shift, error, isLoading } = useShift(shiftId);

  const initialValues = useMemo<Partial<ShiftFormValues>>(() => {
    if (!shift) {
      return {
        organizationUnitId: orgUId,
        name: '',
        instructions: undefined,
        location: undefined,
        startsAt: new Date(),
        endsAt: new Date(),
        openShift: true,
        invitedMemberIds: [],
        maxVolunteers: undefined,
        recurrenceDays: [],
        recurrenceEndsAt: undefined,
      };
    }

    return {
      organizationUnitId: orgUId,
      name: shift.title,
      instructions: shift.instructions ?? undefined,
      location: shift.location ?? undefined,
      startsAt: shift.startDate,
      endsAt: shift.endDate,
      openShift: shift.visibility === ShiftVisibility.AllMembers,
      invitedMemberIds: [],
      maxVolunteers: shift.maxVolunteers ?? undefined,
      recurrenceDays: shift.recurrenceDays,
      recurrenceEndsAt: shift.recurrenceEndsAt,
    };
  }, [shift, orgUId]);

  const onSubmit = (formData: ShiftFormValues) => {
    setServerError(null);
    startTransition(async () => {
      if (shift?.id) {
        const result = await updateShift({
          ...formData,
          id: shift.id,
          maxVolunteers: formData.maxVolunteers ?? null,
        });
        if (result?.serverError) {
          setServerError(result.serverError);
        } else {
          onSuccess?.();
        }
      }
    });
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  if (error || !shift) {
    return <p className="text-sm text-muted-foreground">Shift not found.</p>;
  }

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
        submitLabel="Save changes"
        initialValues={initialValues}
      />
    </>
  );
}

'use client';

import { ShiftVisibility, useShift } from '@repo/data/react';
import { useState, useTransition } from 'react';
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

  const onSubmit = (formData: ShiftFormValues) => {
    setServerError(null);
    startTransition(async () => {
      if (shift?.id) {
        const result = await updateShift({ ...formData, id: shift.id });
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

  const initialValues: Partial<ShiftFormValues> = {
    organizationUnitId: orgUId,
    name: shift.title,
    instructions: shift.instructions ?? undefined,
    location: shift.location ?? undefined,
    startsAt: new Date(shift.startsAt),
    endsAt: new Date(shift.endsAt),
    openShift: shift.visibility === ShiftVisibility.AllMembers,
    invitedMemberIds: shift.volunteers?.map((v) => v.id) ?? [],
    maxVolunteers: shift.maxVolunteers ?? undefined,
    recurrenceDays:
      (shift.recurrenceRule?.daysOfWeek as ShiftFormValues['recurrenceDays']) ??
      [],
    recurrenceEndsAt: shift.recurrenceRule?.endsAt
      ? new Date(shift.recurrenceRule.endsAt)
      : undefined,
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
        submitLabel="Save changes"
        initialValues={initialValues}
      />
    </>
  );
}

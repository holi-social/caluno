'use client';

import { ShiftVisibility, useQueryClient, useShift } from '@repo/data/react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { updateShift } from '../actions';
import type { ShiftFormValues } from '../schemas';
import { ShiftForm } from './shift-form';

interface EditShiftFormProps {
  orgUId: string;
  shiftId: string;
  onSuccess?: () => void;
  onPendingChange?: (isPending: boolean) => void;
  formId?: string;
}

export function EditShiftForm({
  orgUId,
  shiftId,
  onSuccess,
  onPendingChange,
  formId,
}: EditShiftFormProps) {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const { data: shift, error, isLoading } = useShift(shiftId);
  const queryClient = useQueryClient();
  const t = useTranslations('Shift');

  useEffect(() => {
    onPendingChange?.(isPending);
  }, [isPending, onPendingChange]);

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
        });
        if (result?.serverError) {
          setServerError(result.serverError);
        } else {
          await queryClient.invalidateQueries({
            queryKey: ['shift', shift.id],
          });
          onSuccess?.();
        }
      }
    });
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{t('loading')}</p>;
  }

  if (error || !shift) {
    return <p className="text-sm text-muted-foreground">{t('notFound')}</p>;
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
        isPending={isPending}
        initialValues={initialValues}
        formId={formId}
      />
    </>
  );
}

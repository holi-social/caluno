'use client';

import { useQueryClient, useShift, useShiftInstances } from '@repo/data/react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { updateShiftInstance } from '../actions';
import type { ShiftInstanceFormValues } from '../schemas';
import { ShiftInstanceForm } from './shift-instance-form';

interface EditShiftInstanceFormProps {
  orgUId: string;
  shiftId: string;
  instanceId: string;
  onSuccess?: () => void;
  onPendingChange?: (isPending: boolean) => void;
  formId?: string;
}

export function EditShiftInstanceForm({
  orgUId,
  shiftId,
  instanceId,
  onSuccess,
  onPendingChange,
  formId,
}: EditShiftInstanceFormProps) {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const { data: shift, error: shiftError, isLoading: isShiftLoading } =
    useShift(shiftId);
  const {
    data: instances,
    error: instancesError,
    isLoading: isInstancesLoading,
  } = useShiftInstances(shiftId);
  const queryClient = useQueryClient();
  const t = useTranslations('Shift');
  const tInstance = useTranslations('ShiftInstanceDetail');

  const instance = instances?.find((item) => item.id === instanceId);

  useEffect(() => {
    onPendingChange?.(isPending);
  }, [isPending, onPendingChange]);

  const initialValues = useMemo<Partial<ShiftInstanceFormValues>>(() => {
    if (!shift || !instance) {
      return {
        name: '',
        location: '',
        instructions: '',
        startsAt: new Date(),
        endsAt: new Date(),
      };
    }

    return {
      name: instance.overrideTitle ?? shift.title,
      location: instance.overrideLocation ?? shift.location ?? '',
      instructions:
        instance.overrideInstructions ?? shift.instructions ?? '',
      startsAt: new Date(instance.actualStartsAt),
      endsAt: new Date(instance.actualEndsAt),
    };
  }, [shift, instance]);

  const onSubmit = (formData: ShiftInstanceFormValues) => {
    setServerError(null);
    startTransition(async () => {
      const result = await updateShiftInstance({
        ...formData,
        instanceId,
        organizationUnitId: orgUId,
      });

      if (result?.serverError) {
        setServerError(result.serverError);
      } else {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['shiftInstances', shiftId] }),
          queryClient.invalidateQueries({ queryKey: ['shift', shiftId] }),
          queryClient.invalidateQueries({
            queryKey: ['shiftVolunteers', instanceId],
          }),
        ]);
        onSuccess?.();
      }
    });
  };

  if (isShiftLoading || isInstancesLoading) {
    return <p className="text-sm text-muted-foreground">{t('loading')}</p>;
  }

  if (shiftError || instancesError || !shift || !instance) {
    return (
      <p className="text-sm text-muted-foreground">{tInstance('notFound')}</p>
    );
  }

  return (
    <>
      {serverError && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive mb-4">
          {serverError}
        </div>
      )}
      <ShiftInstanceForm
        key={instanceId}
        onSubmit={onSubmit}
        isPending={isPending}
        initialValues={initialValues}
        formId={formId}
      />
    </>
  );
}

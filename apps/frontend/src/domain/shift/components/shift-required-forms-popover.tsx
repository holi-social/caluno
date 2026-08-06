'use client';

import { PermissionKey } from '@repo/data';
import {
  useHasPermission,
  useOrganizationUnitWithSuspense,
  useRequirementForms,
  useSetShiftRequiredForms,
  useShift,
} from '@repo/data/react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { toast } from 'sonner';
import { RequiredFormsPopover } from '@/components/required-forms-popover';

interface ShiftRequiredFormsPopoverProps {
  orgUId: string;
  shiftId: string;
}

export function ShiftRequiredFormsPopover({
  orgUId,
  shiftId,
}: ShiftRequiredFormsPopoverProps) {
  const t = useTranslations('Shift.detail.requiredForms');
  const commonT = useTranslations('Common');

  const canConfigure = useHasPermission([PermissionKey.ShiftEdit]);

  const { data: orgUnit } = useOrganizationUnitWithSuspense(orgUId);
  const { data: shift } = useShift(shiftId);
  const { data: formsData, refetch } = useRequirementForms(
    orgUnit?.organizationId ?? '',
  );

  const setShiftRequiredForms = useSetShiftRequiredForms();

  const requiredForms = shift?.requiredForms ?? [];

  const attachedFormIds = useMemo(
    () => new Set(requiredForms.map((ref) => ref.form.id)),
    [requiredForms],
  );

  const availableForms = useMemo(
    () =>
      (formsData?.items ?? []).filter((form) => !attachedFormIds.has(form.id)),
    [formsData, attachedFormIds],
  );

  const handleChange = async (formIds: string[]) => {
    try {
      const previousCount = requiredForms.length;
      await setShiftRequiredForms.mutateAsync({
        shiftId,
        formIds,
      });
      toast.success(
        formIds.length > previousCount ? t('addedToast') : t('removedToast'),
      );
      return true;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('updateFailedToast'),
      );
      return false;
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen && orgUnit?.organizationId) {
      void refetch();
    }
  };

  return (
    <RequiredFormsPopover
      requiredForms={requiredForms}
      availableForms={availableForms}
      onChange={handleChange}
      isPending={setShiftRequiredForms.isPending}
      disabled={!canConfigure}
      createNewHref={`/admin/${orgUId}/requirement-forms/new`}
      t={t}
      subtitle={t('subtitle', {
        brand: commonT('brand'),
        shiftTitle: shift?.title ?? '',
      })}
      onOpenChange={handleOpenChange}
    />
  );
}

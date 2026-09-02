'use client';

import { PermissionKey } from '@repo/data';
import {
  useHasPermission,
  useOrganizationUnitWithSuspense,
  useRequirementForms,
  useSetRequiredForms,
} from '@repo/data/react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { toast } from 'sonner';
import { RequiredFormsPopover } from '@/components/required-forms-popover';

interface VolunteerRequiredFormsPopoverProps {
  orgUId: string;
}

export function VolunteerRequiredFormsPopover({
  orgUId,
}: VolunteerRequiredFormsPopoverProps) {
  const t = useTranslations('Volunteer.requiredForms');
  const commonT = useTranslations('Common');

  const canConfigure = useHasPermission([
    PermissionKey.OrgEdit,
    PermissionKey.RequirementProfileEdit,
  ]);

  const { data: orgUnit } = useOrganizationUnitWithSuspense(orgUId);
  const { data: formsData, refetch } = useRequirementForms(
    orgUnit?.organizationId ?? '',
  );

  const setRequiredForms = useSetRequiredForms();

  const requiredForms = orgUnit?.requiredForms ?? [];

  const attachedFormIds = useMemo(
    () => new Set(requiredForms.map((ref) => ref.form.id)),
    [requiredForms],
  );

  const availableForms = useMemo(
    () =>
      (formsData?.items ?? []).filter((form) => !attachedFormIds.has(form.id)),
    [formsData, attachedFormIds],
  );

  const disabledFormIds = useMemo(
    () =>
      new Set(
        (formsData?.items ?? [])
          .filter((form) => (form.blockRefs?.length ?? 0) === 0)
          .map((form) => form.id),
      ),
    [formsData],
  );

  const handleChange = async (formIds: string[]) => {
    try {
      const previousCount = requiredForms.length;
      await setRequiredForms.mutateAsync({
        organizationUnitId: orgUId,
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
      isPending={setRequiredForms.isPending}
      disabled={!canConfigure}
      disabledFormIds={disabledFormIds}
      createNewHref={`/admin/${orgUId}/requirement-forms/new`}
      t={t}
      subtitle={t('subtitle', {
        brand: commonT('brand'),
        unitName: orgUnit?.name ?? '',
      })}
      onOpenChange={handleOpenChange}
    />
  );
}

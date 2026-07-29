'use client';

import { PermissionKey } from '@repo/data';
import {
  useEvent,
  useHasPermission,
  useOrganizationUnitWithSuspense,
  useRequirementForms,
  useSetEventRequiredForms,
} from '@repo/data/react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { toast } from 'sonner';
import { RequiredFormsPopover } from '@/components/required-forms-popover';

interface EventRequiredFormsPopoverProps {
  orgUId: string;
  eventId: string;
}

export function EventRequiredFormsPopover({
  orgUId,
  eventId,
}: EventRequiredFormsPopoverProps) {
  const t = useTranslations('Event.detail.requiredForms');
  const commonT = useTranslations('Common');

  const canConfigure = useHasPermission([PermissionKey.ShiftEdit]);

  const { data: orgUnit } = useOrganizationUnitWithSuspense(orgUId);
  const { data: event } = useEvent(eventId);
  const { data: formsData, refetch } = useRequirementForms(
    orgUnit?.organizationId ?? '',
  );

  const setEventRequiredForms = useSetEventRequiredForms();

  const requiredForms = event?.requiredForms ?? [];

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
      await setEventRequiredForms.mutateAsync({
        eventId,
        formIds,
      });
      toast.success(
        formIds.length > previousCount ? t('addedToast') : t('removedToast'),
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('updateFailedToast'),
      );
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
      isPending={setEventRequiredForms.isPending}
      disabled={!canConfigure}
      createNewHref={`/admin/${orgUId}/requirement-forms/new`}
      t={t}
      subtitle={t('subtitle', {
        brand: commonT('brand'),
        eventTitle: event?.title ?? '',
      })}
      onOpenChange={handleOpenChange}
    />
  );
}

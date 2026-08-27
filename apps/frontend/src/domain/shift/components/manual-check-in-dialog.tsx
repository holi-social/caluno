'use client';

import {
  useMyCheckInOrgUnits,
  useOrganizationVolunteers,
} from '@repo/data/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { CheckInSelector } from './check-in-selector';

interface ManualCheckInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManualCheckInDialog({
  open,
  onOpenChange,
}: ManualCheckInDialogProps) {
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  // fix for Combobox popup to be rendered inside the dialog content, so it is clickable
  const [dialogContentEl, setDialogContentEl] = useState<HTMLDivElement | null>(
    null,
  );
  const tCheckIn = useTranslations('CheckIn');

  const { data: orgUnits } = useMyCheckInOrgUnits({ enabled: open });
  const resolvedOrgId =
    orgUnits?.length === 1 ? (orgUnits[0]?.id ?? null) : selectedOrgId;

  const { data: volunteers } = useOrganizationVolunteers(resolvedOrgId ?? '');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent ref={setDialogContentEl}>
        <DialogHeader>
          <DialogTitle>{tCheckIn('manualCheckin')}</DialogTitle>
        </DialogHeader>

        {!resolvedOrgId && orgUnits && orgUnits.length > 1 && (
          <div className="space-y-2">
            {orgUnits.map((org) => (
              <button
                key={org.id}
                type="button"
                className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-accent"
                onClick={() => setSelectedOrgId(org.id)}
              >
                {org.name}
              </button>
            ))}
          </div>
        )}

        {resolvedOrgId && (
          <CheckInSelector
            volunteers={volunteers ?? []}
            organizationUnitId={resolvedOrgId}
            portalContainer={dialogContentEl}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

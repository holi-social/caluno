'use client';

import { useSetMembershipIdVerified } from '@repo/data/react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Toggle,
} from '@repo/ui';
import { IdCard } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

interface IdVerificationToggleProps {
  membershipId: string;
  verified: boolean;
}

/**
 * Two-way admin toggle for a membership's ID verification. The Toggle state
 * is derived from the memberships query (invalidated on success) — no
 * optimistic flip, so the UI never claims a verified state the server
 * rejected. Un-verifying goes through a confirmation dialog.
 */
export function IdVerificationToggle({
  membershipId,
  verified,
}: IdVerificationToggleProps) {
  const t = useTranslations('Volunteer.sheet.idVerification');
  const mutation = useSetMembershipIdVerified();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const setVerified = async (next: boolean) => {
    try {
      await mutation.mutateAsync({ membershipId, verified: next });
    } catch {
      toast.error(t('updateError'));
    }
  };

  const handlePressedChange = (next: boolean) => {
    if (next) {
      void setVerified(true);
    } else {
      setConfirmOpen(true);
    }
  };

  const label = t('label', { status: verified ? 'verified' : 'unverified' });

  return (
    <div className="flex items-center gap-2">
      <Toggle
        variant="default"
        pressed={verified}
        disabled={mutation.isPending}
        onPressedChange={handlePressedChange}
        aria-label={label}
      >
        <IdCard className="h-4 w-4 shrink-0" />
        {label}
      </Toggle>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('unverifyTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('unverifyDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('unverifyCancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => void setVerified(false)}>
              {t('unverifyConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

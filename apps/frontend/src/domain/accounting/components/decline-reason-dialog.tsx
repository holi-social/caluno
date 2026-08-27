'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Label,
  Textarea,
} from '@repo/ui';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

interface DeclineReasonDialogProps {
  open: boolean;
  docTypeLabel: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
}

export function DeclineReasonDialog({
  open,
  docTypeLabel,
  onOpenChange,
  onConfirm,
}: DeclineReasonDialogProps) {
  const t = useTranslations('Accounting.reimbursements.docs.declineDialog');
  const tCommon = useTranslations('Common');
  const [reason, setReason] = useState('');

  function handleOpenChange(next: boolean) {
    if (!next) setReason('');
    onOpenChange(next);
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg">
            {t('title', { docType: docTypeLabel })}
          </AlertDialogTitle>
          <AlertDialogDescription>{t('description')}</AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <Label htmlFor="decline-reason">{t('reasonLabel')}</Label>
          <Textarea
            id="decline-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('reasonPlaceholder')}
            rows={4}
          />
        </div>

        <AlertDialogFooter className="flex-col sm:flex-col sm:items-stretch">
          <AlertDialogAction
            variant="destructive"
            className="w-full"
            disabled={reason.trim().length === 0}
            onClick={() => {
              onConfirm(reason.trim());
              setReason('');
            }}
          >
            {t('submit')}
          </AlertDialogAction>
          <AlertDialogCancel variant="ghost" className="w-full">
            {tCommon('cancel')}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

'use client';

import {
  Button,
  Label,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Textarea,
} from '@repo/ui';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

interface VolunteerDocumentDeclineSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Document name shown in the sheet title, e.g. "Stundennachweis". */
  documentName: string;
  onConfirm: (reason: string) => void;
}

/**
 * The volunteer's decline sheet ("Dokument ablehnen") — a mobile-first
 * bottom sheet with one required reason field. Decline without a written
 * reason is impossible: the confirm button stays disabled until the field
 * has text, mirroring the coordinator's side.
 */
export function VolunteerDocumentDeclineSheet({
  open,
  onOpenChange,
  documentName,
  onConfirm,
}: VolunteerDocumentDeclineSheetProps) {
  const t = useTranslations('MembershipDetail.documents.declineSheet');
  const tCommon = useTranslations('Common');
  const [reason, setReason] = useState('');

  function handleOpenChange(next: boolean) {
    if (!next) setReason('');
    onOpenChange(next);
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="mx-auto w-full max-w-md rounded-t-2xl p-6 pb-8"
      >
        <SheetHeader className="mb-4 text-left">
          <SheetTitle className="text-lg">{t('title')}</SheetTitle>
        </SheetHeader>

        <p className="mb-4 text-sm text-muted-foreground">
          {t('description', { documentName })}
        </p>

        <div className="space-y-2">
          <Label htmlFor="volunteer-decline-reason">{t('reasonLabel')}</Label>
          <Textarea
            id="volunteer-decline-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('reasonPlaceholder')}
            rows={4}
            autoFocus
          />
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <Button
            variant="destructive"
            className="w-full"
            disabled={reason.trim().length === 0}
            onClick={() => {
              onConfirm(reason.trim());
              setReason('');
            }}
          >
            {t('submit')}
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            {tCommon('cancel')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

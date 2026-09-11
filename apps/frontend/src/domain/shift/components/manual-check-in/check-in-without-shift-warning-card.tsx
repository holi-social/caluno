'use client';

import { Card, CardContent } from '@repo/ui';
import { Info } from 'lucide-react';
import { useTranslations } from 'next-intl';

/**
 * Informational warning shown while "Check in without shift" is active.
 * Lists the organizational consequences of a shiftless time entry so the
 * check-in is a deliberate decision. Never blocks the check-in button.
 */
export function CheckInWithoutShiftWarningCard() {
  const t = useTranslations('CheckIn');

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-6">
        <div className="flex items-center gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Info className="size-5" />
          </div>
          <p className="font-semibold">{t('shiftlessWarningTitle')}</p>
        </div>
        <ul className="list-disc space-y-1 pl-10 text-sm text-muted-foreground">
          <li>{t('shiftlessWarningNoReimbursement')}</li>
          <li>{t('shiftlessWarningNoShiftStats')}</li>
          <li>{t('shiftlessWarningDuplicateAtSubmit')}</li>
          <li>{t('shiftlessWarningEmptyTaskCell')}</li>
        </ul>
      </CardContent>
    </Card>
  );
}

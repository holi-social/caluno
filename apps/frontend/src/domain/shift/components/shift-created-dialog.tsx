'use client';

import { ShiftVisibility } from '@repo/data';
import { useShift } from '@repo/data/react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/ui';
import { Check, Copy, Landmark, Link, Repeat2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { copyToClipboard } from '@/lib/clipboard';
import { useFormatting } from '@/lib/formatting/use-formatting';
import { shiftShareUrl } from '../share';
import {
  clearSuccessDialogCreatedShift,
  formatShiftOrgUnitLabel,
  getSuccessDialogCreatedShift,
  resolveShiftCreatedRecurrenceBadge,
} from '../success-dialog';

export function ShiftCreatedDialog() {
  const t = useTranslations('Shift.successDialog');
  const tCommon = useTranslations('Common');
  const { shiftId, instanceId } = getSuccessDialogCreatedShift() ?? {};
  const { data: shift, isLoading } = useShift(shiftId);
  const { formatTimeRange } = useFormatting();

  const [isDialogOpen, setIsDialogOpen] = useState(true);

  const handleOpenChange = (value: boolean) => {
    if (value) return;

    clearSuccessDialogCreatedShift();
    setIsDialogOpen(value);
  };

  if (!shiftId || isLoading || !shift) {
    return null;
  }

  const startsAt = new Date(shift.originalStartsAt);
  const endsAt = new Date(startsAt.getTime() + shift.durationMinutes * 60000);
  const isOpenShift = shift.visibility === ShiftVisibility.AllMembers;
  const recurrenceBadge = resolveShiftCreatedRecurrenceBadge(
    shift.recurrenceDays,
  );
  const orgUnitLabel = formatShiftOrgUnitLabel(shift.organizationUnit);
  const shareUrl = shiftShareUrl(shiftId, instanceId);
  const handleCopyShareLink = () =>
    copyToClipboard(shareUrl, tCommon('linkCopied'));

  const recurrenceLabel =
    recurrenceBadge.kind === 'preset'
      ? t(`recurrence.${recurrenceBadge.translationKey}`)
      : recurrenceBadge.days.map((day) => t(`weekDayShort.${day}`)).join(' ');

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg pt-16">
        <DialogHeader className="items-center text-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-primary/10">
            <Check className="size-9 text-primary" strokeWidth={3} />
          </div>
          <DialogTitle className="text-2xl font-bold">{t('title')}</DialogTitle>
          <DialogDescription className="text-center max-w-sm">
            {isOpenShift ? t('bodyOpen') : t('bodyInvited')}
          </DialogDescription>
        </DialogHeader>

        <Card className="shadow-none bg-muted">
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-sm">
                {formatTimeRange(startsAt, endsAt)}
              </span>
              <Badge variant="outline" className="gap-1.5 text-primary">
                <Repeat2 className="size-3.5" />
                {recurrenceLabel}
              </Badge>
            </div>
            <p className="font-bold">{shift.title}</p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Landmark className="size-3.5 shrink-0" />
              {orgUnitLabel}
            </div>
          </CardContent>
        </Card>

        {isOpenShift && instanceId && (
          <div className="flex w-full min-w-0 flex-col gap-3">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground">
              {t('shareLabel')}
            </p>
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={handleCopyShareLink}
                className="flex h-10 min-w-0 items-center gap-2 overflow-hidden rounded-lg border bg-muted px-3 text-xs text-muted-foreground sm:flex-1"
              >
                <Link className="size-4 shrink-0" />
                <span className="min-w-0 truncate">{shareUrl}</span>
              </button>
              <Button
                type="button"
                className="w-full sm:w-auto sm:shrink-0"
                onClick={handleCopyShareLink}
              >
                <Copy className="size-4 mr-2" />
                {t('copyInviteLink')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

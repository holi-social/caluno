'use client';

import { ShiftVisibility } from '@repo/data';
import { useShift } from '@repo/data/react';
import {
  Badge,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/ui';
import { Check, Landmark, Repeat2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useFormatting } from '@/lib/formatting/use-formatting';
import {
  formatShiftOrgUnitLabel,
  resolveShiftCreatedRecurrenceBadge,
  SUCCESS_DIALOG_CREATE_SHIFT_ID,
} from '../success-dialog';

export function ShiftCreatedDialog() {
  const t = useTranslations('Shift.successDialog');
  const createShiftId =
    sessionStorage.getItem(SUCCESS_DIALOG_CREATE_SHIFT_ID) ?? undefined;
  const { data: shift, isLoading } = useShift(createShiftId);
  const { formatTimeRange } = useFormatting();

  const [isDialogOpen, setIsDialogOpen] = useState(true);

  const handleOpenChange = (value: boolean) => {
    if (value) return;

    sessionStorage.removeItem(SUCCESS_DIALOG_CREATE_SHIFT_ID);
    setIsDialogOpen(value);
  };

  if (!createShiftId || isLoading || !shift) {
    return null;
  }

  const startsAt = new Date(shift.originalStartsAt);
  const endsAt = new Date(startsAt.getTime() + shift.durationMinutes * 60000);
  const isOpenShift = shift.visibility === ShiftVisibility.AllMembers;
  const recurrenceBadge = resolveShiftCreatedRecurrenceBadge(
    shift.recurrenceDays,
  );
  const orgUnitLabel = formatShiftOrgUnitLabel(shift.organizationUnit);

  const recurrenceLabel =
    recurrenceBadge.kind === 'preset'
      ? t(`recurrence.${recurrenceBadge.translationKey}`)
      : recurrenceBadge.days.map((day) => t(`weekDayShort.${day}`)).join(' ');

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="items-center text-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-primary/10">
            <Check className="size-9 text-primary" strokeWidth={3} />
          </div>
          <DialogTitle className="text-2xl font-bold">{t('title')}</DialogTitle>
          <DialogDescription className="text-center">
            {isOpenShift ? t('bodyOpen') : t('bodyInvited')}
          </DialogDescription>
        </DialogHeader>

        <Card>
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
      </DialogContent>
    </Dialog>
  );
}

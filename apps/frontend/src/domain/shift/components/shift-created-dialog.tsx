'use client';

import { type RecurrenceDayValue, ShiftVisibility } from '@repo/data';
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
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useFormatting } from '@/lib/formatting/use-formatting';
import {
  formatShiftOrgUnitLabel,
  resolveShiftCreatedRecurrenceBadge,
} from '../success-dialog';

export interface ShiftCreatedDialogShift {
  title: string;
  visibility: ShiftVisibility;
  recurrenceDays: RecurrenceDayValue[];
  originalStartsAt: string;
  durationMinutes: number;
  organizationUnit: {
    name: string;
    organization: { name: string };
  };
}

interface ShiftCreatedDialogProps {
  shift: ShiftCreatedDialogShift;
}

export function ShiftCreatedDialog({ shift }: ShiftCreatedDialogProps) {
  const t = useTranslations('Shift.successDialog');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { formatTimeRange } = useFormatting();

  const handleOpenChange = (open: boolean) => {
    if (open) return;

    const next = new URLSearchParams(searchParams.toString());
    next.delete('created');
    next.delete('shift');
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

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
    <Dialog open onOpenChange={handleOpenChange}>
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

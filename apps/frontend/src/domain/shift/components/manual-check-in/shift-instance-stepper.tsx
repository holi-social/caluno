'use client';

import { Separator } from '@repo/ui';
import { Building2, CalendarDays } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useFormatting } from '@/lib/formatting/use-formatting';
import type {
  CheckInInstance,
  CheckInSelection,
} from '../../check-in-selection';
import { StepperRow } from './stepper-row';

type ShiftInstanceStepperProps = {
  selection: CheckInSelection;
  orgUnits: Array<{ id: string; name: string }>;
  instances: CheckInInstance[];
  onOpenOrgUnit: () => void;
  onOpenDate: () => void;
  onOpenShift: () => void;
};

export function ShiftInstanceStepper({
  selection,
  orgUnits,
  instances,
  onOpenOrgUnit,
  onOpenDate,
  onOpenShift,
}: ShiftInstanceStepperProps) {
  const t = useTranslations('CheckIn');
  const { formatDate, formatTimeRange } = useFormatting();

  const selectedOrgUnit = orgUnits.find((u) => u.id === selection.orgUnitId);
  const selectedInstance = instances.find(
    (i) => i.id === selection.shiftInstanceId,
  );

  const isToday =
    !!selection.date &&
    selection.date.toDateString() === new Date().toDateString();
  const dateLabel = selection.date
    ? isToday
      ? t('today')
      : formatDate(selection.date)
    : t('selectDatePlaceholder');

  const shiftLabel = selectedInstance
    ? selectedInstance.title
    : t('selectShiftPlaceholder');
  const shiftSublabel = selectedInstance
    ? formatTimeRange(
        selectedInstance.actualStartsAt,
        selectedInstance.actualEndsAt,
      )
    : undefined;

  return (
    <div className="rounded-xl bg-muted px-3 py-1">
      {orgUnits.length > 1 && (
        <>
          <StepperRow
            label={selectedOrgUnit?.name ?? t('orgUnitRowLabel')}
            icon={<Building2 className="size-4 text-muted-foreground" />}
            onClick={onOpenOrgUnit}
          />
          <Separator />
        </>
      )}

      <StepperRow
        label={dateLabel}
        isEmpty={!selection.date}
        icon={<CalendarDays className="size-4 text-muted-foreground" />}
        onClick={onOpenDate}
      />
      <Separator />

      <StepperRow
        label={shiftLabel}
        sublabel={shiftSublabel}
        isEmpty={!selectedInstance}
        onClick={onOpenShift}
      />
    </div>
  );
}

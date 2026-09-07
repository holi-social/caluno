'use client';

import { useTranslations } from 'next-intl';
import type { CheckInInstance } from '../../check-in-selection';
import { CheckInCalendar } from './check-in-calendar';
import { CheckInSheet } from './check-in-sheet';

type DateSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instances: CheckInInstance[];
  selectedDate: Date | null;
  selectedShiftId: string | null;
  month: Date;
  onMonthChange: (month: Date) => void;
  onSelect: (date: Date) => void;
  /** True while the month-range query is in flight with stale instances. */
  isLoadingInstances?: boolean;
};

export function DateSheet({
  open,
  onOpenChange,
  instances,
  selectedDate,
  selectedShiftId,
  month,
  onMonthChange,
  onSelect,
  isLoadingInstances,
}: DateSheetProps) {
  const t = useTranslations('CheckIn');

  return (
    <CheckInSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('dateSheetTitle')}
    >
      <CheckInCalendar
        instances={instances}
        selectedDate={selectedDate}
        selectedShiftId={selectedShiftId}
        month={month}
        onMonthChange={onMonthChange}
        disabled={isLoadingInstances}
        onSelect={(date) => {
          onSelect(date);
          onOpenChange(false);
        }}
      />
    </CheckInSheet>
  );
}

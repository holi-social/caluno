'use client';

import {
  Button,
  Calendar,
  cn,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@repo/ui';
import { CalendarIcon, CheckIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { ReimbursementsBoard } from './reimbursements-board';
import type { DateRange } from './reimbursements-board';

type DatePreset = 'all-time' | 'this-month' | 'last-month' | null;

// ─── PeriodPresetButton (checkmark on select, per the single-select convention) ─

interface PeriodPresetButtonProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

function PeriodPresetButton({
  label,
  selected,
  onClick,
}: PeriodPresetButtonProps) {
  return (
    <Button
      size="sm"
      variant="outline"
      className={cn(
        'flex-1 gap-1.5',
        selected &&
          'bg-foreground text-background border-foreground hover:bg-foreground/90',
      )}
      onClick={onClick}
    >
      {selected && <CheckIcon size={14} />}
      {label}
    </Button>
  );
}

// ─── ReimbursementsPageHeader ─────────────────────────────────────────────────

interface ReimbursementsPageHeaderProps {
  orgUId: string;
  title: string;
  subtitle: string;
}

export function ReimbursementsPageHeader({
  orgUId,
  title,
  subtitle,
}: ReimbursementsPageHeaderProps) {
  const t = useTranslations('Accounting.reimbursements');

  // Period picker — defaults to "all time" (no range = any document at any time)
  const [datePreset, setDatePreset] = useState<DatePreset>('all-time');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [pendingRange, setPendingRange] = useState<DateRange | undefined>(
    dateRange,
  );
  const [periodOpen, setPeriodOpen] = useState(false);

  function handleThisMonth() {
    const now = new Date();
    const range: DateRange = {
      from: new Date(now.getFullYear(), now.getMonth(), 1),
      to: new Date(now.getFullYear(), now.getMonth() + 1, 0),
    };
    setDateRange(range);
    setPendingRange(range);
    setDatePreset('this-month');
    setPeriodOpen(false);
  }

  function handleLastMonth() {
    const now = new Date();
    const range: DateRange = {
      from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      to: new Date(now.getFullYear(), now.getMonth(), 0),
    };
    setDateRange(range);
    setPendingRange(range);
    setDatePreset('last-month');
    setPeriodOpen(false);
  }

  function handleAllTime() {
    setDateRange(undefined);
    setPendingRange(undefined);
    setDatePreset('all-time');
    setPeriodOpen(false);
  }

  function handleApply() {
    if (pendingRange?.from) {
      setDateRange(pendingRange);
      setDatePreset(null);
      setPeriodOpen(false);
    }
  }

  const periodButtonLabel =
    datePreset === 'all-time'
      ? t('periodPicker.allTime')
      : datePreset === 'this-month'
        ? t('periodPicker.thisMonth')
        : datePreset === 'last-month'
          ? t('periodPicker.lastMonth')
          : t('periodPicker.customPeriod');

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="text-muted-foreground mt-1">{subtitle}</p>
        </div>

        <Popover
          open={periodOpen}
          onOpenChange={(open) => {
            if (open) setPendingRange(dateRange);
            setPeriodOpen(open);
          }}
        >
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-10 gap-2 shrink-0">
              <CalendarIcon size={14} />
              {periodButtonLabel}
            </Button>
          </PopoverTrigger>
          {/* Width pinned to the calendar's own rendered size (7 cols × --cell-size + p-3), not the default w-72 — otherwise the calendar sits flush-left in a wider box with dead space on the right. */}
          <PopoverContent className="p-0 w-[248px]" align="end">
            <div className="flex flex-wrap gap-2 p-3 border-b border-border">
              <PeriodPresetButton
                label={t('periodPicker.allTime')}
                selected={datePreset === 'all-time'}
                onClick={handleAllTime}
              />
              <PeriodPresetButton
                label={t('periodPicker.thisMonth')}
                selected={datePreset === 'this-month'}
                onClick={handleThisMonth}
              />
              <PeriodPresetButton
                label={t('periodPicker.lastMonth')}
                selected={datePreset === 'last-month'}
                onClick={handleLastMonth}
              />
            </div>
            <Calendar
              mode="range"
              selected={pendingRange}
              onSelect={setPendingRange}
              captionLayout="dropdown"
              startMonth={new Date(2024, 0)}
              endMonth={new Date(2028, 11)}
            />
            <div className="border-t border-border p-3">
              <Button
                size="sm"
                className="w-full"
                disabled={!pendingRange?.from}
                onClick={handleApply}
              >
                {t('periodPicker.apply')}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <ReimbursementsBoard
        orgUId={orgUId}
        dateRange={dateRange}
        onReadyToGoSelected={handleThisMonth}
      />
    </div>
  );
}

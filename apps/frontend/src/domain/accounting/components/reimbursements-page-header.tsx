'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import type { DateRange } from './period-picker';
import { lastMonthRange, PeriodPicker, thisMonthRange } from './period-picker';
import { ReimbursementsBoard } from './reimbursements-board';

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

  // Period filter — defaults to "all time" (no range = any document at any time)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="text-muted-foreground mt-1">{subtitle}</p>
        </div>

        <PeriodPicker
          value={dateRange}
          onChange={setDateRange}
          presets={[
            {
              key: 'all-time',
              label: t('periodPicker.allTime'),
              range: undefined,
            },
            {
              key: 'this-month',
              label: t('periodPicker.thisMonth'),
              range: thisMonthRange(),
            },
            {
              key: 'last-month',
              label: t('periodPicker.lastMonth'),
              range: lastMonthRange(),
            },
          ]}
          placeholderLabel={t('periodPicker.allTime')}
          applyLabel={t('periodPicker.apply')}
          customRangeLabel={t('periodPicker.customPeriod')}
          autoApplyPresets
          requireEndDate={false}
          align="end"
          className="h-10 gap-2 shrink-0"
        />
      </div>

      <ReimbursementsBoard
        orgUId={orgUId}
        dateRange={dateRange}
        onReadyToGoSelected={() => setDateRange(thisMonthRange())}
      />
    </div>
  );
}

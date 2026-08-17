'use client';

import { Button } from '@repo/ui';
import { PlusIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import type { DateRange } from './period-picker';
import { thisMonthRange } from './period-picker';
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
  const [createDocOpen, setCreateDocOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="text-muted-foreground mt-1">{subtitle}</p>
        </div>

        <Button
          className="h-10 shrink-0"
          onClick={() => setCreateDocOpen(true)}
        >
          <PlusIcon />
          {t('createDocument')}
        </Button>
      </div>

      <ReimbursementsBoard
        orgUId={orgUId}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onReadyToGoSelected={() => setDateRange(thisMonthRange())}
        createDocOpen={createDocOpen}
        onCreateDocOpenChange={setCreateDocOpen}
      />
    </div>
  );
}

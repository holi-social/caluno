'use client';

import { useAccountingSetupStatus } from '@repo/data/react';
import { Button } from '@repo/ui';
import { PlusIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { documentCreationBlocker } from '../lib/setup-status';
import { AccountingSetupAlert } from './accounting-setup-alert';
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
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [createDocOpen, setCreateDocOpen] = useState(false);

  const setupStatusQuery = useAccountingSetupStatus();
  const blocker = documentCreationBlocker(setupStatusQuery.data);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="text-muted-foreground mt-1">{subtitle}</p>
        </div>

        <Button
          className="h-10 shrink-0"
          disabled={blocker !== null}
          onClick={() => setCreateDocOpen(true)}
        >
          <PlusIcon />
          {t('createDocument')}
        </Button>
      </div>

      {blocker && <AccountingSetupAlert blocker={blocker} orgUId={orgUId} />}

      <ReimbursementsBoard
        orgUId={orgUId}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        year={year}
        onYearChange={setYear}
        onReadyToGoSelected={() => {
          setDateRange(thisMonthRange());
          setYear(new Date().getFullYear());
        }}
        createDocOpen={createDocOpen}
        onCreateDocOpenChange={setCreateDocOpen}
        canCreateDocuments={blocker === null}
      />
    </div>
  );
}

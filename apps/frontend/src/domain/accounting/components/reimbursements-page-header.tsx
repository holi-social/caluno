'use client';

import { useAccountingSetupStatus } from '@repo/data/react';
import { Button } from '@repo/ui';
import { AlertCircleIcon, PlusIcon } from 'lucide-react';
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
  // Fail closed: while the status is loading or errored we cannot prove the
  // gates are met, so the create paths stay disabled.
  const canCreateDocuments = setupStatusQuery.isSuccess && blocker === null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="text-muted-foreground mt-1">{subtitle}</p>
        </div>

        <Button
          className="h-10 shrink-0"
          disabled={!canCreateDocuments}
          onClick={() => setCreateDocOpen(true)}
        >
          <PlusIcon />
          {t('createDocument')}
        </Button>
      </div>

      {blocker && <AccountingSetupAlert blocker={blocker} orgUId={orgUId} />}

      {setupStatusQuery.isError && (
        <div className="flex items-start gap-2 rounded-xl border border-border bg-muted p-4 text-sm text-muted-foreground">
          <AlertCircleIcon
            size={16}
            className="mt-0.5 shrink-0"
            aria-hidden="true"
          />
          <p>{t('setupStatusError')}</p>
        </div>
      )}

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
        canCreateDocuments={canCreateDocuments}
      />
    </div>
  );
}

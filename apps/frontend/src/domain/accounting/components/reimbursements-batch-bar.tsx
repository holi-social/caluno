'use client';

import { Button, cn } from '@repo/ui';
import { useTranslations } from 'next-intl';
import type { BoardDocument, DocStatus } from './reimbursements-board';

type BatchAction = 'create' | 'countersign' | 'bundle' | 'remind';

const DOC_ACTION: Partial<Record<DocStatus, BatchAction>> = {
  'contract-generate': 'create',
  'timesheet-generate': 'create',
  'contract-signing-coord': 'countersign',
  'timesheet-signing-super': 'countersign',
  'timesheet-ready': 'bundle',
  'contract-signing-vol': 'remind',
  'timesheet-signing-vol': 'remind',
};

const ACTION_VARIANT: Record<BatchAction, 'default' | 'outline'> = {
  create: 'default',
  countersign: 'default',
  bundle: 'default',
  remind: 'outline',
};

interface BatchBarProps {
  selectedDocs: BoardDocument[];
  onClear: () => void;
  className?: string;
}

export function BatchBar({ selectedDocs, onClear, className }: BatchBarProps) {
  const t = useTranslations('Accounting.reimbursements.batchBar');

  if (selectedDocs.length === 0) return null;

  const groups = new Map<BatchAction, number>();
  for (const doc of selectedDocs) {
    const action = DOC_ACTION[doc.status];
    if (action) groups.set(action, (groups.get(action) ?? 0) + 1);
  }
  const groupEntries = [...groups.entries()];

  const ACTION_LABEL: Record<BatchAction, string> = {
    create: t('createAll'),
    countersign: t('countersignAll'),
    remind: t('remindAll'),
    bundle: t('bundleAll'),
  };

  return (
    <div
      className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-40',
        'flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-lg',
        className,
      )}
    >
      <span className="text-sm font-medium text-card-foreground whitespace-nowrap">
        {t('selected', { count: selectedDocs.length })}
      </span>

      <div className="h-4 w-px bg-border" />

      {groupEntries.map(([action, count]) => (
        <Button
          key={action}
          size="sm"
          variant={ACTION_VARIANT[action]}
          onClick={() => {
            // batch action handler — wired to mutations in production
          }}
        >
          {groupEntries.length > 1
            ? `${ACTION_LABEL[action]} · ${count}`
            : ACTION_LABEL[action]}
        </Button>
      ))}

      <Button size="sm" variant="ghost" onClick={onClear}>
        {t('clearSelection')}
      </Button>
    </div>
  );
}

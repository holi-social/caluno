'use client';

import { Button, cn } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { AlertIconTooltip } from './alert-icon-tooltip';
import type { NonCompliantAction } from './non-compliant-timesheet-dialog';
import type { DocStatus, DocVolPair } from './reimbursements-board';
import { isTimesheetNonCompliant } from './reimbursements-board';

type BatchAction = 'create' | 'countersign' | 'bundle' | 'remind';

const DOC_ACTION: Partial<Record<DocStatus, BatchAction>> = {
  'contract-generate': 'create',
  'contract-missing': 'create',
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
  selectedDocs: DocVolPair[];
  onClear: () => void;
  onRequestAction: (items: DocVolPair[], action: NonCompliantAction) => void;
  className?: string;
}

export function BatchBar({
  selectedDocs,
  onClear,
  onRequestAction,
  className,
}: BatchBarProps) {
  const t = useTranslations('Accounting.reimbursements.batchBar');
  const tDocs = useTranslations('Accounting.reimbursements.docs.statusLabel');

  if (selectedDocs.length === 0) return null;

  const groups = new Map<BatchAction, DocVolPair[]>();
  for (const entry of selectedDocs) {
    const action = DOC_ACTION[entry.doc.status];
    if (!action) continue;
    const items = groups.get(action) ?? [];
    items.push(entry);
    groups.set(action, items);
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

      {groupEntries.map(([action, items]) => {
        const hasNonCompliant = items.some(({ doc, vol }) =>
          isTimesheetNonCompliant(vol, doc),
        );
        return (
          <div key={action} className="flex items-center gap-1.5">
            {hasNonCompliant && (
              <AlertIconTooltip
                hint={tDocs('nonCompliantHint')}
                className="text-alert"
              />
            )}
            <Button
              size="sm"
              variant={ACTION_VARIANT[action]}
              onClick={() => {
                if (action !== 'bundle') {
                  onRequestAction(items, action);
                  return;
                }
                // bundle action — wired to mutations in production
                toast.success(
                  t('bundleDownloadToast', { count: items.length }),
                );
              }}
            >
              {groupEntries.length > 1
                ? `${ACTION_LABEL[action]} · ${items.length}`
                : ACTION_LABEL[action]}
            </Button>
          </div>
        );
      })}

      <Button size="sm" variant="ghost" onClick={onClear}>
        {t('clearSelection')}
      </Button>
    </div>
  );
}

'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@repo/ui';
import { useTranslations } from 'next-intl';
import type { DocStatus } from './reimbursements-board';

export type NonCompliantAction = 'create' | 'remind' | 'countersign';

export type NonCompliantDialogState =
  | { kind: 'single'; action: NonCompliantAction; contractStatus: DocStatus }
  | { kind: 'batch-all'; action: NonCompliantAction; count: number }
  | {
      kind: 'batch-mixed';
      action: NonCompliantAction;
      nonCompliantCount: number;
      totalCount: number;
    };

interface NonCompliantTimesheetDialogProps {
  state: NonCompliantDialogState | null;
  onOpenChange: (open: boolean) => void;
  onProceedAnyway: () => void;
  onOnlyCompliant: () => void;
  onGenerateContractInstead: () => void;
}

export function NonCompliantTimesheetDialog({
  state,
  onOpenChange,
  onProceedAnyway,
  onOnlyCompliant,
  onGenerateContractInstead,
}: NonCompliantTimesheetDialogProps) {
  const t = useTranslations(
    'Accounting.reimbursements.docs.nonCompliantDialog',
  );
  const tCommon = useTranslations('Common');

  if (!state) return null;

  const title =
    state.kind === 'single'
      ? t('titleSingle', { action: state.action })
      : state.kind === 'batch-all'
        ? t('titleBatchAll', { action: state.action, count: state.count })
        : t('titleBatchMixed', {
            count: state.nonCompliantCount,
            total: state.totalCount,
          });

  const description =
    state.kind === 'single'
      ? t('descriptionSingle', { action: state.action })
      : state.kind === 'batch-all'
        ? t('descriptionBatchAll', { action: state.action })
        : t('descriptionBatchMixed', { count: state.nonCompliantCount });

  const proceedLabel =
    state.kind === 'single'
      ? t('actionAnyway', { action: state.action })
      : t('actionAllAnyway', { action: state.action });

  return (
    <AlertDialog open={state !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg">{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-col sm:items-stretch">
          {state.kind === 'batch-mixed' && (
            <AlertDialogAction className="w-full" onClick={onOnlyCompliant}>
              {t('onlyCompliantAction', { action: state.action })}
            </AlertDialogAction>
          )}
          {state.kind === 'single' && (
            <AlertDialogAction
              className="w-full"
              onClick={onGenerateContractInstead}
            >
              {state.contractStatus === 'contract-generate'
                ? t('generateContractInstead')
                : t('viewContractInstead')}
            </AlertDialogAction>
          )}
          <AlertDialogAction
            variant="outline"
            className="w-full"
            onClick={onProceedAnyway}
          >
            {proceedLabel}
          </AlertDialogAction>
          <AlertDialogCancel variant="ghost" className="w-full">
            {tCommon('cancel')}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

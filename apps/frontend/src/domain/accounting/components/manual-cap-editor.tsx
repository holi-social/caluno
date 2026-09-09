'use client';

import { useManualBaseline, useSetManualBaseline } from '@repo/data/react';
import { Button, Input } from '@repo/ui';
import { CheckIcon, PencilIcon, XIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { formatEuro } from '@/lib/formatting/formats';
import {
  initialCapAmountEuros,
  parseEuroInputToCents,
  projectedCapAmount,
} from '../lib/manual-cap';
import { InfoPanel } from './info-panel';

interface ManualCapEditorProps {
  volunteerId: string;
  reimbursementTypeId: string;
  year: number;
  usedBefore: number;
  selectedAmount: number;
  className?: string;
}

export function ManualCapEditor({
  volunteerId,
  reimbursementTypeId,
  year,
  usedBefore,
  selectedAmount,
  className,
}: ManualCapEditorProps) {
  const t = useTranslations('Accounting.reimbursements.invoiceModal.manualCap');

  const baselineQuery = useManualBaseline(
    volunteerId,
    reimbursementTypeId,
    year,
  );
  const setBaseline = useSetManualBaseline();

  const initialEuros = initialCapAmountEuros(baselineQuery.data?.amountCents);
  const projected = projectedCapAmount(usedBefore, selectedAmount);

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleEdit = () => {
    setDraft(initialEuros === 0 ? '' : String(initialEuros));
    setIsEditing(true);
  };

  const handleSave = async () => {
    const amountCents = parseEuroInputToCents(draft);
    if (amountCents === null) return;
    setIsSaving(true);
    try {
      await setBaseline.mutateAsync({
        volunteerId,
        reimbursementTypeId,
        year,
        amountCents,
      });
      setIsEditing(false);
      toast.success(t('successToast'));
    } catch {
      toast.error(t('errorToast'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <InfoPanel
      title={t('title')}
      className={className}
      headerRight={
        isEditing ? undefined : (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={handleEdit}
          >
            <PencilIcon />
            <span className="sr-only">{t('editButtonLabel')}</span>
          </Button>
        )
      }
    >
      {isEditing ? (
        <div className="mt-2 flex items-center gap-1">
          <Input
            aria-label={t('inputLabel')}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            inputMode="decimal"
            autoFocus
          />
          <Button
            type="button"
            variant="outline"
            size="icon-md"
            onClick={handleSave}
            disabled={isSaving || parseEuroInputToCents(draft) === null}
          >
            <CheckIcon />
            <span className="sr-only">{t('saveButtonLabel')}</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-md"
            onClick={() => setIsEditing(false)}
          >
            <XIcon />
            <span className="sr-only">{t('cancelButtonLabel')}</span>
          </Button>
        </div>
      ) : (
        <p className="mt-2 text-base">{formatEuro(initialEuros)}</p>
      )}
      <p className="mt-1 text-xs text-muted-foreground">
        {t('projectedAfter', { after: formatEuro(projected) })}
      </p>
    </InfoPanel>
  );
}

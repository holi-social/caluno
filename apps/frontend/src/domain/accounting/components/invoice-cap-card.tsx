'use client';

import { Button, Input } from '@repo/ui';
import { CheckIcon, PencilIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { formatEuro } from '@/lib/formatting/formats';
import { InfoPanel } from './info-panel';

interface InvoiceCapCardProps {
  /** What the volunteer had received before this invoice — the only figure this card edits. Never includes this invoice's own amount. */
  usedBefore: number;
  total: number;
  /** Manual correction to the volunteer's running total — persists to the volunteer's baseline for the rest of the session (see reimbursements-board's volunteerLimitOverrides) and is what a real backend would write through as the new "amount paid before" this invoice. */
  onUsedBeforeChange: (value: number) => void;
  /** Formatted "dd.MM.yyyy – dd.MM.yyyy" range `usedBefore` covers — same string bound onto the generated document's "Bereits erhaltene Zahlungen" note (contract_period), so the modal and the document never disagree. */
  zeitraumLabel: string;
  className?: string;
}

export function InvoiceCapCard({
  usedBefore,
  total,
  onUsedBeforeChange,
  zeitraumLabel,
  className,
}: InvoiceCapCardProps) {
  const t = useTranslations('Accounting.reimbursements.invoiceModal.capCard');
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(String(usedBefore));

  const handleEdit = () => {
    setDraft(String(usedBefore));
    setIsEditing(true);
  };

  const handleSave = () => {
    const parsed = Number(draft);
    if (Number.isFinite(parsed) && parsed >= 0) onUsedBeforeChange(parsed);
    setIsEditing(false);
  };

  return (
    <InfoPanel
      title={t('title')}
      className={className}
      headerRight={
        !isEditing && (
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
      <p className="mt-2 text-xs text-muted-foreground">
        {t('usedBeforeLabel')}
      </p>
      <div className="mt-1">
        {isEditing ? (
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min="0"
              aria-label={t('usedBeforeEditLabel')}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
              className="flex-1"
            />
            <span className="text-sm text-muted-foreground">€</span>
            <Button
              type="button"
              variant="outline"
              size="icon-md"
              onClick={handleSave}
            >
              <CheckIcon />
              <span className="sr-only">{t('saveButtonLabel')}</span>
            </Button>
          </div>
        ) : (
          <p className="text-base font-semibold">{formatEuro(usedBefore)}</p>
        )}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {t('subline', { total: formatEuro(total) })}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {t('zeitraum', { range: zeitraumLabel })}
      </p>
      {isEditing && (
        <p className="mt-1 text-xs text-muted-foreground">{t('editingHint')}</p>
      )}
    </InfoPanel>
  );
}

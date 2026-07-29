'use client';

import { Button, Input, Separator, Skeleton } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { useEffect, useId, useState } from 'react';
import { toast } from 'sonner';
import type { DocumentKind, PauschalenType } from './doc-type-header';
import { DocTypeHeader, getPauschaleKey } from './doc-type-header';
import { RateProvenanceRow } from './rate-provenance-row';

const MOCK_HQ_DEFAULTS: Record<PauschalenType, number> = {
  ehrenamt: 5.0,
  uebungleiter: 8.0,
};

const MOCK_SAVED_OVERRIDES: Record<PauschalenType, number | undefined> = {
  ehrenamt: 4.5,
  uebungleiter: undefined,
};

const RATE_CONFIG: Record<PauschalenType, { kind: DocumentKind }> = {
  ehrenamt: { kind: 'settings' },
  uebungleiter: { kind: 'settings' },
};

interface RateRowProps {
  type: PauschalenType;
  canEdit: boolean;
}

function RateRow({ type, canEdit }: RateRowProps) {
  const t = useTranslations('Accounting.settings.rates');
  const tCommon = useTranslations('Common');
  const errorId = useId();

  const [editing, setEditing] = useState(false);
  const [savedOverride, setSavedOverride] = useState<number | undefined>(
    MOCK_SAVED_OVERRIDES[type],
  );
  const [inputValue, setInputValue] = useState(
    MOCK_SAVED_OVERRIDES[type]?.toFixed(2) ?? '',
  );
  const [inputError, setInputError] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) return;
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [editing]);

  const effectiveRate = savedOverride ?? MOCK_HQ_DEFAULTS[type];
  const { kind } = RATE_CONFIG[type];
  const pauschaleKey = getPauschaleKey(type);
  const typeLabel = t(`${pauschaleKey}Label` as Parameters<typeof t>[0]);
  const legalRef = t(`${pauschaleKey}Legal` as Parameters<typeof t>[0]);
  const yearlyLimit = t(
    `${pauschaleKey}YearlyLimit` as Parameters<typeof t>[0],
  );

  function handleSave() {
    const trimmed = inputValue.trim();
    if (trimmed === '') {
      setSavedOverride(undefined);
      setInputValue('');
      setEditing(false);
      setInputError(null);
      toast.success(t('saveSuccess'));
      return;
    }
    const num = Number(trimmed);
    if (Number.isNaN(num) || num <= 0) {
      setInputError(t('errors.invalidRate'));
      return;
    }
    setSavedOverride(num);
    setInputValue(num.toFixed(2));
    setEditing(false);
    setInputError(null);
    toast.success(t('saveSuccess'));
  }

  function handleCancel() {
    setInputValue(savedOverride?.toFixed(2) ?? '');
    setInputError(null);
    setEditing(false);
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <DocTypeHeader
        kind={kind}
        pauschale={type}
        topLine={legalRef}
        name={typeLabel}
        subline={yearlyLimit}
      />

      {editing ? (
        <div className="flex items-start gap-2 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setInputError(null);
                }}
                className="w-28"
                autoFocus
                aria-invalid={!!inputError}
                aria-describedby={inputError ? errorId : undefined}
              />
              <span className="text-sm text-muted-foreground">
                {t('rateUnit')}
              </span>
            </div>
            {inputError && (
              <p id={errorId} className="text-sm text-destructive" role="alert">
                {inputError}
              </p>
            )}
          </div>
          <Button size="sm" type="button" onClick={handleSave}>
            {tCommon('save')}
          </Button>
          <Button
            size="sm"
            type="button"
            variant="ghost"
            onClick={handleCancel}
          >
            {tCommon('cancel')}
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right space-y-0.5">
            <div className="flex items-baseline justify-end gap-1.5">
              <span className="text-2xl font-bold tabular-nums text-card-foreground">
                {effectiveRate.toFixed(2)}
              </span>
              <span className="text-sm text-muted-foreground">
                {t('rateUnit')}
              </span>
            </div>
            <RateProvenanceRow
              rate={MOCK_HQ_DEFAULTS[type]}
              unit={t('rateUnit')}
              inheritedLabel={t('provenance.inherited')}
            />
          </div>
          {canEdit && (
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={() => setEditing(true)}
            >
              {tCommon('edit')}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

interface RatesSectionCardProps {
  canEdit?: boolean;
}

export function RatesSectionCard({ canEdit = true }: RatesSectionCardProps) {
  const t = useTranslations('Accounting.settings.rates');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t('sectionTitle')}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t('sectionSubtitle')}
        </p>
      </div>
      <RateRow type="ehrenamt" canEdit={canEdit} />
      <Separator />
      <RateRow type="uebungleiter" canEdit={canEdit} />
    </div>
  );
}

export function RatesSectionCardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-[5px]" />
          <div className="space-y-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-8 w-16 rounded-md" />
        </div>
      </div>
      <Separator />
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-[5px]" />
          <div className="space-y-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-8 w-16 rounded-md" />
        </div>
      </div>
    </div>
  );
}

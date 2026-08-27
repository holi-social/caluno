'use client';

import {
  type RawEffectiveRate,
  type RawReimbursementType,
  useEffectiveRates,
  useReimbursementTypes,
  useSetReimbursementRate,
} from '@repo/data/react';
import { Button, Input, Separator, Skeleton } from '@repo/ui';
import { AlertCircleIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useId, useState } from 'react';
import { toast } from 'sonner';
import { formatEuro } from '@/lib/formatting/formats';
import { centsToEuros, eurosToCents, formatHourlyRate } from '../lib/money';
import { reimbursementTypeKeyFor } from '../lib/reimbursement-type-mapping';
import type { PauschalenType } from './doc-type-header';
import { DocTypeHeader, getPauschaleKey } from './doc-type-header';
import { RateProvenanceRow } from './rate-provenance-row';

const PAUSCHALE_ORDER: PauschalenType[] = ['ehrenamt', 'uebungsleiter'];

interface RateRowProps {
  type: PauschalenType;
  reimbursementType: RawReimbursementType;
  effectiveRate?: RawEffectiveRate;
  canEdit: boolean;
  organizationUnitId: string;
}

function RateRow({
  type,
  reimbursementType,
  effectiveRate,
  canEdit,
  organizationUnitId,
}: RateRowProps) {
  const t = useTranslations('Accounting.settings.rates');
  const tCommon = useTranslations('Common');
  const errorId = useId();
  const setRate = useSetReimbursementRate();

  const overrideCents = effectiveRate?.isOverride
    ? effectiveRate.hourlyRateCents
    : undefined;

  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState(
    overrideCents !== undefined ? centsToEuros(overrideCents).toFixed(2) : '',
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

  const effectiveEuros = centsToEuros(
    effectiveRate?.hourlyRateCents ??
      reimbursementType.platformDefaultRateCents,
  );
  const typeLabel = t(
    `${getPauschaleKey(type)}Label` as Parameters<typeof t>[0],
  );
  const yearlyLimit = t('yearlyLimit', {
    limit: formatEuro(centsToEuros(reimbursementType.yearlyLimitCents)),
  } as Parameters<typeof t>[1]);

  async function handleSave() {
    const trimmed = inputValue.trim();
    // The API only sets a rate — there is no delete-override mutation, so an
    // empty input is not a "reset to default" gesture.
    const num = Number(trimmed);
    if (trimmed === '' || Number.isNaN(num) || num <= 0) {
      setInputError(t('errors.invalidRate'));
      return;
    }
    try {
      await setRate.mutateAsync({
        reimbursementTypeId: reimbursementType.id,
        hourlyRateCents: eurosToCents(num),
        organizationUnitId,
      });
      setInputValue(num.toFixed(2));
      setInputError(null);
      setEditing(false);
      toast.success(t('saveSuccess'));
    } catch {
      toast.error(t('saveError'));
    }
  }

  function handleCancel() {
    setInputValue(
      overrideCents !== undefined ? centsToEuros(overrideCents).toFixed(2) : '',
    );
    setInputError(null);
    setEditing(false);
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <DocTypeHeader
        kind="settings"
        pauschale={type}
        topLine={reimbursementType.legalReference}
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
          <Button
            size="sm"
            type="button"
            onClick={handleSave}
            disabled={setRate.isPending}
          >
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
                {formatHourlyRate(effectiveEuros)}
              </span>
              <span className="text-sm text-muted-foreground">
                {t('rateUnit')}
              </span>
            </div>
            <RateProvenanceRow
              rate={formatHourlyRate(
                centsToEuros(reimbursementType.platformDefaultRateCents),
              )}
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
  organizationUnitId: string;
}

export function RatesSectionCard({
  canEdit = true,
  organizationUnitId,
}: RatesSectionCardProps) {
  const t = useTranslations('Accounting.settings.rates');
  const typesQuery = useReimbursementTypes();
  const ratesQuery = useEffectiveRates(organizationUnitId);

  if (typesQuery.isLoading || ratesQuery.isLoading) {
    return <RatesSectionCardSkeleton />;
  }

  if (typesQuery.isError || ratesQuery.isError) {
    return <RatesSectionCardError />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t('sectionTitle')}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t('sectionSubtitle')}
        </p>
      </div>
      {PAUSCHALE_ORDER.map((type, index) => {
        const key = reimbursementTypeKeyFor(type);
        const reimbursementType = typesQuery.data?.find((rt) => rt.key === key);
        if (!reimbursementType) return null;
        return (
          <div key={type} className="contents">
            {index > 0 && <Separator />}
            <RateRow
              type={type}
              reimbursementType={reimbursementType}
              effectiveRate={ratesQuery.data?.find(
                (rate) => rate.reimbursementType.key === key,
              )}
              canEdit={canEdit}
              organizationUnitId={organizationUnitId}
            />
          </div>
        );
      })}
    </div>
  );
}

export function RatesSectionCardError() {
  const t = useTranslations('Accounting.settings.rates');
  return (
    <div className="flex items-start gap-2 rounded-xl border border-border bg-muted p-4 text-sm text-muted-foreground">
      <AlertCircleIcon
        size={16}
        className="mt-0.5 shrink-0"
        aria-hidden="true"
      />
      <p>{t('loadError')}</p>
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

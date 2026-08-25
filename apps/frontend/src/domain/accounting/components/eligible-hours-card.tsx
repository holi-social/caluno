import { Checkbox, Separator } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { formatEuro } from '@/lib/formatting/formats';
import { InfoPanel } from './info-panel';

export interface EligibleHourLine {
  id: string;
  shiftName: string;
  dateTime: string;
  hours: number;
}

interface EligibleHoursCardProps {
  lines: EligibleHourLine[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  timesheetsHref: string;
  /** What the volunteer's running total will be once this invoice's selected hours are paid out — the amount already received (InvoiceCapCard) plus this invoice. */
  projectedAfterAmount: number;
  /** The volunteer's yearly cap for this pauschale — gives the projection its "of what" context. */
  capTotalAmount: number;
  className?: string;
}

/**
 * Unchecking a row removes its hours from the invoice being created — the
 * checked set is the source of truth the caller totals up, this card doesn't
 * track or reconcile totals itself.
 */
export function EligibleHoursCard({
  lines,
  selectedIds,
  onToggle,
  timesheetsHref,
  projectedAfterAmount,
  capTotalAmount,
  className,
}: EligibleHoursCardProps) {
  const t = useTranslations('Accounting.reimbursements.invoiceModal.hoursCard');

  return (
    <InfoPanel title={t('title')} className={className}>
      <ul className="mt-2 space-y-3">
        {lines.map((line) => (
          <li key={line.id} className="flex items-center gap-3">
            <Checkbox
              checked={selectedIds.has(line.id)}
              onCheckedChange={() => onToggle(line.id)}
              aria-label={t('rowCheckboxLabel', { shiftName: line.shiftName })}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{line.shiftName}</p>
              <p className="truncate text-xs text-muted-foreground">
                {line.dateTime}
              </p>
            </div>
            <p className="shrink-0 text-sm tabular-nums">
              {t('hoursValue', { hours: line.hours })}
            </p>
          </li>
        ))}
      </ul>

      <Separator className="my-3" />

      <p className="text-sm">
        {t.rich('projectedAfter', {
          after: formatEuro(projectedAfterAmount),
          total: formatEuro(capTotalAmount),
          amount: (chunks) => <span className="font-semibold">{chunks}</span>,
        })}
      </p>

      <p className="mt-2 text-xs text-muted-foreground">
        {t.rich('editHint', {
          link: (chunks) => (
            <Link
              href={timesheetsHref}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              {chunks}
            </Link>
          ),
        })}
      </p>
    </InfoPanel>
  );
}

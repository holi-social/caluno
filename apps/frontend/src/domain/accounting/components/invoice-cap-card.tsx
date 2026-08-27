import { useTranslations } from 'next-intl';
import { formatEuro } from '@/lib/formatting/formats';
import { InfoPanel } from './info-panel';

interface InvoiceCapCardProps {
  usedBefore: number;
  projectedAfter: number;
  total: number;
  className?: string;
}

/**
 * Read-only — this card only reports the cap impact of the invoice being
 * created, it never edits `usedBefore`/`total` (those come from the
 * volunteer's yearly Pauschale, out of this modal's reach).
 */
export function InvoiceCapCard({
  usedBefore,
  projectedAfter,
  total,
  className,
}: InvoiceCapCardProps) {
  const t = useTranslations('Accounting.reimbursements.invoiceModal.capCard');

  return (
    <InfoPanel title={t('title')} className={className}>
      <p className="mt-2 text-base">
        {t('value', {
          before: formatEuro(usedBefore),
          after: formatEuro(projectedAfter),
        })}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {t('subline', { total: formatEuro(total) })}
      </p>
    </InfoPanel>
  );
}

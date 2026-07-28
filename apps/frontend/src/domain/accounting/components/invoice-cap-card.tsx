import { cn } from '@repo/ui';
import { useTranslations } from 'next-intl';

function formatEuro(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

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
    <div className={cn('rounded-xl bg-muted p-4', className)}>
      <p className="text-sm font-semibold">{t('title')}</p>
      <p className="mt-2 text-base">
        {t('value', {
          before: formatEuro(usedBefore),
          after: formatEuro(projectedAfter),
        })}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {t('subline', { total: formatEuro(total) })}
      </p>
    </div>
  );
}

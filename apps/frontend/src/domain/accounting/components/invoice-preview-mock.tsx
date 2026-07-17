import { Badge, Separator } from '@repo/ui';
import { useTranslations } from 'next-intl';
import type { PauschalenType } from './doc-type-header';
import { DocTypeHeader } from './doc-type-header';

function formatEuro(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface InvoicePreviewMockProps {
  volunteerName: string;
  pauschale: PauschalenType;
  pauschaleLabel: string;
  orgName: string;
  iban: string;
  periodLabel: string;
  totalHours: number;
  totalAmount: number;
  className?: string;
}

/**
 * A crude stand-in for a generated invoice — same idiom as
 * ContractPreviewMock, no template engine exists yet (SF-2). Not bound to
 * in-progress edits on the eligible-hours checklist (see context file).
 */
export function InvoicePreviewMock({
  volunteerName,
  pauschale,
  pauschaleLabel,
  orgName,
  iban,
  periodLabel,
  totalHours,
  totalAmount,
  className,
}: InvoicePreviewMockProps) {
  const t = useTranslations('Accounting.reimbursements.invoiceModal.preview');

  return (
    <div className={className}>
      <div className="mx-auto max-w-[70ch] rounded-xl border bg-card p-8">
        <div className="flex items-start justify-between gap-4">
          <DocTypeHeader
            kind="invoice"
            pauschale={pauschale}
            topLine={pauschaleLabel}
            name={t('documentTitle')}
            subline={orgName}
          />
          <Badge variant="outline">{t('disclaimerBadge')}</Badge>
        </div>

        <Separator className="my-6" />

        <div className="space-y-4 text-base">
          <p className="font-medium">
            {t('partiesIntro', { orgName, name: volunteerName })}
          </p>
          <p className="text-sm text-muted-foreground">
            {t('periodLabel')}: {periodLabel}
          </p>
          <p className="text-sm text-muted-foreground">
            {t('ibanLabel')}: {iban}
          </p>
          <p className="text-sm text-muted-foreground">
            {t('hoursLabel')}: {t('hoursValue', { hours: totalHours })}
          </p>
          <p className="text-sm text-muted-foreground">
            {t('amountLabel')}: {formatEuro(totalAmount)}
          </p>

          <p>
            {t('clauseCompensation', {
              name: volunteerName,
              orgName,
              pauschale: pauschaleLabel,
              period: periodLabel,
            })}
          </p>
        </div>

        <Separator className="my-6" />

        <div className="grid grid-cols-2 gap-8">
          <div>
            <div className="h-10 border-b" />
            <p className="mt-1 text-sm font-medium">
              {t('signatureVolunteer')}
            </p>
            <p className="text-xs text-muted-foreground">{t('unsigned')}</p>
          </div>
          <div>
            <div className="h-10 border-b" />
            <p className="mt-1 text-sm font-medium">
              {t('signatureSupervisor')}
            </p>
            <p className="text-xs text-muted-foreground">{t('unsigned')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

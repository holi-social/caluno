import { useTranslations } from 'next-intl';
import { formatEuro } from '@/lib/formatting/formats';
import type { PauschalenType } from './doc-type-header';
import { DocumentPreviewShell } from './document-preview-shell';

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
    <DocumentPreviewShell
      kind="invoice"
      pauschale={pauschale}
      pauschaleLabel={pauschaleLabel}
      documentTitle={t('documentTitle')}
      orgName={orgName}
      disclaimerLabel={t('disclaimerBadge')}
      signerLeftLabel={t('signatureVolunteer')}
      signerRightLabel={t('signatureSupervisor')}
      unsignedLabel={t('unsigned')}
      className={className}
    >
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
    </DocumentPreviewShell>
  );
}

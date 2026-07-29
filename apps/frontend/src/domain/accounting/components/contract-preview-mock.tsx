import { useTranslations } from 'next-intl';
import type { PauschalenType } from './doc-type-header';
import { DocumentPreviewShell } from './document-preview-shell';

interface ContractPreviewMockProps {
  volunteerName: string;
  pauschale: PauschalenType;
  pauschaleLabel: string;
  orgName: string;
  address: string;
  iban: string;
  effectiveDate: string;
  className?: string;
}

/**
 * A crude stand-in for a generated contract — no template engine exists yet
 * (SF-2), so this renders a fixed layout with the volunteer's data filled in.
 * Not bound to in-progress edits on the field cards (see context file).
 */
export function ContractPreviewMock({
  volunteerName,
  pauschale,
  pauschaleLabel,
  orgName,
  address,
  iban,
  effectiveDate,
  className,
}: ContractPreviewMockProps) {
  const t = useTranslations('Accounting.reimbursements.contractModal.preview');

  return (
    <DocumentPreviewShell
      kind="contract"
      pauschale={pauschale}
      pauschaleLabel={pauschaleLabel}
      documentTitle={t('documentTitle')}
      orgName={orgName}
      disclaimerLabel={t('disclaimerBadge')}
      signerLeftLabel={t('signatureVolunteer')}
      signerRightLabel={t('signatureCoordinator')}
      unsignedLabel={t('unsigned')}
      className={className}
    >
      <p className="font-medium">
        {t('partiesIntro', { orgName, name: volunteerName })}
      </p>
      <p className="text-sm text-muted-foreground">
        {t('addressLabel')}: {address}
      </p>
      <p className="text-sm text-muted-foreground">
        {t('ibanLabel')}: {iban}
      </p>
      <p className="text-sm text-muted-foreground">
        {t('effectiveDateLabel')}: {effectiveDate}
      </p>

      <p>
        {t('clauseScope', {
          name: volunteerName,
          orgName,
          pauschale: pauschaleLabel,
        })}
      </p>
      <p>{t('clauseCompensation', { orgName })}</p>
    </DocumentPreviewShell>
  );
}

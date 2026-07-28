import { Badge, Separator } from '@repo/ui';
import { useTranslations } from 'next-intl';
import type { PauschalenType } from './doc-type-header';
import { DocTypeHeader } from './doc-type-header';

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
    <div className={className}>
      <div className="mx-auto max-w-[70ch] rounded-xl border bg-card p-8">
        <div className="flex items-start justify-between gap-4">
          <DocTypeHeader
            kind="contract"
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
              {t('signatureCoordinator')}
            </p>
            <p className="text-xs text-muted-foreground">{t('unsigned')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

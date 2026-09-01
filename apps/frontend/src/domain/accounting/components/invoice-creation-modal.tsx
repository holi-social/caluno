'use client';

import { DataError, parseTemplateBody } from '@repo/data';
import {
  useActiveDocumentTemplate,
  useAdminUserProfile,
  useCreateInvoice,
  useCurrentOrg,
  useEffectiveRates,
  useEligibleTimeEntriesForInvoice,
  useReimbursementTypes,
} from '@repo/data/react';
import { format } from 'date-fns';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/navigation';
import { formatEuro } from '@/lib/formatting/formats';
import { mapEligibleTimeEntry } from '../lib/creation-modal.utils';
import { centsToEuros } from '../lib/money';
import {
  apiDocumentKindFor,
  reimbursementTypeKeyFor,
} from '../lib/reimbursement-type-mapping';
import { AccountingProfileFieldCard } from './accounting-profile-field-card';
import { getPauschaleKey, type PauschalenType } from './doc-type-header';
import {
  DocumentCreationDialog,
  type DocumentCreationLoadStatus,
} from './document-creation-dialog';
import { EligibleHoursCard } from './eligible-hours-card';
import { InfoPanel } from './info-panel';
import { InvoiceCapCard } from './invoice-cap-card';
import type { DateRange } from './period-picker';
import { lastMonthRange, PeriodPicker, thisMonthRange } from './period-picker';
import { getKnownOrgValues } from './template/builder-document-presets';
import type {
  DataSourceKey,
  InvoiceNumberFormat,
} from './template/builder-types';
import { getManualFieldValue } from './template/builder-types';
import { GeneratedDocumentPreview } from './template/generated-document-preview';

/** "Anna Müller" -> { first: "Anna", last: "Müller" } — matches the Vorname/Nachname fields the invoice text binds separately. */
function splitName(name: string): { first: string; last: string } {
  const [first, ...rest] = name.trim().split(/\s+/);
  return { first: first ?? name, last: rest.join(' ') };
}

/** "05.07.2026, 09:00–13:00" -> { begin: "05.07.2026, 09:00", end: "05.07.2026, 13:00" } — the table's Beginn/Ende columns need separate timestamps, `EligibleHourLine` stores one combined string. */
function splitDateTimeRange(dateTime: string): { begin: string; end: string } {
  const [datePart, timePart] = dateTime.split(', ');
  const [start, end] = (timePart ?? '').split('–');
  return {
    begin: `${datePart}, ${start ?? ''}`,
    end: `${datePart}, ${end ?? ''}`,
  };
}

/** Mock document-number generation — no real sequence counter exists yet, so this only has to look plausible for the chosen format. */
function formatDocumentNumber(
  invoiceFormat: InvoiceNumberFormat,
  period: DateRange,
  kostenstelle: string | undefined,
): string {
  const d = period.from ?? new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const seq = '001';
  switch (invoiceFormat) {
    case 'date-number':
      return `${yyyy}${mm}${dd}-${seq}`;
    case 'date-kostenstelle-number':
      return `${yyyy}${mm}${dd}-${kostenstelle ?? '—'}-${seq}`;
    case 'compact-date-number':
      return `${String(yyyy).slice(2)}${mm}${dd}${seq}`;
    case 'kostenstelle-month-year-number':
      return `${kostenstelle ?? '—'}-${mm}.${yyyy}-${seq}`;
  }
}

interface NameFieldState {
  value: string;
  provenance: 'profile' | 'override';
}

interface IbanFieldState {
  value: string | null;
  provenance: 'profile' | 'override' | 'gap';
}

interface InvoiceCreationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgUId: string;
  docId: string | null;
  volunteerId: string | null;
  volunteerName: string | null;
  pauschale: PauschalenType | null;
  usedBeforeAmount: number | null;
  totalCapAmount: number | null;
  onSent: () => void;
  /** See DocumentCreationDialog's embedded mode. */
  embedded?: boolean;
}

export function InvoiceCreationModal({
  open,
  onOpenChange,
  orgUId,
  docId,
  volunteerId,
  volunteerName,
  pauschale,
  usedBeforeAmount,
  totalCapAmount,
  onSent,
  embedded,
}: InvoiceCreationModalProps) {
  const t = useTranslations('Accounting.reimbursements.invoiceModal');
  const tFields = useTranslations('Accounting.templates.builder.dataSources');
  const tPauschale = useTranslations('Accounting.reimbursements.toolbar');
  const tPeriod = useTranslations(
    'Accounting.reimbursements.invoiceModal.periodPicker',
  );

  const org = useCurrentOrg();
  const router = useRouter();

  const typesQuery = useReimbursementTypes();
  const ratesQuery = useEffectiveRates(orgUId);
  const profileQuery = useAdminUserProfile(volunteerId ?? '');

  const reimbursementTypeKey = pauschale
    ? reimbursementTypeKeyFor(pauschale)
    : undefined;
  const reimbursementType = typesQuery.data?.find(
    (type) => type.key === reimbursementTypeKey,
  );
  const effectiveRate = ratesQuery.data?.find(
    (rate) => rate.reimbursementType.key === reimbursementTypeKey,
  );
  const ratePerHour = effectiveRate
    ? centsToEuros(effectiveRate.hourlyRateCents)
    : 0;

  const invoiceTemplateQuery = useActiveDocumentTemplate(
    apiDocumentKindFor('invoice'),
    reimbursementType?.id,
    orgUId,
  );
  const contractTemplateQuery = useActiveDocumentTemplate(
    apiDocumentKindFor('contract'),
    reimbursementType?.id,
    orgUId,
  );
  const template = invoiceTemplateQuery.data
    ? parseTemplateBody(invoiceTemplateQuery.data.body)
    : null;
  const contractTemplate = contractTemplateQuery.data
    ? parseTemplateBody(contractTemplateQuery.data.body)
    : null;

  const [nameField, setNameField] = useState<NameFieldState | null>(null);
  const [addressField, setAddressField] = useState<IbanFieldState | null>(null);
  const [ibanField, setIbanField] = useState<IbanFieldState | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [period, setPeriod] = useState<DateRange>(thisMonthRange);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendErrorCode, setSendErrorCode] = useState<string | null>(null);

  const eligibleQuery = useEligibleTimeEntriesForInvoice({
    volunteerId: volunteerId ?? undefined,
    reimbursementTypeId: reimbursementType?.id,
    periodStart: period.from?.toISOString(),
    periodEnd: (period.to ?? period.from)?.toISOString(),
  });
  const lines = useMemo(
    () => (eligibleQuery.data ?? []).map(mapEligibleTimeEntry),
    [eligibleQuery.data],
  );

  const createInvoice = useCreateInvoice();

  // Reset local edits and the period whenever a different document/volunteer
  // is targeted — everything gets re-seeded from the freshly loaded data below.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional reset keyed on identity change, not a dependency read by the effect body
  useEffect(() => {
    setNameField(null);
    setAddressField(null);
    setIbanField(null);
    setPeriod(thisMonthRange());
  }, [volunteerId, docId]);

  // Every eligible entry starts checked — unchecking removes it from the
  // invoice being created (see EligibleHoursCard). Re-syncs whenever the
  // underlying entries change (a fresh period, a refetch), not on every render.
  useEffect(() => {
    setCheckedIds(new Set(lines.map((line) => line.id)));
  }, [lines]);

  const profileLoaded = !!volunteerId && profileQuery.isSuccess;
  const reimbursementTypeMissing =
    typesQuery.isSuccess && !!pauschale && !reimbursementType;
  const dataReady =
    !!volunteerName &&
    profileLoaded &&
    !!reimbursementType &&
    !!template &&
    !!contractTemplate &&
    ratesQuery.isSuccess &&
    eligibleQuery.isSuccess;
  const hasError =
    typesQuery.isError ||
    ratesQuery.isError ||
    profileQuery.isError ||
    invoiceTemplateQuery.isError ||
    contractTemplateQuery.isError ||
    eligibleQuery.isError ||
    reimbursementTypeMissing;

  // The first query that failed carries the actual reason (e.g. "No invoice
  // template configured for reimbursement type …") — shown in the dialog so
  // the coordinator can see what's really wrong, not just the generic copy.
  const loadError =
    typesQuery.error ??
    ratesQuery.error ??
    profileQuery.error ??
    invoiceTemplateQuery.error ??
    contractTemplateQuery.error ??
    eligibleQuery.error;

  // The most common blocker: the org has the reimbursement type but no
  // invoice template yet (org-default or unit-override). Offer a direct CTA
  // to the template builder instead of a dead end.
  const noInvoiceTemplate =
    invoiceTemplateQuery.error instanceof DataError &&
    invoiceTemplateQuery.error.options?.code === 'NOT_FOUND';
  const createTemplateCta = () =>
    router.push(`/admin/${orgUId}/accounting/settings/templates`);

  const status: DocumentCreationLoadStatus = hasError
    ? 'error'
    : sendError
      ? 'error'
      : dataReady
        ? 'loaded'
        : 'loading';

  // Seed the editable fields once from the loaded profile, then leave them
  // alone — later re-renders shouldn't clobber a coordinator's edits.
  useEffect(() => {
    if (!volunteerId || !volunteerName || nameField || !profileLoaded) return;
    const profileData = (profileQuery.data?.data ?? {}) as Record<
      string,
      unknown
    >;
    const address =
      typeof profileData.address === 'string' ? profileData.address : null;
    const iban = typeof profileData.iban === 'string' ? profileData.iban : null;
    setNameField({ value: volunteerName, provenance: 'profile' });
    setAddressField({
      value: address,
      provenance: address ? 'profile' : 'gap',
    });
    setIbanField({ value: iban, provenance: iban ? 'profile' : 'gap' });
  }, [volunteerId, volunteerName, nameField, profileLoaded, profileQuery.data]);

  // Rendered unconditionally (per the ContractCreationModal precedent) so the
  // Dialog can drive its own open/close animation; nothing below needs the
  // nullable identity props once past this guard.
  if (
    !docId ||
    !volunteerId ||
    !volunteerName ||
    !pauschale ||
    usedBeforeAmount == null ||
    totalCapAmount == null
  )
    return null;

  const selectedLines = lines.filter((line) => checkedIds.has(line.id));
  const selectedHours = selectedLines.reduce(
    (sum, line) => sum + line.hours,
    0,
  );
  const selectedAmount = selectedHours * ratePerHour;
  const projectedAfter = usedBeforeAmount + selectedAmount;

  const toggleLine = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSend = async () => {
    if (!reimbursementType) return;
    setIsSending(true);
    setSendError(null);
    setSendErrorCode(null);
    try {
      await createInvoice.mutateAsync({
        organizationUnitId: orgUId,
        reimbursementTypeId: reimbursementType.id,
        volunteerId,
        periodStart: (period.from ?? new Date()).toISOString(),
        periodEnd: (period.to ?? period.from ?? new Date()).toISOString(),
        timeEntryIds: selectedLines.map((line) => line.id),
      });
      onOpenChange(false);
      toast.success(t('sentToast', { name: volunteerName }));
      onSent();
    } catch (error) {
      // Surface the real server error (e.g. "No invoice template configured
      // for reimbursement type …") instead of a generic "try again", and keep
      // the modal open so the coordinator can act on the reason.
      if (error instanceof Error) {
        setSendError(error.message || null);
        setSendErrorCode(
          error instanceof DataError ? (error.options?.code ?? null) : null,
        );
      } else {
        setSendError(null);
        setSendErrorCode(null);
      }
    } finally {
      setIsSending(false);
    }
  };

  const sendErrorIsNoTemplate = sendErrorCode === 'NOT_FOUND';

  const pauschaleLabel = tPauschale(
    `type${getPauschaleKey(pauschale).toUpperCase()}` as Parameters<
      typeof tPauschale
    >[0],
  );

  // Same URL shape as DocumentSheet's "view on Timesheets" link — the route
  // doesn't read these params yet (dev dependency, see context file), but the
  // link commits to the shape that already exists elsewhere in this domain.
  const periodStart = period.from ?? new Date();
  const monthParam = `${periodStart.getFullYear()}-${String(periodStart.getMonth() + 1).padStart(2, '0')}`;
  const timesheetsHref = `/admin/${orgUId}/timesheets?month=${monthParam}&volunteer=${volunteerId}`;

  const kostenstelle = template
    ? getManualFieldValue(template, 'kostenstelle')
    : undefined;

  const { first, last } = splitName(nameField?.value ?? volunteerName);

  const values: Partial<Record<DataSourceKey, string>> = {
    ...getKnownOrgValues({
      pauschale,
      orgName: org.name,
      orgAddress: org.address,
      // orgCity/orgLegalRep: no such field exists on the org profile yet
      // (see OrganizationData) — a real gap, left unresolved rather than
      // invented.
      hourlyRateCents: effectiveRate?.hourlyRateCents,
      yearlyLimitCents:
        effectiveRate?.reimbursementType.yearlyLimitCents ??
        reimbursementType?.yearlyLimitCents,
    }),
    volunteer_first_name: first,
    volunteer_last_name: last,
    volunteer_address: addressField?.value ?? undefined,
    volunteer_iban: ibanField?.value ?? undefined,
    generated_date: format(new Date(), 'dd.MM.yyyy'),
    document_number:
      template?.invoiceNumberFormat && template
        ? formatDocumentNumber(
            template.invoiceNumberFormat,
            period,
            kostenstelle,
          )
        : undefined,
    period_start: format(period.from ?? new Date(), 'dd.MM.yyyy'),
    period_end: format(period.to ?? new Date(), 'dd.MM.yyyy'),
  };

  const tableBlock = template?.blocks.find((b) => b.kind === 'table');
  const firstColumnSource =
    tableBlock?.kind === 'table'
      ? tableBlock.firstColumnSource
      : 'agreement_task_description';
  const firstColumnCustomLabel =
    tableBlock?.kind === 'table' ? tableBlock.firstColumnCustomLabel : '';
  // The agreement's task description is baked into the volunteer's contract template, not
  // this invoice's own — read from the sibling contract template for this pauschale.
  const agreementTaskDescription =
    firstColumnSource === 'agreement_task_description' && contractTemplate
      ? getManualFieldValue(contractTemplate, 'tasks')
      : undefined;

  const tableRows = selectedLines.map((line) => {
    const { begin, end } = splitDateTimeRange(line.dateTime);
    return [
      firstColumnSource === 'agreement_task_description'
        ? (agreementTaskDescription ?? line.shiftName)
        : firstColumnCustomLabel,
      begin,
      end,
      `${line.hours}h`,
      `${ratePerHour.toFixed(2)} €`,
    ];
  });
  const tableTotalRow = [
    '',
    '',
    'Summe',
    `${selectedHours}h`,
    formatEuro(selectedAmount),
  ];
  // The Pauschale reimbursement itself isn't a VAT-liable supply, but the rate is always 0% —
  // stated on every invoice regardless, never computed from the total.
  const tableVatRow = ['', '', 'zzgl. 0 % USt.', '', '0,00 €'];

  return (
    <DocumentCreationDialog
      open={open}
      onOpenChange={onOpenChange}
      embedded={embedded}
      title={t('title')}
      status={status}
      errorTitle={sendError ? t('sendErrorTitle') : t('loadErrorTitle')}
      errorDescription={
        sendError
          ? t('sendError', { name: volunteerName })
          : t('loadError', { name: volunteerName })
      }
      errorMessage={
        sendError ??
        (loadError instanceof Error ? loadError.message : undefined)
      }
      errorCtaLabel={
        noInvoiceTemplate || sendErrorIsNoTemplate
          ? t('noTemplateCta')
          : undefined
      }
      errorCtaAction={
        noInvoiceTemplate || sendErrorIsNoTemplate
          ? createTemplateCta
          : undefined
      }
      fieldsSkeletonKeys={['name', 'iban', 'period', 'cap', 'hours']}
      cancelLabel={t('cancel')}
      sendLabel={t('sendForSigning')}
      sendingLabel={t('sending')}
      isSending={isSending}
      onSend={handleSend}
      sendDisabled={selectedHours === 0}
      preview={
        template && (
          <GeneratedDocumentPreview
            document={template}
            kind="invoice"
            pauschale={pauschale}
            pauschaleLabel={pauschaleLabel}
            documentTitle={t('preview.documentTitle')}
            orgName={org.name}
            disclaimerLabel={t('preview.disclaimerBadge')}
            signerLeftLabel={t('preview.signatureVolunteer')}
            signerRightLabel={t('preview.signatureSupervisor')}
            unsignedLabel={t('preview.unsigned')}
            values={values}
            tableRows={tableRows}
            tableTotalRow={tableTotalRow}
            tableNoteRow={tableVatRow}
          />
        )
      }
      fields={
        nameField &&
        addressField &&
        ibanField && (
          <>
            <AccountingProfileFieldCard
              label={t('nameFieldLabel')}
              value={nameField.value}
              provenance={nameField.provenance}
              volunteerName={volunteerName}
              docType="invoice"
              onSave={(value) =>
                setNameField({ value, provenance: 'override' })
              }
            />
            <AccountingProfileFieldCard
              label={tFields('volunteer_address')}
              value={addressField.value}
              provenance={addressField.provenance}
              volunteerName={volunteerName}
              docType="invoice"
              onSave={(value) =>
                setAddressField({ value, provenance: 'override' })
              }
            />
            <AccountingProfileFieldCard
              label={tFields('volunteer_iban')}
              value={ibanField.value}
              provenance={ibanField.provenance}
              volunteerName={volunteerName}
              docType="invoice"
              onSave={(value) =>
                setIbanField({ value, provenance: 'override' })
              }
            />
            <InfoPanel title={t('periodFieldLabel')}>
              <div className="mt-2">
                <PeriodPicker
                  value={period}
                  onChange={(range) => range && setPeriod(range)}
                  presets={[
                    {
                      key: 'this-month',
                      label: tPeriod('thisMonth'),
                      range: thisMonthRange(),
                    },
                    {
                      key: 'last-month',
                      label: tPeriod('lastMonth'),
                      range: lastMonthRange(),
                    },
                  ]}
                  placeholderLabel={tPeriod('placeholder')}
                  applyLabel={tPeriod('apply')}
                  className="w-full"
                />
              </div>
            </InfoPanel>
            <InvoiceCapCard
              usedBefore={usedBeforeAmount}
              projectedAfter={projectedAfter}
              total={totalCapAmount}
            />
            <EligibleHoursCard
              lines={lines}
              selectedIds={checkedIds}
              onToggle={toggleLine}
              timesheetsHref={timesheetsHref}
            />
          </>
        )
      }
    />
  );
}

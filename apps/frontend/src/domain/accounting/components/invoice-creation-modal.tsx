'use client';

import { DataError, PermissionKey, parseTemplateBody } from '@repo/data';
import {
  useAccountingSetupStatus,
  useActiveDocumentTemplate,
  useAdminUserProfile,
  useCreateInvoice,
  useCurrentOrg,
  useEffectiveRates,
  useEligibleTimeEntriesForInvoice,
  usePermissions,
  useReimbursementTypes,
  useVolunteersNeedingTimesheets,
  useYearlyUsage,
} from '@repo/data/react';
import { Input } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { FORM_ID as ORG_UNIT_EDIT_SHEET_ID } from '@/domain/org-unit/components/org-unit-create-edit-sheet';
import { useRouter } from '@/i18n/navigation';
import { useFormatting } from '@/lib/formatting/use-formatting';
import { fromPeriodBounds, toPeriodBounds } from '../lib/billing-period';
import {
  type DerivedField,
  deriveEditableFields,
} from '../lib/creation-fields';
import { mapEligibleTimeEntry } from '../lib/creation-modal.utils';
import { eligibleHoursEmptyReason } from '../lib/eligible-hours-empty';
import { centsToEuros, formatHourlyRate } from '../lib/money';
import {
  apiDocumentKindFor,
  pauschaleForReimbursementTypeKey,
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
import { ManualCapEditor } from './manual-cap-editor';
import type { DateRange } from './period-picker';
import { lastMonthRange, PeriodPicker, thisMonthRange } from './period-picker';
import { getKnownOrgValues } from './template/builder-document-presets';
import type {
  DataSourceKey,
  InvoiceNumberFormat,
} from './template/builder-types';
import { getManualFieldValue } from './template/builder-types';
import { GeneratedDocumentPreview } from './template/generated-document-preview';

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

interface InvoiceCreationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgUId: string;
  docId: string | null;
  volunteerId: string | null;
  volunteerName: string | null;
  pauschale: PauschalenType | null;
  onSent: () => void;
  /** The period to open on (a board row's month, or a declined timesheet's period); defaults to "this month". */
  initialPeriod?: { start: Date; end: Date } | null;
  /** See DocumentCreationDialog's embedded mode. */
  embedded?: boolean;
}

function periodToOpen(initial?: { start: Date; end: Date } | null): DateRange {
  if (!initial) return thisMonthRange();
  return fromPeriodBounds(initial.start, initial.end);
}

export function InvoiceCreationModal({
  open,
  onOpenChange,
  orgUId,
  docId,
  volunteerId,
  volunteerName,
  pauschale,
  onSent,
  initialPeriod,
  embedded,
}: InvoiceCreationModalProps) {
  const t = useTranslations('Accounting.reimbursements.invoiceModal');
  const tFields = useTranslations('Accounting.templates.builder.dataSources');
  const tManual = useTranslations(
    'Accounting.templates.builder.manualFieldLabels',
  );
  const tPauschale = useTranslations('Accounting.reimbursements.toolbar');
  const tPeriod = useTranslations(
    'Accounting.reimbursements.invoiceModal.periodPicker',
  );
  const tHours = useTranslations(
    'Accounting.reimbursements.invoiceModal.hoursCard',
  );

  const org = useCurrentOrg();
  // The org details the document will render (inherited from parent units,
  // refreshed on every profile edit); the page-load org is only a fallback.
  const orgProfile = useAccountingSetupStatus().data?.orgProfile;
  const router = useRouter();
  const permissionsQuery = usePermissions();

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

  const [derivedFields, setDerivedFields] = useState<DerivedField[] | null>(
    null,
  );
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [period, setPeriod] = useState<DateRange>(() =>
    periodToOpen(initialPeriod),
  );
  // Berlin calendar days with an exclusive end, the way periods are stored.
  const periodBounds = toPeriodBounds(period);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendErrorCode, setSendErrorCode] = useState<string | null>(null);

  const eligibleQuery = useEligibleTimeEntriesForInvoice({
    volunteerId: volunteerId ?? undefined,
    reimbursementTypeId: reimbursementType?.id,
    periodStart: periodBounds?.periodStart,
    periodEnd: periodBounds?.periodEnd,
  });
  // Only read to explain an empty Eligible hours list: the same entries
  // without the period, and this volunteer's hours under other types.
  const anyPeriodEligibleQuery = useEligibleTimeEntriesForInvoice({
    volunteerId: volunteerId ?? undefined,
    reimbursementTypeId: reimbursementType?.id,
  });
  const needsTimesheetInPeriodQuery = useVolunteersNeedingTimesheets({
    periodStart: periodBounds?.periodStart,
    periodEnd: periodBounds?.periodEnd,
  });
  // The volunteer's usage, not the signed-in coordinator's.
  const yearlyUsageQuery = useYearlyUsage({
    volunteerId: volunteerId ?? undefined,
    reimbursementTypeId: reimbursementType?.id,
    year: period.from?.getFullYear(),
    // The period end this invoice is saved with, which the PDF uses as its
    // cutoff, so the dialog and the document state the same figure.
    asOfDate: periodBounds?.periodEnd,
  });
  const formatting = useFormatting();
  const lines = useMemo(
    () =>
      (eligibleQuery.data ?? []).map((entry) =>
        mapEligibleTimeEntry(entry, formatting),
      ),
    [eligibleQuery.data, formatting],
  );

  const createInvoice = useCreateInvoice();

  // Reset local edits and the period whenever a different document/volunteer
  // is targeted — everything gets re-seeded from the freshly loaded data below.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional reset keyed on identity change, not a dependency read by the effect body
  useEffect(() => {
    setDerivedFields(null);
    setEditedValues({});
    setPeriod(periodToOpen(initialPeriod));
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
    eligibleQuery.isSuccess &&
    yearlyUsageQuery.isSuccess;
  const hasError =
    typesQuery.isError ||
    ratesQuery.isError ||
    profileQuery.isError ||
    invoiceTemplateQuery.isError ||
    contractTemplateQuery.isError ||
    eligibleQuery.isError ||
    yearlyUsageQuery.isError ||
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
    eligibleQuery.error ??
    yearlyUsageQuery.error;

  // The most common blocker: the org has the reimbursement type but no
  // invoice/contract template yet (org-default or unit-override). Offer a
  // direct CTA to the template builder instead of a dead end. An invoice
  // auto-drafts a contract, so a missing contract template blocks it too.
  const noInvoiceTemplate =
    invoiceTemplateQuery.error instanceof DataError &&
    invoiceTemplateQuery.error.options?.code === 'NOT_FOUND';
  const noContractTemplate =
    contractTemplateQuery.error instanceof DataError &&
    contractTemplateQuery.error.options?.code === 'NOT_FOUND';
  const createTemplateCta = () =>
    router.push(`/admin/${orgUId}/accounting/settings/templates`);

  const status: DocumentCreationLoadStatus = hasError
    ? 'error'
    : sendError
      ? 'error'
      : dataReady
        ? 'loaded'
        : 'loading';

  // Seed the editable fields once from the loaded profile/template, then leave
  // them alone — later re-renders shouldn't clobber a coordinator's edits.
  useEffect(() => {
    if (!dataReady || !template || derivedFields || !volunteerName) return;
    const profileData = (profileQuery.data?.data ?? {}) as Record<
      string,
      unknown
    >;
    setDerivedFields(
      deriveEditableFields(template, profileData, volunteerName),
    );
  }, [dataReady, template, derivedFields, profileQuery.data, volunteerName]);

  // Rendered unconditionally (per the ContractCreationModal precedent) so the
  // Dialog can drive its own open/close animation; nothing below needs the
  // nullable identity props once past this guard.
  if (!docId || !volunteerId || !volunteerName || !pauschale) return null;

  const isEdited = (fieldId: string) => Object.hasOwn(editedValues, fieldId);
  const currentValue = (
    fieldId: string,
    fallback: string | null,
  ): string | null =>
    isEdited(fieldId) ? (editedValues[fieldId] ?? null) : fallback;

  const handleFieldChange = (fieldId: string) => (value: string) => {
    setEditedValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const selectedLines = lines.filter((line) => checkedIds.has(line.id));
  const selectedHours = selectedLines.reduce(
    (sum, line) => sum + line.hours,
    0,
  );
  const selectedAmount = selectedHours * ratePerHour;
  // One source for the cap card, the projection and the Jahresdeckel
  // sentence, with the same cutoff the PDF uses. The dialog waits for it
  // (see dataReady) rather than showing the board's full-year figure.
  const usedBefore = centsToEuros(yearlyUsageQuery.data?.usedCents ?? 0);
  const totalCap = centsToEuros(yearlyUsageQuery.data?.limitCents ?? 0);
  const projectedAfter = usedBefore + selectedAmount;

  const toggleLine = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSend = async () => {
    if (!reimbursementType || !periodBounds) return;
    setIsSending(true);
    setSendError(null);
    setSendErrorCode(null);
    try {
      await createInvoice.mutateAsync({
        organizationUnitId: orgUId,
        reimbursementTypeId: reimbursementType.id,
        volunteerId,
        periodStart: periodBounds.periodStart,
        periodEnd: periodBounds.periodEnd,
        timeEntryIds: selectedLines.map((line) => line.id),
        fieldOverrides: (derivedFields ?? []).flatMap((field) =>
          isEdited(field.fieldId)
            ? field.fieldIds.map((id) => ({
                fieldId: id,
                value: editedValues[field.fieldId] ?? '',
              }))
            : [],
        ),
      });
      onOpenChange(false);
      toast.success(t('sentToast', { name: volunteerName }));
      onSent();
    } catch (error) {
      // Surface the real server error (e.g. "No invoice template configured
      // for reimbursement type …") instead of a generic "try again", and keep
      // the modal open so the coordinator can act on the reason.
      toast.error(t('sendErrorToast', { name: volunteerName }));
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
  // A missing template is an ordinary state, not an unexpected failure: show
  // the dedicated copy + CTA and never the raw server message (it carries the
  // internal reimbursement-type id).
  const noTemplate =
    noInvoiceTemplate || noContractTemplate || sendErrorIsNoTemplate;
  const sendErrorIsOrgProfile = /organization is missing/i.test(
    sendError ?? '',
  );
  const canEditOrg =
    permissionsQuery.data?.some((p) => p.key === PermissionKey.OrgEdit) ??
    false;
  const editOrgProfileCta = () =>
    router.push(
      `/admin/${orgUId}/settings/org-units?sheet=${ORG_UNIT_EDIT_SHEET_ID}&id=${orgUId}`,
    );

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

  const values: Partial<Record<DataSourceKey, string>> = {
    ...getKnownOrgValues({
      pauschale,
      orgName: orgProfile?.name ?? org.name,
      orgAddress: orgProfile ? orgProfile.address : org.address,
      orgCity: orgProfile ? orgProfile.city : org.city,
      orgZip: orgProfile ? orgProfile.zipCode : null,
      orgLegalRep: orgProfile ? orgProfile.legalRep : org.legalRep,
      hourlyRateCents: effectiveRate?.hourlyRateCents,
      yearlyLimitCents:
        effectiveRate?.reimbursementType.yearlyLimitCents ??
        reimbursementType?.yearlyLimitCents,
    }),
    generated_date: formatting.formatDate(new Date()),
    document_number:
      template?.invoiceNumberFormat && template
        ? formatDocumentNumber(
            template.invoiceNumberFormat,
            period,
            kostenstelle,
          )
        : undefined,
    period_start: formatting.formatDate(period.from ?? new Date()),
    period_end: formatting.formatDate(period.to ?? new Date()),
    contract_period: `${formatting.formatDate(period.from ?? new Date())} – ${formatting.formatDate(
      period.to ?? new Date(),
    )}`,
    // The Jahresdeckel sentence's "already received" figure is a running
    // calendar-year-to-date sum, not the invoice's own (monthly) period — so
    // its stated period runs from Jan 1 of that year through this period's
    // end, matching what the backend actually sums at generation time.
    already_received_period: `${formatting.formatDate(
      new Date((period.from ?? new Date()).getFullYear(), 0, 1),
    )} – ${formatting.formatDate(period.to ?? new Date())}`,
    already_received_amount:
      yearlyUsageQuery.data?.usedCents !== undefined
        ? `${centsToEuros(yearlyUsageQuery.data.usedCents).toLocaleString(
            'de-DE',
          )} €`
        : undefined,
  };
  for (const field of derivedFields ?? []) {
    if (field.kind !== 'bound' || !field.source) continue;
    const value = currentValue(field.fieldId, field.value);
    if (value) values[field.source] = value;
  }

  const emptyReason = eligibleHoursEmptyReason({
    listedCount: eligibleQuery.data?.length,
    anyPeriodCount: anyPeriodEligibleQuery.data?.length,
    otherTypeKeysInPeriod: needsTimesheetInPeriodQuery.data
      ?.filter(
        (row) =>
          row.volunteer.id === volunteerId &&
          row.reimbursementType.id !== reimbursementType?.id,
      )
      .map((row) => row.reimbursementType.key),
  });
  const hoursEmptyMessage =
    emptyReason?.kind === 'outside-period'
      ? tHours('emptyOutsidePeriod', { count: emptyReason.count })
      : emptyReason?.kind === 'other-type'
        ? tHours('emptyOtherType', {
            types: emptyReason.reimbursementTypeKeys
              .map((key) =>
                tPauschale(
                  `type${getPauschaleKey(pauschaleForReimbursementTypeKey(key)).toUpperCase()}` as Parameters<
                    typeof tPauschale
                  >[0],
                ),
              )
              .join(', '),
          })
        : emptyReason?.kind === 'nothing-tracked'
          ? tHours('emptyNothingTracked')
          : undefined;

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
      formatHourlyRate(line.hours * ratePerHour),
    ];
  });
  const tableTotalRow = [
    '',
    '',
    'Summe',
    `${selectedHours}h`,
    '',
    formatHourlyRate(selectedAmount),
  ];
  // The Pauschale reimbursement itself isn't a VAT-liable supply, but the rate is always 0% —
  // stated on every invoice regardless, never computed from the total.
  const tableVatRow = ['', '', 'zzgl. 0 % USt.', '', '', '0,00 €'];

  return (
    <DocumentCreationDialog
      open={open}
      onOpenChange={onOpenChange}
      embedded={embedded}
      title={t('title')}
      status={status}
      errorTitle={
        sendErrorIsOrgProfile
          ? t('orgProfileErrorTitle')
          : noTemplate
            ? t('noTemplateTitle')
            : sendError
              ? t('sendErrorTitle')
              : t('loadErrorTitle')
      }
      errorDescription={
        sendErrorIsOrgProfile
          ? t('orgProfileErrorDescription')
          : noTemplate
            ? t('noTemplateDescription', { pauschale: pauschaleLabel })
            : sendError
              ? t('sendError', { name: volunteerName })
              : t('loadError', { name: volunteerName })
      }
      errorMessage={
        sendErrorIsOrgProfile || noTemplate
          ? undefined
          : (sendError ??
            (loadError instanceof Error ? loadError.message : undefined))
      }
      errorCtaLabel={
        sendErrorIsOrgProfile
          ? canEditOrg
            ? t('editProfileCta')
            : undefined
          : noTemplate
            ? t('noTemplateCta')
            : undefined
      }
      errorCtaAction={
        sendErrorIsOrgProfile
          ? canEditOrg
            ? editOrgProfileCta
            : undefined
          : noTemplate
            ? createTemplateCta
            : undefined
      }
      errorCtaCentered={sendErrorIsOrgProfile}
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
            orgName={orgProfile?.name ?? org.name}
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
        derivedFields && (
          <>
            {derivedFields.map((field) =>
              field.kind === 'bound' ? (
                <AccountingProfileFieldCard
                  key={field.fieldId}
                  label={tFields(
                    field.labelKey as Parameters<typeof tFields>[0],
                  )}
                  value={currentValue(field.fieldId, field.value)}
                  provenance={
                    isEdited(field.fieldId)
                      ? 'override'
                      : field.provenance === 'template'
                        ? 'gap'
                        : field.provenance
                  }
                  volunteerName={volunteerName}
                  docType="invoice"
                  onSave={handleFieldChange(field.fieldId)}
                />
              ) : (
                <InfoPanel
                  key={field.fieldId}
                  title={tManual(
                    field.labelKey as Parameters<typeof tManual>[0],
                  )}
                >
                  <Input
                    className="mt-2"
                    value={currentValue(field.fieldId, field.value) ?? ''}
                    onChange={(e) =>
                      handleFieldChange(field.fieldId)(e.target.value)
                    }
                  />
                </InfoPanel>
              ),
            )}
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
              usedBefore={usedBefore}
              projectedAfter={projectedAfter}
              total={totalCap}
            />
            {reimbursementType && (
              <ManualCapEditor
                volunteerId={volunteerId}
                reimbursementTypeId={reimbursementType.id}
                year={period.from?.getFullYear() ?? new Date().getFullYear()}
                usedBefore={usedBefore}
                selectedAmount={selectedAmount}
              />
            )}
            <EligibleHoursCard
              lines={lines}
              selectedIds={checkedIds}
              onToggle={toggleLine}
              timesheetsHref={timesheetsHref}
              emptyMessage={hoursEmptyMessage}
            />
          </>
        )
      }
    />
  );
}

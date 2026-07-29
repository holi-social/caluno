'use client';

import { format } from 'date-fns';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AccountingProfileFieldCard } from './accounting-profile-field-card';
import { getPauschaleKey, type PauschalenType } from './doc-type-header';
import {
  DocumentCreationDialog,
  type DocumentCreationLoadStatus,
} from './document-creation-dialog';
import type { EligibleHourLine } from './eligible-hours-card';
import { EligibleHoursCard } from './eligible-hours-card';
import { InfoPanel } from './info-panel';
import { InvoiceCapCard } from './invoice-cap-card';
import type { DateRange } from './invoice-period-picker';
import { InvoicePeriodPicker } from './invoice-period-picker';
import { InvoicePreviewMock } from './invoice-preview-mock';
import { DEFAULT_PROFILE_DATA, MOCK_PROFILE_DATA } from './mock-profile-data';

interface EligibleHoursMockEntry {
  ratePerHour: number;
  lines: EligibleHourLine[];
}

const JONAS_BAUER_HOURS: EligibleHoursMockEntry = {
  ratePerHour: 15,
  lines: [
    {
      id: 'd17-1',
      shiftName: 'Sonntagsdienst',
      dateTime: '05.07.2026, 09:00–13:00',
      hours: 4,
    },
    {
      id: 'd17-2',
      shiftName: 'Vereinstraining Betreuung',
      dateTime: '09.07.2026, 17:00–21:00',
      hours: 4,
    },
    {
      id: 'd17-3',
      shiftName: 'Sommerfest Aufbau',
      dateTime: '12.07.2026, 10:00–14:00',
      hours: 4,
    },
  ],
};

// Mock — real wiring needs actual time-entry data reconciled per invoice
// period (dev dependency, see context file). Keyed to real timesheet-generate
// rows in reimbursements-board.tsx: d17 (Jonas Bauer, full profile) and d20
// (Lena Klein, IBAN gap — see mock-profile-data.ts). Any other doc id falls
// back to DEFAULT_ELIGIBLE_HOURS — every "Create" action stays testable.
const MOCK_ELIGIBLE_HOURS: Record<string, EligibleHoursMockEntry> = {
  d17: JONAS_BAUER_HOURS,
  d20: {
    ratePerHour: 15,
    lines: [
      {
        id: 'd20-1',
        shiftName: 'Kinderbetreuung Nachmittag',
        dateTime: '03.07.2026, 14:00–18:00',
        hours: 4,
      },
      {
        id: 'd20-2',
        shiftName: 'Vereinstraining Assistenz',
        dateTime: '10.07.2026, 16:00–20:00',
        hours: 4,
      },
    ],
  },
};

/** Fallback for any doc id not seeded above, so every Create action resolves. */
const DEFAULT_ELIGIBLE_HOURS: EligibleHoursMockEntry = JONAS_BAUER_HOURS;

// Mock — a real org display name doesn't exist in the data model yet (dev dependency).
const MOCK_ORG_NAME = 'Musterverein e.V.';

function defaultPeriod(): DateRange {
  const now = new Date();
  return {
    from: new Date(now.getFullYear(), now.getMonth(), 1),
    to: new Date(now.getFullYear(), now.getMonth() + 1, 0),
  };
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
}: InvoiceCreationModalProps) {
  const t = useTranslations('Accounting.reimbursements.invoiceModal');
  const tFields = useTranslations('Accounting.templates.builder.dataSources');
  const tPauschale = useTranslations('Accounting.reimbursements.toolbar');

  const [status, setStatus] = useState<DocumentCreationLoadStatus>('loading');
  const [nameField, setNameField] = useState<NameFieldState | null>(null);
  const [ibanField, setIbanField] = useState<IbanFieldState | null>(null);
  const [ratePerHour, setRatePerHour] = useState(0);
  const [lines, setLines] = useState<EligibleHourLine[]>([]);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [period, setPeriod] = useState<DateRange>(defaultPeriod);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStatus('loading');
    setNameField(null);
    setIbanField(null);
    setLines([]);
    setCheckedIds(new Set());
    setPeriod(defaultPeriod());

    const timeout = setTimeout(() => {
      if (!volunteerName) {
        setStatus('error');
        return;
      }
      const profile =
        (volunteerId && MOCK_PROFILE_DATA[volunteerId]) || DEFAULT_PROFILE_DATA;
      const hoursData =
        (docId && MOCK_ELIGIBLE_HOURS[docId]) || DEFAULT_ELIGIBLE_HOURS;
      setNameField({ value: volunteerName, provenance: 'profile' });
      setIbanField({
        value: profile.iban,
        provenance: profile.iban ? 'profile' : 'gap',
      });
      setRatePerHour(hoursData.ratePerHour);
      setLines(hoursData.lines);
      setCheckedIds(new Set(hoursData.lines.map((line) => line.id)));
      setStatus('loaded');
    }, 350);

    return () => clearTimeout(timeout);
  }, [open, volunteerId, docId, volunteerName]);

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

  const selectedHours = lines
    .filter((line) => checkedIds.has(line.id))
    .reduce((sum, line) => sum + line.hours, 0);
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
    setIsSending(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsSending(false);
    onOpenChange(false);
    toast.success(t('sentToast', { name: volunteerName }));
    onSent();
  };

  const pauschaleLabel = tPauschale(
    `type${getPauschaleKey(pauschale).toUpperCase()}` as Parameters<
      typeof tPauschale
    >[0],
  );

  const periodLabel = `${format(period.from ?? new Date(), 'dd.MM.yyyy')} – ${format(
    period.to ?? new Date(),
    'dd.MM.yyyy',
  )}`;

  // Same URL shape as DocumentSheet's "view on Timesheets" link — the route
  // doesn't read these params yet (dev dependency, see context file), but the
  // link commits to the shape that already exists elsewhere in this domain.
  const periodStart = period.from ?? new Date();
  const monthParam = `${periodStart.getFullYear()}-${String(periodStart.getMonth() + 1).padStart(2, '0')}`;
  const timesheetsHref = `/admin/${orgUId}/timesheets?month=${monthParam}&volunteer=${volunteerId}`;

  return (
    <DocumentCreationDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('title')}
      status={status}
      errorTitle={t('loadErrorTitle')}
      errorDescription={t('loadError', { name: volunteerName })}
      fieldsSkeletonKeys={['name', 'iban', 'period', 'cap', 'hours']}
      cancelLabel={t('cancel')}
      sendLabel={t('sendForSigning')}
      sendingLabel={t('sending')}
      isSending={isSending}
      onSend={handleSend}
      sendDisabled={selectedHours === 0}
      preview={
        <InvoicePreviewMock
          volunteerName={volunteerName}
          pauschale={pauschale}
          pauschaleLabel={pauschaleLabel}
          orgName={MOCK_ORG_NAME}
          iban={ibanField?.value ?? '—'}
          periodLabel={periodLabel}
          totalHours={selectedHours}
          totalAmount={selectedAmount}
        />
      }
      fields={
        nameField &&
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
                <InvoicePeriodPicker
                  value={period}
                  onChange={setPeriod}
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

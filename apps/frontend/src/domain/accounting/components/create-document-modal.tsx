'use client';

import {
  Button,
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  cn,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  InputGroupAddon,
} from '@repo/ui';
import { UserIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ContractCreationModal } from './contract-creation-modal';
import {
  DocTypeHeader,
  getPauschaleKey,
  type PauschalenType,
} from './doc-type-header';
import { InvoiceCreationModal } from './invoice-creation-modal';
import type { BoardDocument, BoardVolunteer } from './reimbursements-board';
import { STATUS_META } from './reimbursements-volunteer-group';

type DocKind = 'contract' | 'invoice';

interface DocLine {
  kind: DocKind;
  pauschale: PauschalenType;
}

/**
 * Base UI combobox item shape. The input shows the selected item's `label`
 * (the volunteer's name) while `value` keeps the volunteer id — without the
 * label, the input would display the raw uuid after selection.
 */
interface VolunteerOption {
  value: string;
  label: string;
}

// Grouped by Pauschale type, not by kind.
const LINES: DocLine[] = [
  { kind: 'contract', pauschale: 'ehrenamt' },
  { kind: 'invoice', pauschale: 'ehrenamt' },
  { kind: 'contract', pauschale: 'uebungsleiter' },
  { kind: 'invoice', pauschale: 'uebungsleiter' },
];

function lineKey(line: DocLine): string {
  return `${line.kind}-${line.pauschale}`;
}

interface DocLineSummary {
  count: number;
  latest?: BoardDocument;
}

function getDocLineSummary(vol: BoardVolunteer, line: DocLine): DocLineSummary {
  const prefix = line.kind === 'contract' ? 'contract' : 'timesheet';
  const matches = vol.documents.filter(
    (d) =>
      (d.pauschale ?? vol.pauschale) === line.pauschale &&
      d.status.startsWith(prefix),
  );
  const latest = matches.reduce<BoardDocument | undefined>((acc, d) => {
    if (!acc) return d;
    const accDate = acc.lastActionDate?.getTime();
    const dDate = d.lastActionDate?.getTime();
    if (dDate === undefined) return acc;
    if (accDate === undefined) return d;
    return dDate > accDate ? d : acc;
  }, undefined);
  return { count: matches.length, latest };
}

// Mirrors buildContractMissingDocs' id scheme for contracts.
function syntheticDocId(vol: BoardVolunteer, line: DocLine): string {
  return line.kind === 'contract'
    ? `${vol.id}-contract-missing-${line.pauschale}`
    : `${vol.id}-manual-invoice-${line.pauschale}`;
}

interface CreateDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgUId: string;
  volunteers: BoardVolunteer[];
  onContractSent: (docId: string) => void;
  onInvoiceSent: (docId: string) => void;
}

export function CreateDocumentModal({
  open,
  onOpenChange,
  orgUId,
  volunteers,
  onContractSent,
  onInvoiceSent,
}: CreateDocumentModalProps) {
  const t = useTranslations('Accounting.reimbursements');
  const tCommon = useTranslations('Common');
  const tDocs = useTranslations('Accounting.reimbursements.docs');
  const tSections = useTranslations('Accounting.templates.sections');

  const [step, setStep] = useState<1 | 2>(1);
  const [volunteerId, setVolunteerId] = useState<string | null>(null);
  const [selectedLine, setSelectedLine] = useState<DocLine | null>(null);
  // Keeps the combobox popup inside the radix Dialog's own subtree.
  const dialogBodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setStep(1);
      setVolunteerId(null);
      setSelectedLine(null);
    }
  }, [open]);

  const volunteer = volunteers.find((v) => v.id === volunteerId) ?? null;
  const volunteerOptions = useMemo(
    () => volunteers.map((v) => ({ value: v.id, label: v.name })),
    [volunteers],
  );
  const existingDoc =
    volunteer && selectedLine
      ? getDocLineSummary(volunteer, selectedLine).latest
      : undefined;
  const docId =
    volunteer && selectedLine
      ? (existingDoc?.id ?? syntheticDocId(volunteer, selectedLine))
      : null;

  function kindLabel(line: DocLine): string {
    return tDocs(
      `kindLabel.${line.kind === 'contract' ? 'contract' : 'timesheet'}`,
    );
  }

  function lineName(line: DocLine): string {
    return `${kindLabel(line)} ${tSections(getPauschaleKey(line.pauschale))}`;
  }

  function handleOpenChange(next: boolean) {
    if (!next) onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent size="lg">
        <DialogHeader className="shrink-0 border-b p-6">
          <p className="text-sm text-muted-foreground">
            {t('createDocumentModal.stepIndicator', { step, total: 2 })}
          </p>
          <DialogTitle>
            {step === 1
              ? t('createDocumentModal.step1Title')
              : t('createDocumentModal.step2Title')}
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div
            ref={dialogBodyRef}
            className="flex-1 space-y-6 overflow-y-auto p-6"
          >
            <Combobox
              items={volunteerOptions}
              onValueChange={(option: VolunteerOption | null) => {
                setVolunteerId(option?.value ?? null);
                setSelectedLine(null);
              }}
            >
              <ComboboxInput
                placeholder={t('createDocumentModal.volunteerPlaceholder')}
                className="w-full"
              >
                <InputGroupAddon>
                  <UserIcon />
                </InputGroupAddon>
              </ComboboxInput>
              <ComboboxContent container={dialogBodyRef}>
                <ComboboxEmpty>
                  {t('createDocumentModal.noVolunteersFound')}
                </ComboboxEmpty>
                <ComboboxList>
                  {(option: VolunteerOption) => (
                    <ComboboxItem key={option.value} value={option}>
                      {option.label}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>

            {volunteer && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-card-foreground">
                  {t('createDocumentModal.selectDocumentTitle')}
                </p>
                <div className="space-y-2">
                  {LINES.map((line) => {
                    const { count, latest } = getDocLineSummary(
                      volunteer,
                      line,
                    );
                    const selected =
                      selectedLine && lineKey(selectedLine) === lineKey(line);
                    return (
                      // The "view volunteer" stub button below sits as a
                      // sibling overlay, not a descendant: nesting a
                      // <button> inside this row's <button> would be
                      // invalid HTML (and breaks hydration).
                      <div key={lineKey(line)} className="relative">
                        <button
                          type="button"
                          onClick={() => setSelectedLine(line)}
                          className={cn(
                            'flex w-full items-center gap-4 rounded-xl border p-3 text-left transition-colors',
                            count > 0 && 'pr-28',
                            selected
                              ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                              : 'border-border bg-card hover:bg-muted',
                          )}
                        >
                          <DocTypeHeader
                            kind={line.kind}
                            pauschale={line.pauschale}
                            topLine=""
                            name={lineName(line)}
                            className="min-w-0 flex-1"
                          />

                          <div className="min-w-0 flex-1 text-sm">
                            {count > 0 ? (
                              <>
                                <p className="text-card-foreground">
                                  {t('createDocumentModal.documentCount', {
                                    count,
                                  })}
                                </p>
                                {latest && (
                                  <p className="text-xs text-muted-foreground">
                                    {t(
                                      `docs.statusLabel.${STATUS_META[latest.status].labelKey}` as Parameters<
                                        typeof t
                                      >[0],
                                    )}
                                    {latest.lastActionDate
                                      ? ` · ${latest.lastActionDate}`
                                      : ''}
                                  </p>
                                )}
                              </>
                            ) : (
                              <p className="text-muted-foreground">
                                {t('createDocumentModal.noDocumentYet')}
                              </p>
                            )}
                          </div>
                        </button>

                        {count > 0 && (
                          // A stub for now — needs a real userId to open
                          // the volunteer-profile sheet.
                          <button
                            type="button"
                            className="absolute inset-y-0 right-3 my-auto inline-flex h-8 shrink-0 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-medium whitespace-nowrap text-foreground shadow-xs"
                          >
                            {t('createDocumentModal.viewVolunteer')}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 2 &&
          volunteer &&
          selectedLine &&
          docId &&
          (selectedLine.kind === 'contract' ? (
            <ContractCreationModal
              embedded
              open
              onOpenChange={handleOpenChange}
              volunteerId={volunteer.id}
              volunteerName={volunteer.name}
              pauschale={selectedLine.pauschale}
              onSent={() => onContractSent(docId)}
            />
          ) : (
            <InvoiceCreationModal
              embedded
              open
              onOpenChange={handleOpenChange}
              orgUId={orgUId}
              docId={docId}
              volunteerId={volunteer.id}
              volunteerName={volunteer.name}
              pauschale={selectedLine.pauschale}
              usedBeforeAmount={
                volunteer.limits?.[selectedLine.pauschale]?.used ??
                volunteer.usedAmount
              }
              totalCapAmount={
                volunteer.limits?.[selectedLine.pauschale]?.total ??
                volunteer.totalCap
              }
              onSent={() => onInvoiceSent(docId)}
            />
          ))}

        {step === 1 && (
          <div className="flex shrink-0 justify-end gap-2 border-t p-6">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {tCommon('cancel')}
            </Button>
            <Button disabled={!selectedLine} onClick={() => setStep(2)}>
              {selectedLine
                ? t('createDocumentModal.createButton', {
                    kind: kindLabel(selectedLine),
                  })
                : t('createDocumentModal.createButtonEmpty')}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

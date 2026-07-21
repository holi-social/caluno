'use client';

import {
  Button,
  Checkbox,
  cn,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui';
import { ChevronDownIcon, FileTextIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { AlertIconTooltip } from './alert-icon-tooltip';
import type { PauschalenType } from './doc-type-header';
import { DocTypeHeader } from './doc-type-header';
import { LimitHeadroomBar } from './limit-headroom-bar';
import type { NonCompliantAction } from './non-compliant-timesheet-dialog';
import type {
  BoardDocument,
  BoardVolunteer,
  DateRange,
  DocStatus,
  DocVolPair,
  PauschalenLimit,
  TileFilter,
} from './reimbursements-board';
import {
  docVisibleInRange,
  getReadyToGoDocs,
  isTimesheetNonCompliant,
} from './reimbursements-board';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DocTypeFilter = 'all' | 'contract' | 'timesheet';

// ─── Status meta ──────────────────────────────────────────────────────────────

type ActionKey = 'create' | 'remind' | 'countersign';

interface StatusMeta {
  labelKey: string;
  actionKey: ActionKey | null;
  isYourAction: boolean;
}

const STATUS_META: Record<DocStatus, StatusMeta> = {
  'contract-generate': {
    labelKey: 'contractGenerate',
    actionKey: 'create',
    isYourAction: true,
  },
  'contract-signing-vol': {
    labelKey: 'contractSigningVol',
    actionKey: 'remind',
    isYourAction: false,
  },
  'contract-signing-coord': {
    labelKey: 'contractSigningCoord',
    actionKey: 'countersign',
    isYourAction: true,
  },
  'contract-active': {
    labelKey: 'contractActive',
    actionKey: null,
    isYourAction: false,
  },
  'contract-missing': {
    labelKey: 'contractMissing',
    actionKey: 'create',
    // false, not true: this keeps the row muted (bg-muted/20, see the
    // isYourAction check below) per the "at least in muted state" rule —
    // it still renders a Create button via actionKey, just outside the
    // normal actionable-count/sort weighting.
    isYourAction: false,
  },
  'timesheet-generate': {
    labelKey: 'timesheetGenerate',
    actionKey: 'create',
    isYourAction: true,
  },
  'timesheet-signing-vol': {
    labelKey: 'timesheetSigningVol',
    actionKey: 'remind',
    isYourAction: false,
  },
  'timesheet-signing-super': {
    labelKey: 'timesheetSigningSuper',
    actionKey: 'countersign',
    isYourAction: true,
  },
  'timesheet-ready': {
    labelKey: 'timesheetReady',
    actionKey: null,
    isYourAction: false,
  },
  'timesheet-muted': {
    labelKey: 'timesheetMuted',
    actionKey: null,
    isYourAction: false,
  },
};

// ─── CTA variant ──────────────────────────────────────────────────────────────

function getActionVariant(actionKey: ActionKey): 'default' | 'outline' {
  return actionKey === 'remind' ? 'outline' : 'default';
}

/** Whether this status is actionable by the org (coordinator/supervisor) right now, as opposed to waiting on the volunteer or already resolved. */
export function isYourActionStatus(status: DocStatus): boolean {
  return STATUS_META[status].isYourAction;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatEuro(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** "Julia Vorstand" -> "J. Vorstand" */
function abbreviateName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name;
  const [first, ...rest] = parts;
  return `${first![0]}. ${rest.join(' ')}`;
}

const STATUS_SORT_ORDER: DocStatus[] = [
  'contract-generate',
  'timesheet-generate',
  'contract-missing',
  'contract-signing-coord',
  'timesheet-signing-super',
  'timesheet-ready',
  'contract-signing-vol',
  'timesheet-signing-vol',
  'contract-active',
  'timesheet-muted',
];

// ─── Mock: last bundle download per volunteer + pauschale type ───────────────

const MOCK_LAST_BUNDLE_DOWNLOAD: Record<
  string,
  Partial<Record<PauschalenType, { by: string; at: string }>>
> = {
  v1: { ehrenamt: { by: 'Julia Vorstand', at: '05.07.2026' } },
  v8: { ehrenamt: { by: 'Julia Vorstand', at: '30.06.2026' } },
  v33: {
    ehrenamt: { by: 'Julia Vorstand', at: '30.05.2026' },
    uebungleiter: { by: 'Markus Kassier', at: '30.05.2026' },
  },
};

// ─── VolunteerTableGroup ──────────────────────────────────────────────────────

interface VolunteerTableGroupProps {
  vol: BoardVolunteer;
  selectedDocIds: Set<string>;
  onToggleDoc: (docId: string) => void;
  onToggleVolDocs: (vol: BoardVolunteer) => void;
  onDocumentClick: (doc: BoardDocument, vol: BoardVolunteer) => void;
  onRequestAction: (items: DocVolPair[], action: NonCompliantAction) => void;
  docTypeFilter: DocTypeFilter;
  dateRange: DateRange | undefined;
  activeTile: TileFilter;
}

function VolunteerTableGroup({
  vol,
  selectedDocIds,
  onToggleDoc,
  onToggleVolDocs,
  onDocumentClick,
  onRequestAction,
  docTypeFilter,
  dateRange,
  activeTile,
}: VolunteerTableGroupProps) {
  const t = useTranslations('Accounting.reimbursements');
  const [isOpen, setIsOpen] = useState(true);

  // Ready-to-go gets its own row set (ready timesheets + one contract row
  // per pauschale in play — real if it exists, a greyed placeholder if
  // not); every other tab filters the volunteer's real documents by
  // doc-type + date, without ever touching `vol.documents` itself so
  // compliance checks stay accurate regardless of what's on screen.
  const visibleDocs =
    activeTile === 'ready-to-go'
      ? getReadyToGoDocs(vol, dateRange)
      : vol.documents
          .filter(
            (doc) =>
              docTypeFilter === 'all' || doc.status.startsWith(docTypeFilter),
          )
          .filter((doc) => docVisibleInRange(doc, dateRange));

  const sortedDocs = [...visibleDocs].sort(
    (a, b) =>
      STATUS_SORT_ORDER.indexOf(a.status) - STATUS_SORT_ORDER.indexOf(b.status),
  );

  if (sortedDocs.length === 0) return null;

  // Ready timesheets bundle separately per pauschale type — never combined
  // into one download, since each type is its own reimbursement batch.
  const readyByType: Partial<Record<PauschalenType, number>> = {};
  for (const d of sortedDocs) {
    if (d.status !== 'timesheet-ready') continue;
    const type = d.pauschale ?? vol.pauschale;
    readyByType[type] = (readyByType[type] ?? 0) + 1;
  }
  const readyTypes = Object.keys(readyByType) as PauschalenType[];
  const TYPE_LABEL: Record<PauschalenType, string> = {
    ehrenamt: t('toolbar.typeEP'),
    uebungleiter: t('toolbar.typeUL'),
  };

  // Checkbox state for vol header
  const selectedCount = sortedDocs.filter((d) =>
    selectedDocIds.has(d.id),
  ).length;
  const isVolChecked =
    selectedCount === sortedDocs.length && sortedDocs.length > 0;
  const isVolIndeterminate =
    selectedCount > 0 && selectedCount < sortedDocs.length;

  return (
    <>
      {/* Volunteer group header */}
      <TableRow
        className={cn(
          'cursor-pointer select-none border-t border-border/60 hover:bg-muted/40',
          selectedCount > 0 ? 'bg-primary/5' : 'bg-muted/20',
        )}
        onClick={() => setIsOpen((o) => !o)}
      >
        <TableCell
          className="align-middle py-4"
          onClick={(e) => e.stopPropagation()}
        >
          <Checkbox
            checked={isVolIndeterminate ? 'indeterminate' : isVolChecked}
            onCheckedChange={() => onToggleVolDocs(vol)}
            aria-label={`${vol.name} auswählen`}
          />
        </TableCell>

        <TableCell className="align-middle overflow-hidden py-4">
          <div className="min-w-0 overflow-hidden">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base font-medium text-card-foreground truncate">
                {vol.name}
              </span>
            </div>
            {vol.limits && Object.keys(vol.limits).length > 1 ? (
              <div className="flex gap-2 mt-1">
                {(
                  Object.entries(vol.limits) as [
                    PauschalenType,
                    PauschalenLimit,
                  ][]
                ).map(([, lim]) => (
                  <LimitHeadroomBar
                    key={lim.total}
                    used={lim.used}
                    total={lim.total}
                    density="text"
                  />
                ))}
              </div>
            ) : (
              <LimitHeadroomBar
                used={vol.usedAmount}
                total={vol.totalCap}
                density="text"
                className="mt-1"
              />
            )}
          </div>
        </TableCell>

        <TableCell className="align-middle py-4" />

        <TableCell className="align-middle py-4" />
        <TableCell className="align-middle py-4" />

        <TableCell className="align-middle py-4">
          {/* Bundle buttons stop propagation; chevron lets click through to row */}
          <div className="flex items-center gap-3 justify-end">
            {readyTypes.length > 0 && (
              <div className="flex flex-col items-end gap-3">
                {readyTypes.map((type) => {
                  const download = MOCK_LAST_BUNDLE_DOWNLOAD[vol.id]?.[type];
                  const readyCount = readyByType[type] ?? 0;
                  return (
                    <div
                      key={type}
                      className="flex flex-col items-end gap-1 max-w-[220px]"
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          toast.success(
                            t('batchBar.bundleDownloadToast', {
                              count: readyCount,
                            }),
                          );
                        }}
                      >
                        <FileTextIcon size={13} />
                        {t('bundle.actionLabel')} · {readyCount}
                      </Button>
                      <span className="text-xs text-muted-foreground text-right leading-snug">
                        <span className="font-medium text-card-foreground">
                          {TYPE_LABEL[type]}
                        </span>{' '}
                        ·{' '}
                        {download
                          ? t.rich('bundle.lastDownloaded', {
                              by: abbreviateName(download.by),
                              at: download.at,
                              // Stubbed: no volunteer-profile route exists yet
                              // in this prototype — becomes a real link there.
                              name: (chunks) => (
                                <button
                                  type="button"
                                  className="text-primary hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {chunks}
                                </button>
                              ),
                            })
                          : t('bundle.neverDownloaded')}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            <ChevronDownIcon
              size={16}
              className={cn(
                'text-muted-foreground transition-transform duration-200 shrink-0',
                isOpen && 'rotate-180',
              )}
            />
          </div>
        </TableCell>
      </TableRow>

      {/* Document rows */}
      {isOpen &&
        sortedDocs.map((doc) => {
          const meta = STATUS_META[doc.status];
          const actionKey = meta.actionKey;
          const isActive = doc.status === 'contract-active';
          const isTimesheet = doc.status.startsWith('timesheet');
          const isGenerate =
            doc.status === 'contract-generate' ||
            doc.status === 'timesheet-generate';
          // Contract-generate has nothing to show yet (no signing chain has
          // started); timesheet-generate already has computed hours/amount,
          // so it stays visually dimmed but is still openable.
          const canOpenSheet = doc.status !== 'contract-generate';
          const isDocSelected = selectedDocIds.has(doc.id);
          const effectivePauschale = doc.pauschale ?? vol.pauschale;
          const docNonCompliant = isTimesheetNonCompliant(vol, doc);

          return (
            <TableRow
              key={doc.id}
              className={cn(
                'transition-colors',
                canOpenSheet
                  ? 'cursor-pointer hover:bg-muted/30'
                  : 'cursor-default',
                !isActive && !meta.isYourAction && !isGenerate && 'bg-muted/20',
                isDocSelected && 'bg-primary/5',
              )}
              onClick={() => canOpenSheet && onDocumentClick(doc, vol)}
            >
              <TableCell
                className="py-3 align-top"
                onClick={(e) => e.stopPropagation()}
              >
                {!isActive && !isGenerate && (
                  <Checkbox
                    checked={isDocSelected}
                    onCheckedChange={() => onToggleDoc(doc.id)}
                    aria-label={`${doc.periodLabel} auswählen`}
                  />
                )}
              </TableCell>

              <TableCell
                className={cn(
                  'pl-6 py-3 align-top overflow-hidden',
                  isGenerate && 'opacity-40',
                )}
              >
                <DocTypeHeader
                  kind={isTimesheet ? 'invoice' : 'contract'}
                  pauschale={doc.pauschale ?? vol.pauschale}
                  topLine={doc.periodLabel}
                  name={t(
                    `docs.kindLabel.${isTimesheet ? 'timesheet' : 'contract'}` as Parameters<
                      typeof t
                    >[0],
                  )}
                />
              </TableCell>

              <TableCell className="py-3 align-top text-left">
                <div className="flex flex-col gap-1">
                  {docNonCompliant && (
                    <span className="text-sm text-alert">
                      {t(
                        'docs.statusLabel.nonCompliant' as Parameters<
                          typeof t
                        >[0],
                      )}
                    </span>
                  )}
                  {doc.isOverCap && (
                    <span className="text-sm text-destructive">
                      {t('docs.statusLabel.overCap' as Parameters<typeof t>[0])}
                    </span>
                  )}
                  {isGenerate && (
                    <span className="text-sm text-muted-foreground">
                      {t(
                        'docs.statusLabel.notYetCreated' as Parameters<
                          typeof t
                        >[0],
                      )}
                    </span>
                  )}
                  {doc.status === 'contract-missing' && (
                    <span className="text-sm text-muted-foreground">
                      {t(
                        'docs.statusLabel.contractMissing' as Parameters<
                          typeof t
                        >[0],
                      )}
                    </span>
                  )}
                  {doc.status === 'timesheet-muted' && (
                    <span className="text-sm text-muted-foreground">
                      {t(
                        'docs.statusLabel.timesheetMuted' as Parameters<
                          typeof t
                        >[0],
                      )}
                    </span>
                  )}
                </div>
              </TableCell>

              <TableCell className="py-3 align-top text-right">
                {isTimesheet && doc.hours !== undefined && (
                  <span className="text-sm tabular-nums text-card-foreground">
                    {doc.hours}h
                  </span>
                )}
              </TableCell>

              <TableCell className="py-3 align-top text-right">
                {isTimesheet && doc.amount !== undefined && (
                  <span className="text-sm font-medium tabular-nums text-card-foreground">
                    {formatEuro(doc.amount)}
                  </span>
                )}
              </TableCell>

              <TableCell className="py-3 align-top">
                <div className="flex items-center justify-end gap-2">
                  {docNonCompliant && actionKey && (
                    <AlertIconTooltip
                      hint={t(
                        'docs.statusLabel.nonCompliantHint' as Parameters<
                          typeof t
                        >[0],
                      )}
                      className="text-alert"
                    />
                  )}
                  {!isActive && actionKey && (
                    <Button
                      size="sm"
                      variant={getActionVariant(actionKey)}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRequestAction([{ doc, vol }], actionKey);
                      }}
                    >
                      {t(
                        `docs.actions.${actionKey}` as Parameters<typeof t>[0],
                      )}
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
    </>
  );
}

// ─── ReimbursementsTable ──────────────────────────────────────────────────────

interface ReimbursementsTableProps {
  vols: BoardVolunteer[];
  selectedDocIds: Set<string>;
  onToggleDoc: (docId: string) => void;
  onToggleVolDocs: (vol: BoardVolunteer) => void;
  onToggleAll: (docIds: string[], select: boolean) => void;
  onDocumentClick: (doc: BoardDocument, vol: BoardVolunteer) => void;
  onRequestAction: (items: DocVolPair[], action: NonCompliantAction) => void;
  docTypeFilter: DocTypeFilter;
  dateRange: DateRange | undefined;
  activeTile: TileFilter;
}

export function ReimbursementsTable({
  vols,
  selectedDocIds,
  onToggleDoc,
  onToggleVolDocs,
  onToggleAll,
  onDocumentClick,
  onRequestAction,
  docTypeFilter,
  dateRange,
  activeTile,
}: ReimbursementsTableProps) {
  const t = useTranslations('Accounting.reimbursements');

  const allVisibleDocIds = vols.flatMap((v) => {
    const visible =
      activeTile === 'ready-to-go'
        ? getReadyToGoDocs(v, dateRange)
        : v.documents
            .filter(
              (d) =>
                docTypeFilter === 'all' || d.status.startsWith(docTypeFilter),
            )
            .filter((d) => docVisibleInRange(d, dateRange));
    return visible
      .filter((d) => d.status !== 'contract-active')
      .map((d) => d.id);
  });

  const allSelected =
    allVisibleDocIds.length > 0 &&
    allVisibleDocIds.every((id) => selectedDocIds.has(id));
  const someSelected = allVisibleDocIds.some((id) => selectedDocIds.has(id));

  return (
    <div className="rounded-xl border border-border overflow-x-auto">
      <Table className="table-fixed min-w-[860px]">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-10">
              <Checkbox
                checked={
                  someSelected && !allSelected ? 'indeterminate' : allSelected
                }
                onCheckedChange={(checked) =>
                  onToggleAll(allVisibleDocIds, checked === true)
                }
                aria-label="Alle auswählen"
              />
            </TableHead>
            <TableHead className="w-52">{t('tableHead.volunteer')}</TableHead>
            <TableHead className="w-36">{t('tableHead.status')}</TableHead>
            <TableHead className="w-14 text-right">
              {t('tableHead.hours')}
            </TableHead>
            <TableHead className="w-24 text-right">
              {t('tableHead.amount')}
            </TableHead>
            <TableHead className="w-36 text-right">
              {t('tableHead.action')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vols.map((vol) => (
            <VolunteerTableGroup
              key={vol.id}
              vol={vol}
              selectedDocIds={selectedDocIds}
              onToggleDoc={onToggleDoc}
              onToggleVolDocs={onToggleVolDocs}
              onDocumentClick={onDocumentClick}
              onRequestAction={onRequestAction}
              docTypeFilter={docTypeFilter}
              dateRange={dateRange}
              activeTile={activeTile}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

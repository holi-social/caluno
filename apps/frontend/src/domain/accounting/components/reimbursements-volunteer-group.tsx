'use client';

import {
  useBundleDownloadStatus,
  useRecordBundleDownload,
} from '@repo/data/react';
import {
  Button,
  cn,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui';
import { format } from 'date-fns';
import { ChevronDownIcon, FileTextIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { formatEuro } from '@/lib/formatting/formats';
import { AlertIconTooltip } from './alert-icon-tooltip';
import type { PauschalenType } from './doc-type-header';
import { DocTypeHeader, getPauschaleKey } from './doc-type-header';
import { LimitHeadroomBar } from './limit-headroom-bar';
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

type ActionKey = 'create' | 'countersign';

interface StatusMeta {
  labelKey: string;
  actionKey: ActionKey | null;
  isYourAction: boolean;
}

export const STATUS_META: Record<DocStatus, StatusMeta> = {
  'contract-generate': {
    labelKey: 'contractGenerate',
    actionKey: 'create',
    isYourAction: true,
  },
  'contract-signing-vol': {
    labelKey: 'contractSigningVol',
    actionKey: null,
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
    actionKey: null,
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
  'contract-declined': {
    labelKey: 'declined',
    actionKey: 'create',
    isYourAction: true,
  },
  'timesheet-declined': {
    labelKey: 'declined',
    actionKey: 'create',
    isYourAction: true,
  },
};

/** Whether this status is actionable by the org (coordinator/supervisor) right now, as opposed to waiting on the volunteer or already resolved. */
export function isYourActionStatus(status: DocStatus): boolean {
  return STATUS_META[status].isYourAction;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** "Julia Vorstand" -> "J. Vorstand" */
function abbreviateName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name;
  const [first, ...rest] = parts;
  return `${first?.[0] ?? ''}. ${rest.join(' ')}`;
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
  'contract-declined',
  'timesheet-declined',
];

// ─── BundleDownloadButton ──────────────────────────────────────────────────────

interface BundleDownloadButtonProps {
  volunteerId: string;
  reimbursementTypeId: string | undefined;
  typeLabel: string;
  readyCount: number;
}

/**
 * Own component (not inlined in the readyTypes.map()) because it calls
 * hooks — useBundleDownloadStatus/useRecordBundleDownload can't live
 * inside a .map() callback per rules-of-hooks.
 */
function BundleDownloadButton({
  volunteerId,
  reimbursementTypeId,
  typeLabel,
  readyCount,
}: BundleDownloadButtonProps) {
  const t = useTranslations('Accounting.reimbursements');
  const { data: status, isLoading } = useBundleDownloadStatus(
    volunteerId,
    reimbursementTypeId,
  );
  const recordDownload = useRecordBundleDownload();

  return (
    <div className="flex flex-col items-end gap-1 max-w-[220px]">
      <Button
        size="sm"
        variant="outline"
        className="gap-1.5 shrink-0"
        disabled={!reimbursementTypeId || recordDownload.isPending}
        onClick={(e) => {
          e.stopPropagation();
          if (!reimbursementTypeId || recordDownload.isPending) return;
          recordDownload.mutate(
            { volunteerId, reimbursementTypeId },
            {
              onSuccess: () => {
                toast.success(
                  t('batchBar.bundleDownloadToast', { count: readyCount }),
                );
              },
            },
          );
        }}
      >
        <FileTextIcon size={13} />
        {t('bundle.actionLabel')} · {readyCount}
      </Button>
      <span className="text-xs text-muted-foreground text-right leading-snug">
        <span className="font-medium text-card-foreground">{typeLabel}</span> ·{' '}
        {isLoading
          ? null
          : status
            ? t.rich('bundle.lastDownloaded', {
                by: status.downloadedByUser?.name
                  ? abbreviateName(status.downloadedByUser.name)
                  : t('bundle.unknownUser'),
                at: format(new Date(status.downloadedAt), 'dd.MM.yyyy'),
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
}

// ─── VolunteerTableGroup ──────────────────────────────────────────────────────

interface VolunteerTableGroupProps {
  vol: BoardVolunteer;
  onDocumentClick: (doc: BoardDocument, vol: BoardVolunteer) => void;
  onRequestCreate: (pair: DocVolPair) => void;
  onRequestSign: (pair: DocVolPair) => void;
  docTypeFilter: DocTypeFilter;
  dateRange: DateRange | undefined;
  activeTile: TileFilter;
}

function VolunteerTableGroup({
  vol,
  onDocumentClick,
  onRequestCreate,
  onRequestSign,
  docTypeFilter,
  dateRange,
  activeTile,
}: VolunteerTableGroupProps) {
  const t = useTranslations('Accounting.reimbursements');
  const tSections = useTranslations('Accounting.templates.sections');
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
    uebungsleiter: t('toolbar.typeUL'),
  };

  return (
    <>
      {/* Volunteer group header */}
      <TableRow
        className={cn(
          'cursor-pointer select-none border-t border-border/60 hover:bg-muted/40',
          'bg-muted/20',
        )}
        onClick={() => setIsOpen((o) => !o)}
      >
        <TableCell className="align-middle overflow-hidden py-4">
          <div className="min-w-0 overflow-hidden">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base font-medium text-card-foreground truncate">
                {vol.name}
              </span>
            </div>
            {vol.limits && Object.keys(vol.limits).length > 1 ? (
              <div className="flex flex-col gap-1 mt-1">
                {(
                  Object.entries(vol.limits) as [
                    PauschalenType,
                    PauschalenLimit,
                  ][]
                ).map(([type, lim]) => (
                  <LimitHeadroomBar
                    key={type}
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
                {readyTypes.map((type) => (
                  <BundleDownloadButton
                    key={type}
                    volunteerId={vol.id}
                    reimbursementTypeId={vol.reimbursementTypeIds?.[type]}
                    typeLabel={TYPE_LABEL[type]}
                    readyCount={readyByType[type] ?? 0}
                  />
                ))}
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
          const effectivePauschale = doc.pauschale ?? vol.pauschale;
          const docNonCompliant = isTimesheetNonCompliant(vol, doc);
          const isDeclined =
            doc.status === 'contract-declined' ||
            doc.status === 'timesheet-declined';

          return (
            <TableRow
              key={doc.id}
              className={cn(
                'transition-colors',
                canOpenSheet
                  ? 'cursor-pointer hover:bg-muted/30'
                  : 'cursor-default',
                !isActive && !meta.isYourAction && !isGenerate && 'bg-muted/20',
              )}
              onClick={() => canOpenSheet && onDocumentClick(doc, vol)}
            >
              <TableCell
                className={cn(
                  'pl-6 py-3 align-top overflow-hidden',
                  isGenerate && 'opacity-40',
                )}
              >
                <DocTypeHeader
                  kind={isTimesheet ? 'invoice' : 'contract'}
                  pauschale={effectivePauschale}
                  topLine={doc.periodLabel}
                  name={`${t(
                    `docs.kindLabel.${isTimesheet ? 'timesheet' : 'contract'}` as Parameters<
                      typeof t
                    >[0],
                  )} ${tSections(
                    getPauschaleKey(effectivePauschale) as Parameters<
                      typeof tSections
                    >[0],
                  )}`}
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
                  {isDeclined && (
                    <span className="text-sm font-medium text-alert">
                      {t(
                        'docs.statusLabel.declined' as Parameters<typeof t>[0],
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
                  {isDeclined && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDocumentClick(doc, vol);
                      }}
                    >
                      {t('docs.actions.seeDetails' as Parameters<typeof t>[0])}
                    </Button>
                  )}
                  {!isActive && !isDeclined && actionKey && (
                    <Button
                      size="sm"
                      variant={actionKey === 'create' ? 'default' : 'outline'}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (actionKey === 'create') {
                          onRequestCreate({ doc, vol });
                        } else {
                          onRequestSign({ doc, vol });
                        }
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
  onDocumentClick: (doc: BoardDocument, vol: BoardVolunteer) => void;
  onRequestCreate: (pair: DocVolPair) => void;
  onRequestSign: (pair: DocVolPair) => void;
  docTypeFilter: DocTypeFilter;
  dateRange: DateRange | undefined;
  activeTile: TileFilter;
}

export function ReimbursementsTable({
  vols,
  onDocumentClick,
  onRequestCreate,
  onRequestSign,
  docTypeFilter,
  dateRange,
  activeTile,
}: ReimbursementsTableProps) {
  const t = useTranslations('Accounting.reimbursements');

  return (
    <div className="rounded-xl border border-border overflow-x-auto">
      <Table className="table-fixed min-w-[860px]">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
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
              onDocumentClick={onDocumentClick}
              onRequestCreate={onRequestCreate}
              onRequestSign={onRequestSign}
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

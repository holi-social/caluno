'use client';

import {
  useDeclineContract,
  useDeclineInvoice,
  useSignContract,
  useSignInvoice,
} from '@repo/data/react';
import {
  cn,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from '@repo/ui';
import {
  ArrowUpDownIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  FilterXIcon,
  SearchIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Fragment, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useReimbursementBoardData } from '../hooks/use-reimbursement-board-data';
import { ContractCreationModal } from './contract-creation-modal';
import { CreateDocumentModal } from './create-document-modal';
import type { PauschalenType } from './doc-type-header';
import { InvoiceCreationModal } from './invoice-creation-modal';
import type { DateRange } from './period-picker';
import { lastMonthRange, PeriodPicker, thisMonthRange } from './period-picker';
import { DocumentSheet } from './reimbursements-document-sheet';
import {
  type DocTypeFilter,
  isYourActionStatus,
  ReimbursementsTable,
} from './reimbursements-volunteer-group';
import type { SigneeRole } from './template/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DocStatus =
  | 'contract-generate'
  | 'contract-signing-vol'
  | 'contract-signing-coord'
  | 'contract-active'
  // Muted placeholder: implied by a 'timesheet-muted' sibling (or a
  // search-only, zero-document volunteer) but no contract flow has actually
  // been started. Not part of the automatic signup-triggered flow, so it
  // never counts toward the Contract·Generate tile — resolved only via the
  // manual "Create contract" action.
  | 'contract-missing'
  | 'timesheet-generate'
  | 'timesheet-signing-vol'
  | 'timesheet-signing-super'
  | 'timesheet-ready'
  // Passive record: eligible hours from a paid shift where the contract
  // gate was bypassed. Rate × hours is still shown, but there's no "create"
  // CTA on this row — the fix is the paired contract-missing row instead.
  | 'timesheet-muted'
  // Terminal: signer rejected the document. Dead end — the fix is
  // reissuing a new document, never resuming this one.
  | 'contract-declined'
  | 'timesheet-declined';

export type TileFilter =
  | 'contract-generate'
  | 'contract-signing'
  | 'timesheet-generate'
  | 'timesheet-signing'
  | 'needs-timesheet'
  | 'ready-to-go'
  | null;

type PauschalenFilter = 'all' | PauschalenType;
type SortOption = 'action-needed' | 'newest';

export type { DateRange };

const TILE_IDS: Exclude<TileFilter, null>[] = [
  'contract-generate',
  'contract-signing',
  'timesheet-generate',
  'timesheet-signing',
  'needs-timesheet',
  'ready-to-go',
];

export interface BoardDocument {
  id: string;
  status: DocStatus;
  amount?: number;
  hours?: number;
  lastActionDate?: Date;
  periodLabel: string;
  /** Manually flagged: this timesheet's amount pushed the volunteer at/over their yearly cap. Unrelated to contract compliance. */
  isOverCap?: boolean;
  pauschale?: PauschalenType;
  /** Set together when a signer rejects the document (contract-declined/timesheet-declined only). */
  declineReason?: string;
  declinedBy?: string;
  declinedAt?: Date;
  /** Which seat in the signing chain declined — determines where the pipeline/timeline gets cut off. */
  declinedAtRole?: SigneeRole;
}

export interface PauschalenLimit {
  used: number;
  total: number;
}

export interface BoardVolunteer {
  id: string;
  name: string;
  initials: string;
  pauschale: PauschalenType;
  usedAmount: number;
  totalCap: number;
  limits?: Partial<Record<PauschalenType, PauschalenLimit>>;
  /** Maps each pauschale type the volunteer is eligible for to its reimbursement type id. */
  reimbursementTypeIds?: Partial<Record<PauschalenType, string>>;
  /** True when the volunteer still has eligible (unclaimed, completed, in-period) time entries — i.e. the org still needs to create their timesheet. */
  needsTimesheet: boolean;
  documents: BoardDocument[];
}

/** A document paired with the volunteer it belongs to — needed once actions act across volunteers. */
export interface DocVolPair {
  doc: BoardDocument;
  vol: BoardVolunteer;
}

/**
 * A timesheet is non-compliant when no active contract exists for its pauschale type —
 * contracts must be active before a timesheet can be created. Derived, not stored, so it
 * always reflects the volunteer's current contract state.
 */
export function isTimesheetNonCompliant(
  vol: BoardVolunteer,
  doc: BoardDocument,
): boolean {
  if (!doc.status.startsWith('timesheet')) return false;
  // Declined is a terminal dead end on its own — reissuing is the fix, not
  // the paired contract, so it never carries the non-compliant flag too.
  if (doc.status === 'timesheet-declined') return false;
  const pauschale = doc.pauschale ?? vol.pauschale;
  return !vol.documents.some(
    (d) =>
      d.status === 'contract-active' &&
      (d.pauschale ?? vol.pauschale) === pauschale,
  );
}

function findContractDoc(
  vol: BoardVolunteer,
  pauschale: PauschalenType,
): BoardDocument | undefined {
  return vol.documents.find(
    (d) =>
      d.status.startsWith('contract') &&
      (d.pauschale ?? vol.pauschale) === pauschale,
  );
}

/**
 * Row set for the "Ready to go" tab: only the ready timesheets (date-scoped)
 * plus, per pauschale type they cover, that type's real contract document —
 * whatever its status, so an in-progress signing keeps its normal action —
 * or a synthesized, greyed `contract-missing` placeholder for the
 * timesheet's year when no contract exists at all. Every other document
 * (generate/signing docs from other periods) is excluded, so nothing but the
 * bundle-download action and this one placeholder's "Create" can surface
 * here.
 */
export function getReadyToGoDocs(
  vol: BoardVolunteer,
  range: DateRange | undefined,
): BoardDocument[] {
  const readyTimesheets = vol.documents.filter(
    (d) => d.status === 'timesheet-ready' && docInRange(d, range),
  );
  if (readyTimesheets.length === 0) return [];

  const pauschaleTypes = Array.from(
    new Set(readyTimesheets.map((d) => d.pauschale ?? vol.pauschale)),
  );

  const contractRows: BoardDocument[] = pauschaleTypes.map((type) => {
    const contract = findContractDoc(vol, type);
    if (contract) return contract;

    const sample = readyTimesheets.find(
      (d) => (d.pauschale ?? vol.pauschale) === type,
    );
    const year = (sample && periodYear(sample)) ?? '';
    return {
      id: `${vol.id}-contract-missing-${type}-${year}`,
      status: 'contract-missing',
      periodLabel: year,
      pauschale: type,
    };
  });

  return [...readyTimesheets, ...contractRows];
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function docInRange(doc: BoardDocument, range: DateRange | undefined): boolean {
  if (!range?.from) return true;
  if (!doc.lastActionDate) return true;
  const to = range.to ?? range.from;
  return doc.lastActionDate >= range.from && doc.lastActionDate <= to;
}

/** A contract's `periodLabel` is its coverage year (e.g. "2026"); a timesheet's is "<Month> <year>" — either way the year is the last 4 digits. */
function periodYear(doc: BoardDocument): string | undefined {
  return doc.periodLabel.match(/\d{4}/)?.[0];
}

/** Contracts run the calendar year, so they're "in range" whenever their year overlaps the selected period — never by the exact day they were signed. */
function contractCoversRange(doc: BoardDocument, range: DateRange): boolean {
  const year = periodYear(doc);
  if (!year || !range.from) return true;
  const fromYear = range.from.getFullYear();
  const toYear = (range.to ?? range.from).getFullYear();
  const y = Number(year);
  return y >= fromYear && y <= toYear;
}

/**
 * Display-time date filter for a document. Contracts are annual — active for
 * every month of their year — so they never get hidden by an exact-day
 * range; timesheets still match by their own date. Never mutates the
 * volunteer's document list (see `applyFilters`) — this only decides what to
 * render, so compliance checks keep seeing the true, unfiltered data.
 */
export function docVisibleInRange(
  doc: BoardDocument,
  range: DateRange | undefined,
): boolean {
  if (!range?.from) return true;
  if (doc.status.startsWith('contract')) return contractCoversRange(doc, range);
  return docInRange(doc, range);
}

function newestDocTimestamp(vol: BoardVolunteer): number {
  return vol.documents.reduce((max, d) => {
    const t = d.lastActionDate?.getTime();
    return t !== undefined && t > max ? t : max;
  }, -Infinity);
}

function actionableDocCount(vol: BoardVolunteer): number {
  return vol.documents.filter((d) => isYourActionStatus(d.status)).length;
}

function sortVolunteers(
  vols: BoardVolunteer[],
  option: SortOption,
): BoardVolunteer[] {
  return [...vols].sort((a, b) =>
    option === 'newest'
      ? newestDocTimestamp(b) - newestDocTimestamp(a)
      : actionableDocCount(b) - actionableDocCount(a) ||
        newestDocTimestamp(b) - newestDocTimestamp(a),
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function matchesTile(status: DocStatus, tile: TileFilter): boolean {
  if (!tile) return false;
  switch (tile) {
    case 'contract-generate':
      return status === 'contract-generate';
    case 'contract-signing':
      return (
        status === 'contract-signing-vol' || status === 'contract-signing-coord'
      );
    case 'timesheet-generate':
      return status === 'timesheet-generate';
    case 'timesheet-signing':
      return (
        status === 'timesheet-signing-vol' ||
        status === 'timesheet-signing-super'
      );
    case 'ready-to-go':
      return status === 'timesheet-ready';
    default:
      // 'needs-timesheet' is a volunteer-level flag, not a document status.
      return false;
  }
}

/** How many of a tile's matching docs are actionable by the org right now (vs. waiting on the volunteer). Only meaningful for the two mixed-substep signing tiles. */
function countActionableForTile(
  volunteers: BoardVolunteer[],
  tile: Exclude<TileFilter, null>,
): number {
  if (tile === 'needs-timesheet') {
    return volunteers.filter((vol) => vol.needsTimesheet).length;
  }
  return volunteers.reduce(
    (sum, vol) =>
      sum +
      vol.documents.filter(
        (d) => matchesTile(d.status, tile) && isYourActionStatus(d.status),
      ).length,
    0,
  );
}

const TILE_DOC_TYPE: Record<Exclude<TileFilter, null>, DocTypeFilter> = {
  'contract-generate': 'contract',
  'contract-signing': 'contract',
  'timesheet-generate': 'timesheet',
  'timesheet-signing': 'timesheet',
  // 'needs-timesheet' counts volunteers by their own flag, not documents —
  // so it never narrows the doc-type dropdown to a single kind.
  'needs-timesheet': 'all',
  // Ready-to-go is the terminal bundling stage — leave the doc-type filter
  // on "all"; the tile's own row-builder (getReadyToGoDocs) scopes the
  // table to ready timesheets + their contract row, not this dropdown.
  'ready-to-go': 'all',
};

function countForTile(volunteers: BoardVolunteer[], tile: TileFilter): number {
  if (!tile) return 0;
  if (tile === 'needs-timesheet') {
    return volunteers.filter((vol) => vol.needsTimesheet).length;
  }
  return volunteers.reduce(
    (sum, vol) =>
      sum + vol.documents.filter((d) => matchesTile(d.status, tile)).length,
    0,
  );
}

/**
 * Decides which volunteers show, without ever touching `vol.documents` —
 * compliance checks (and the table itself) always read the true, unfiltered
 * document list; only *inclusion* is filtered here, and *display* is
 * filtered separately per-document (see `docVisibleInRange` and
 * `getReadyToGoDocs`) so a volunteer's real data is never corrupted by the
 * current view.
 */
function applyFilters(
  volunteers: BoardVolunteer[],
  tile: TileFilter,
  pauschale: PauschalenFilter,
  docType: DocTypeFilter,
  search: string,
  range: DateRange | undefined,
): BoardVolunteer[] {
  return volunteers.filter((vol) => {
    if (tile === 'needs-timesheet') {
      if (!vol.needsTimesheet) return false;
      if (pauschale !== 'all' && vol.pauschale !== pauschale) return false;
      if (search && !vol.name.toLowerCase().includes(search.toLowerCase()))
        return false;
      return true;
    }
    if (vol.documents.length === 0) return false;
    if (
      pauschale !== 'all' &&
      !vol.documents.some((d) => (d.pauschale ?? vol.pauschale) === pauschale)
    )
      return false;
    if (search && !vol.name.toLowerCase().includes(search.toLowerCase()))
      return false;
    if (tile && !vol.documents.some((d) => matchesTile(d.status, tile)))
      return false;
    if (
      docType !== 'all' &&
      !vol.documents.some((d) => d.status.startsWith(docType))
    )
      return false;
    if (range?.from && !vol.documents.some((d) => docVisibleInRange(d, range)))
      return false;
    return true;
  });
}

// ─── FilterTile (step card, no icon box) ─────────────────────────────────────

interface FilterTileProps {
  label: string;
  count: number;
  /** Docs within `count` that are actionable by the org right now (e.g. a signing tile's coordinator/supervisor-turn subset). Omit for tiles where the whole count is already "your action". */
  actionableCount?: number;
  active: boolean;
  onClick: () => void;
}

function FilterTile({
  label,
  count,
  actionableCount,
  active,
  onClick,
}: FilterTileProps) {
  const t = useTranslations('Accounting.reimbursements');
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex min-w-[100px] flex-1 flex-col justify-between gap-2 rounded-xl border p-3 text-left transition-colors',
        active
          ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
          : 'border-border bg-card hover:bg-muted',
      )}
    >
      <span
        className={cn(
          'text-base font-semibold leading-tight',
          active ? 'text-primary' : 'text-card-foreground',
        )}
      >
        {label}
      </span>
      {!!actionableCount && (
        <span className="text-base font-semibold text-primary tabular-nums">
          {t('tiles.waitingOnYou', { count: actionableCount })}
        </span>
      )}
      <span className="text-sm text-muted-foreground tabular-nums">
        {t('tiles.docCount', { count })}
      </span>
    </button>
  );
}

// ─── ReimbursementsBoard ──────────────────────────────────────────────────────

interface ReimbursementsBoardProps {
  orgUId: string;
  /** Owned by the page header — see reimbursements-page-header.tsx. */
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  /** Fired when the "Ready to go" tile is selected — the page header narrows its own range to this month. */
  onReadyToGoSelected: () => void;
  createDocOpen: boolean;
  onCreateDocOpenChange: (open: boolean) => void;
}

export function ReimbursementsBoard({
  orgUId,
  dateRange,
  onDateRangeChange,
  onReadyToGoSelected,
  createDocOpen,
  onCreateDocOpenChange,
}: ReimbursementsBoardProps) {
  const t = useTranslations('Accounting.reimbursements');

  const { volunteers, isLoading } = useReimbursementBoardData({
    orgUId,
    dateRange,
  });

  const signContract = useSignContract();
  const signInvoice = useSignInvoice();
  const declineContract = useDeclineContract();
  const declineInvoice = useDeclineInvoice();

  // Filters
  const [activeTile, setActiveTile] = useState<TileFilter>(null);
  const [pauschale, setPauschale] = useState<PauschalenFilter>('all');
  const [docTypeFilter, setDocTypeFilter] = useState<DocTypeFilter>('all');
  const [search, setSearch] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('action-needed');

  // Sheet
  const [selectedDoc, setSelectedDoc] = useState<DocVolPair | null>(null);

  // Contract creation modal (solo contract-generate / contract-declined rows)
  const [contractCreationTarget, setContractCreationTarget] =
    useState<DocVolPair | null>(null);

  // Invoice creation modal (solo timesheet-generate / timesheet-declined rows)
  const [invoiceCreationTarget, setInvoiceCreationTarget] =
    useState<DocVolPair | null>(null);

  function handleRequestCreate(pair: DocVolPair) {
    if (
      pair.doc.status === 'contract-generate' ||
      pair.doc.status === 'contract-declined' ||
      pair.doc.status === 'contract-missing'
    ) {
      setContractCreationTarget(pair);
      return;
    }
    if (
      pair.doc.status === 'timesheet-generate' ||
      pair.doc.status === 'timesheet-declined'
    ) {
      setInvoiceCreationTarget(pair);
    }
  }

  function handleSign(pair: DocVolPair) {
    const { doc, vol } = pair;
    if (doc.status === 'contract-signing-coord') {
      signContract.mutate(doc.id, {
        onSuccess: () =>
          toast.success(t('signToasts.contract', { name: vol.name })),
        onError: () =>
          toast.error(t('signToasts.contractError', { name: vol.name })),
      });
      return;
    }
    if (doc.status === 'timesheet-signing-super') {
      signInvoice.mutate(doc.id, {
        onSuccess: () =>
          toast.success(t('signToasts.invoice', { name: vol.name })),
        onError: () =>
          toast.error(t('signToasts.invoiceError', { name: vol.name })),
      });
    }
  }

  function handleDecline(pair: DocVolPair, reason: string) {
    const { doc, vol } = pair;
    if (doc.status.startsWith('contract')) {
      declineContract.mutate(
        { contractId: doc.id, reason },
        {
          onSuccess: () =>
            toast.success(t('declineToasts.contract', { name: vol.name })),
          onError: () =>
            toast.error(t('declineToasts.contractError', { name: vol.name })),
        },
      );
      return;
    }
    declineInvoice.mutate(
      { invoiceId: doc.id, reason },
      {
        onSuccess: () =>
          toast.success(t('declineToasts.invoice', { name: vol.name })),
        onError: () =>
          toast.error(t('declineToasts.invoiceError', { name: vol.name })),
      },
    );
  }

  // Derived for DocumentSheet
  const selectedDate = dateRange?.from ?? new Date();

  const tileLabels: Record<Exclude<TileFilter, null>, string> = {
    'contract-generate': t('tiles.contractGenerate'),
    'contract-signing': t('tiles.contractSigning'),
    'timesheet-generate': t('tiles.timesheetGenerate'),
    'timesheet-signing': t('tiles.timesheetSigning'),
    'needs-timesheet': t('tiles.needsTimesheet'),
    'ready-to-go': t('tiles.readyToGo'),
  };

  // Pipeline-tile counts are pauschale-scoped only. docTypeFilter is not an
  // independent user choice here — selecting a tile sets it as a side
  // effect (TILE_DOC_TYPE) — so letting it narrow this list would make every
  // tile's count shrink whenever any one tile is selected, instead of
  // reflecting the org's true, stable totals.
  const baseFilteredVols = useMemo(
    () =>
      volunteers.filter((v) => {
        if (pauschale === 'all') return true;
        // A needs-timesheet volunteer may have no document for the type they
        // need a timesheet for, so match their primary pauschale instead.
        if (v.needsTimesheet) return v.pauschale === pauschale;
        return v.documents.some(
          (d) => (d.pauschale ?? v.pauschale) === pauschale,
        );
      }),
    [volunteers, pauschale],
  );

  const tileCounts = useMemo(
    () =>
      Object.fromEntries(
        TILE_IDS.map((id) => [id, countForTile(baseFilteredVols, id)]),
      ) as Record<Exclude<TileFilter, null>, number>,
    [baseFilteredVols],
  );

  const tileActionableCounts = useMemo(
    () =>
      Object.fromEntries(
        TILE_IDS.map((id) => [
          id,
          countActionableForTile(baseFilteredVols, id),
        ]),
      ) as Record<Exclude<TileFilter, null>, number>,
    [baseFilteredVols],
  );

  const filteredVols = useMemo(
    () =>
      applyFilters(
        volunteers,
        activeTile,
        pauschale,
        docTypeFilter,
        search,
        dateRange,
      ),
    [volunteers, activeTile, pauschale, docTypeFilter, search, dateRange],
  );

  const sortedFilteredVols = useMemo(
    () => sortVolunteers(filteredVols, sortOption),
    [filteredVols, sortOption],
  );

  // Tabs are married to the doc-type filter: picking a tile sets the matching
  // doc type (or "all" for the All tile); changing the doc type manually
  // always resets the tile back to All, so the two controls can never
  // disagree and silently zero out the table.
  function toggleTile(tile: Exclude<TileFilter, null>) {
    setActiveTile((prev) => {
      const next = prev === tile ? null : tile;
      setDocTypeFilter(next ? TILE_DOC_TYPE[next] : 'all');
      // Ready-to-go is a bundle-and-send-now action — auto-narrow to this
      // month so the list defaults to what's actually due, not the whole
      // history.
      if (next === 'ready-to-go') onReadyToGoSelected();
      return next;
    });
  }

  function handleDocTypeChange(next: DocTypeFilter) {
    setDocTypeFilter(next);
    setActiveTile(null);
  }

  function handleAllTile() {
    setActiveTile(null);
    setDocTypeFilter('all');
  }

  if (isLoading) {
    return <ReimbursementsBoardSkeleton />;
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Calendar only — nothing else belongs in this row */}
      <div className="flex justify-start">
        <PeriodPicker
          value={dateRange}
          onChange={onDateRangeChange}
          presets={[
            {
              key: 'all-time',
              label: t('periodPicker.allTime'),
              range: undefined,
            },
            {
              key: 'this-month',
              label: t('periodPicker.thisMonth'),
              range: thisMonthRange(),
            },
            {
              key: 'last-month',
              label: t('periodPicker.lastMonth'),
              range: lastMonthRange(),
            },
          ]}
          placeholderLabel={t('periodPicker.allTime')}
          applyLabel={t('periodPicker.apply')}
          customRangeLabel={t('periodPicker.customPeriod')}
          autoApplyPresets
          requireEndDate={false}
          align="start"
          className="h-10 gap-2 shrink-0"
        />
      </div>

      {/* Pipeline steps (connected filter tiles) */}
      <div className="flex items-stretch gap-0 overflow-x-auto pb-1">
        <FilterTile
          label={t('tiles.all')}
          count={Object.values(tileCounts).reduce((s, n) => s + n, 0)}
          active={activeTile === null}
          onClick={handleAllTile}
        />
        <div className="w-px self-stretch bg-border mx-3 shrink-0" />
        {TILE_IDS.map((id, i) => (
          <Fragment key={id}>
            {i > 0 && (
              <div className="flex items-center px-1 shrink-0">
                <ChevronRightIcon size={14} className="text-border" />
              </div>
            )}
            <FilterTile
              label={tileLabels[id]}
              count={tileCounts[id]}
              actionableCount={
                id === 'contract-generate' ||
                id === 'timesheet-generate' ||
                id === 'contract-signing' ||
                id === 'timesheet-signing' ||
                id === 'needs-timesheet'
                  ? tileActionableCounts[id]
                  : undefined
              }
              active={activeTile === id}
              onClick={() => toggleTile(id)}
            />
          </Fragment>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <SearchIcon
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <Input
            type="search"
            placeholder={t('toolbar.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 pl-9"
          />
        </div>

        <Select
          value={docTypeFilter}
          onValueChange={(v) => handleDocTypeChange(v as DocTypeFilter)}
        >
          <SelectTrigger className="h-10 min-w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filters.docTypeAll')}</SelectItem>
            <SelectItem value="contract">
              {t('filters.docTypeContracts')}
            </SelectItem>
            <SelectItem value="timesheet">
              {t('filters.docTypeTimesheets')}
            </SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={pauschale}
          onValueChange={(v) => setPauschale(v as PauschalenFilter)}
        >
          <SelectTrigger className="h-10 min-w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('toolbar.typeAll')}</SelectItem>
            <SelectItem value="ehrenamt">{t('toolbar.typeEP')}</SelectItem>
            <SelectItem value="uebungsleiter">{t('toolbar.typeUL')}</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={sortOption}
          onValueChange={(v) => setSortOption(v as SortOption)}
        >
          <SelectTrigger className="h-10 min-w-40">
            <ArrowUpDownIcon size={14} className="text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="action-needed">
              {t('toolbar.sortActionNeeded')}
            </SelectItem>
            <SelectItem value="newest">{t('toolbar.sortNewest')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table / empty state */}
      {sortedFilteredVols.length === 0 ? (
        <Empty className="border-border py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              {activeTile || search ? (
                <FilterXIcon className="size-5 text-muted-foreground" />
              ) : (
                <CheckCircle2Icon className="size-5 text-success" />
              )}
            </EmptyMedia>
            <EmptyTitle>
              {activeTile || search ? t('empty.filtered') : t('empty.allDone')}
            </EmptyTitle>
            {!activeTile && !search && (
              <EmptyDescription>{t('empty.allDoneHint')}</EmptyDescription>
            )}
          </EmptyHeader>
        </Empty>
      ) : (
        <ReimbursementsTable
          vols={sortedFilteredVols}
          onDocumentClick={(doc, vol) => setSelectedDoc({ doc, vol })}
          onRequestCreate={handleRequestCreate}
          onRequestSign={handleSign}
          docTypeFilter={docTypeFilter}
          dateRange={dateRange}
          activeTile={activeTile}
        />
      )}

      <DocumentSheet
        doc={selectedDoc?.doc ?? null}
        vol={selectedDoc?.vol ?? null}
        open={selectedDoc !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedDoc(null);
        }}
        onRequestCreate={handleRequestCreate}
        onRequestSign={handleSign}
        onDecline={handleDecline}
        selectedDate={selectedDate}
        orgUId={orgUId}
      />

      <ContractCreationModal
        open={contractCreationTarget !== null}
        onOpenChange={(open) => {
          if (!open) setContractCreationTarget(null);
        }}
        volunteerId={contractCreationTarget?.vol.id ?? null}
        volunteerName={contractCreationTarget?.vol.name ?? null}
        pauschale={
          contractCreationTarget
            ? (contractCreationTarget.doc.pauschale ??
              contractCreationTarget.vol.pauschale)
            : null
        }
        onSent={() => setContractCreationTarget(null)}
      />

      <InvoiceCreationModal
        open={invoiceCreationTarget !== null}
        onOpenChange={(open) => {
          if (!open) setInvoiceCreationTarget(null);
        }}
        orgUId={orgUId}
        docId={invoiceCreationTarget?.doc.id ?? null}
        volunteerId={invoiceCreationTarget?.vol.id ?? null}
        volunteerName={invoiceCreationTarget?.vol.name ?? null}
        pauschale={
          invoiceCreationTarget
            ? (invoiceCreationTarget.doc.pauschale ??
              invoiceCreationTarget.vol.pauschale)
            : null
        }
        usedBeforeAmount={
          invoiceCreationTarget
            ? (invoiceCreationTarget.vol.limits?.[
                invoiceCreationTarget.doc.pauschale ??
                  invoiceCreationTarget.vol.pauschale
              ]?.used ?? invoiceCreationTarget.vol.usedAmount)
            : null
        }
        totalCapAmount={
          invoiceCreationTarget
            ? (invoiceCreationTarget.vol.limits?.[
                invoiceCreationTarget.doc.pauschale ??
                  invoiceCreationTarget.vol.pauschale
              ]?.total ?? invoiceCreationTarget.vol.totalCap)
            : null
        }
        onSent={() => setInvoiceCreationTarget(null)}
      />

      <CreateDocumentModal
        open={createDocOpen}
        onOpenChange={onCreateDocOpenChange}
        orgUId={orgUId}
        volunteers={volunteers}
        onContractSent={() => {}}
        onInvoiceSent={() => {}}
      />
    </div>
  );
}

// ─── Board skeleton ───────────────────────────────────────────────────────────

const TILE_SKELETON_KEYS = [
  'tile-1',
  'tile-2',
  'tile-3',
  'tile-4',
  'tile-5',
  'tile-6',
];
const ROW_SKELETON_KEYS = ['row-1', 'row-2', 'row-3'];

export function ReimbursementsBoardSkeleton() {
  return (
    <div className="space-y-6 pb-24">
      <div className="flex gap-1 overflow-x-auto pb-1">
        {TILE_SKELETON_KEYS.map((key, i) => (
          <Fragment key={key}>
            {i > 0 && (
              <div className="flex items-center px-1">
                <Skeleton className="h-3 w-3" />
              </div>
            )}
            <div className="flex min-w-[100px] flex-1 flex-col gap-2 rounded-xl border border-border bg-card p-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-3" />
                <Skeleton className="h-5 w-5 rounded-full" />
              </div>
              <Skeleton className="h-4 w-3/4" />
            </div>
          </Fragment>
        ))}
      </div>

      <div className="flex gap-3">
        <Skeleton className="h-9 w-48 rounded-lg" />
        <Skeleton className="h-9 w-44 rounded-lg" />
        <Skeleton className="h-9 flex-1 min-w-48" />
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        {ROW_SKELETON_KEYS.map((key) => (
          <div
            key={key}
            className="flex items-center gap-3 border-b border-border px-4 py-3"
          >
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';

import {
  Button,
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
import { Fragment, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ContractCreationModal } from './contract-creation-modal';
import { CreateDocumentModal } from './create-document-modal';
import type { PauschalenType } from './doc-type-header';
import { InvoiceCreationModal } from './invoice-creation-modal';
import type {
  NonCompliantAction,
  NonCompliantDialogState,
} from './non-compliant-timesheet-dialog';
import { NonCompliantTimesheetDialog } from './non-compliant-timesheet-dialog';
import type { DateRange } from './period-picker';
import { lastMonthRange, PeriodPicker, thisMonthRange } from './period-picker';
import { BatchBar } from './reimbursements-batch-bar';
import {
  DocumentSheet,
  MOCK_STAFF_ACTORS,
} from './reimbursements-document-sheet';
import {
  type DocTypeFilter,
  isYourActionStatus,
  ReimbursementsTable,
} from './reimbursements-volunteer-group';
import type { Signee, SigneeRole } from './template/types';

// ─── Mock org roles ───────────────────────────────────────────────────────────

const MOCK_ORG_ROLES = {
  volunteer: { id: 'role-1', name: 'Vereinsmitglied' },
  coordinator: { id: 'role-2', name: 'Übungsleitung' },
  supervisor: { id: 'role-3', name: 'Vorstandsmitglied' },
} as const;

// ─── Mock template signing chains ─────────────────────────────────────────────

const MOCK_TEMPLATE_SIGNEES: Record<string, Signee[]> = {
  'ehrenamt-contract': [
    { id: 's-eh-c-1', role: 'volunteer', orgRole: MOCK_ORG_ROLES.volunteer },
    {
      id: 's-eh-c-2',
      role: 'coordinator',
      orgRole: MOCK_ORG_ROLES.coordinator,
    },
  ],
  'ehrenamt-invoice': [
    { id: 's-eh-i-1', role: 'volunteer', orgRole: MOCK_ORG_ROLES.volunteer },
    { id: 's-eh-i-2', role: 'supervisor', orgRole: MOCK_ORG_ROLES.supervisor },
  ],
  'uebungleiter-contract': [
    { id: 's-ul-c-1', role: 'volunteer', orgRole: MOCK_ORG_ROLES.volunteer },
    {
      id: 's-ul-c-2',
      role: 'coordinator',
      orgRole: MOCK_ORG_ROLES.coordinator,
    },
  ],
  'uebungleiter-invoice': [
    { id: 's-ul-i-1', role: 'volunteer', orgRole: MOCK_ORG_ROLES.volunteer },
    { id: 's-ul-i-2', role: 'supervisor', orgRole: MOCK_ORG_ROLES.supervisor },
  ],
};

function getTemplateSignees(doc: BoardDocument, vol: BoardVolunteer): Signee[] {
  const pauschale = doc.pauschale ?? vol.pauschale;
  const kind = doc.status.startsWith('contract') ? 'contract' : 'invoice';
  return MOCK_TEMPLATE_SIGNEES[`${pauschale}-${kind}`] ?? [];
}

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
  | 'ready-to-go'
  | null;

type PauschalenFilter = 'all' | PauschalenType;
type SortOption = 'action-needed' | 'newest';

export type { DateRange };

export interface BoardDocument {
  id: string;
  status: DocStatus;
  amount?: number;
  hours?: number;
  lastActionDate?: string;
  periodLabel: string;
  /** Manually flagged: this timesheet's amount pushed the volunteer at/over their yearly cap. Unrelated to contract compliance. */
  isOverCap?: boolean;
  pauschale?: PauschalenType;
  /** Set together when a signer rejects the document (contract-declined/timesheet-declined only). */
  declineReason?: string;
  declinedBy?: string;
  declinedAt?: string;
  /** Which seat in the signing chain declined — determines where the pipeline/timeline gets cut off. */
  declinedAtRole?: SigneeRole;
}

/** Status + decline-detail override layered onto a mock document in-session (see docOverrides). */
export interface DocOverride {
  status: DocStatus;
  declineReason?: string;
  declinedBy?: string;
  declinedAt?: string;
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
  documents: BoardDocument[];
}

/** A document paired with the volunteer it belongs to — needed once actions act across volunteers (batch selection). */
export interface DocVolPair {
  doc: BoardDocument;
  vol: BoardVolunteer;
}

/** Applies in-session overrides (status flips after sending/declining a document) onto the mock volunteer list — the mock data itself stays static. */
function applyDocStatusOverrides(
  vols: BoardVolunteer[],
  overrides: Record<string, DocOverride>,
): BoardVolunteer[] {
  if (Object.keys(overrides).length === 0) return vols;
  return vols.map((v) => {
    if (!v.documents.some((d) => d.id in overrides)) return v;
    return {
      ...v,
      documents: v.documents.map((d) => {
        const override = overrides[d.id];
        return override ? { ...d, ...override } : d;
      }),
    };
  });
}

/**
 * A manual correction to a volunteer's running "used" total for one pauschale
 * type (see InvoiceCapCard's editable field) — simulates what a real backend
 * write would do: the corrected baseline sticks for the rest of the session,
 * so it's what the next invoice for this volunteer/pauschale starts from, and
 * feeds every cap display on the board, not just the modal that set it.
 */
function applyLimitOverrides(
  vols: BoardVolunteer[],
  overrides: Record<string, Partial<Record<PauschalenType, number>>>,
): BoardVolunteer[] {
  if (Object.keys(overrides).length === 0) return vols;
  return vols.map((v) => {
    const volOverride = overrides[v.id];
    if (!volOverride) return v;
    const next: BoardVolunteer = { ...v };
    for (const [pauschale, used] of Object.entries(volOverride) as [
      PauschalenType,
      number,
    ][]) {
      if (v.limits) {
        const existing = v.limits[pauschale] ?? {
          used: v.usedAmount,
          total: v.totalCap,
        };
        next.limits = {
          ...(next.limits ?? v.limits),
          [pauschale]: { ...existing, used },
        };
      }
      if (pauschale === v.pauschale) next.usedAmount = used;
    }
    return next;
  });
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
 * The volunteer's active-contract signing date for one pauschale type —
 * anchors the invoice cap card's Zeitraum range. `null` when no active
 * contract exists yet (the non-compliant-guardrail path can still reach
 * invoice creation without one).
 */
export function findActiveContractDate(
  vol: BoardVolunteer,
  pauschale: PauschalenType,
): Date | null {
  const doc = vol.documents.find(
    (d) =>
      d.status === 'contract-active' &&
      (d.pauschale ?? vol.pauschale) === pauschale,
  );
  return doc?.lastActionDate ? parseDocDate(doc.lastActionDate) : null;
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

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_VOLUNTEERS: BoardVolunteer[] = [
  // ── Anna Müller (ehrenamt): compliant history — an active contract, one
  // timesheet a supervisor declined a while back, and this month's
  // timesheet still waiting on her own signature.
  {
    id: 'v1',
    name: 'Anna Müller',
    initials: 'AM',
    pauschale: 'ehrenamt',
    usedAmount: 240,
    totalCap: 840,
    documents: [
      {
        id: 'd1',
        status: 'contract-active',
        lastActionDate: '01.01.2026',
        periodLabel: '2026',
      },
      {
        id: 'd2',
        status: 'timesheet-declined',
        amount: 120,
        hours: 8,
        lastActionDate: '10.06.2026',
        periodLabel: 'Juni 2026',
        declineReason:
          'Die angegebenen Stunden stimmen nicht mit dem Dienstplan überein — bitte mit den korrekten Schichten neu einreichen.',
        declinedBy: 'Markus Kassier',
        declinedAt: '10.06.2026',
        declinedAtRole: 'supervisor',
      },
      {
        id: 'd3',
        status: 'timesheet-signing-vol',
        amount: 120,
        hours: 8,
        lastActionDate: '03.07.2026',
        periodLabel: 'Juli 2026',
      },
    ],
  },
  // ── Ben Schmidt (ehrenamt): brand new — contract still being drafted,
  // but hours were already logged, so the timesheet is non-compliant
  // until the contract goes active.
  {
    id: 'v2',
    name: 'Ben Schmidt',
    initials: 'BS',
    pauschale: 'ehrenamt',
    usedAmount: 0,
    totalCap: 840,
    documents: [
      {
        id: 'd4',
        status: 'contract-generate',
        lastActionDate: '01.07.2026',
        periodLabel: '2026',
      },
      {
        id: 'd5',
        status: 'timesheet-generate',
        amount: 60,
        hours: 4,
        lastActionDate: '07.07.2026',
        periodLabel: 'Juli 2026',
      },
    ],
  },
  // ── Clara Weber (uebungleiter): her first contract was declined by her
  // (wrong rate quoted) — a fresh one has since been drafted and is now
  // mid-signature.
  {
    id: 'v3',
    name: 'Clara Weber',
    initials: 'CW',
    pauschale: 'uebungleiter',
    usedAmount: 0,
    totalCap: 3000,
    documents: [
      {
        id: 'd6',
        status: 'contract-declined',
        lastActionDate: '20.06.2026',
        periodLabel: '2026',
        declineReason:
          'Der genannte Stundensatz entspricht nicht der Zusage — bitte mit korrektem Satz neu ausstellen.',
        declinedBy: 'Clara Weber',
        declinedAt: '20.06.2026',
        declinedAtRole: 'volunteer',
      },
      {
        id: 'd7',
        status: 'contract-signing-vol',
        lastActionDate: '01.07.2026',
        periodLabel: '2026',
      },
    ],
  },
  // ── David Fischer (ehrenamt): one contract awaiting the coordinator's
  // countersignature, and this month's timesheet awaiting the
  // supervisor's — the live example for testing the new Decline action.
  {
    id: 'v4',
    name: 'David Fischer',
    initials: 'DF',
    pauschale: 'ehrenamt',
    usedAmount: 480,
    totalCap: 840,
    documents: [
      {
        id: 'd8',
        status: 'contract-signing-coord',
        lastActionDate: '06.07.2026',
        periodLabel: '2026',
      },
      {
        id: 'd9',
        status: 'timesheet-signing-super',
        amount: 180,
        hours: 12,
        lastActionDate: '02.07.2026',
        periodLabel: 'Juli 2026',
      },
    ],
  },
  // ── Emma Wagner: long-tenured, both Pauschale types. An active
  // Übungsleiter contract sits alongside an Ehrenamt side that never got a
  // contract at all — hours were paid anyway (muted), and this month's
  // Übungsleiter timesheet is about to push her over the yearly cap.
  {
    id: 'v5',
    name: 'Emma Wagner',
    initials: 'EW',
    pauschale: 'ehrenamt',
    usedAmount: 90,
    totalCap: 840,
    limits: {
      ehrenamt: { used: 90, total: 840 },
      uebungleiter: { used: 2700, total: 3000 },
    },
    documents: [
      {
        id: 'd10',
        status: 'contract-active',
        lastActionDate: '01.01.2026',
        periodLabel: '2026',
        pauschale: 'uebungleiter',
      },
      {
        id: 'd11',
        status: 'contract-missing',
        periodLabel: '2026',
        pauschale: 'ehrenamt',
      },
      {
        id: 'd12',
        status: 'timesheet-muted',
        amount: 90,
        hours: 6,
        lastActionDate: '05.07.2026',
        periodLabel: 'Juli 2026',
        pauschale: 'ehrenamt',
      },
      {
        id: 'd13',
        status: 'timesheet-ready',
        amount: 360,
        hours: 24,
        lastActionDate: '07.07.2026',
        periodLabel: 'Juli 2026',
        pauschale: 'uebungleiter',
        isOverCap: true,
      },
    ],
  },
];

// ── Documentless volunteers: automation never fired for them (no shift
// signup yet, or the trigger genuinely never ran). Excluded from every
// default view — nothing pending — and surfaced only by an exact search
// match, with a single manual "Create contract" escape hatch.
const MOCK_DOCUMENTLESS_VOLUNTEERS: BoardVolunteer[] = [
  {
    id: 'v52',
    name: 'Zeynep Aksoy',
    initials: 'ZA',
    pauschale: 'ehrenamt',
    usedAmount: 0,
    totalCap: 840,
    documents: [],
  },
  {
    id: 'v53',
    name: 'Milan Fuchs',
    initials: 'MF',
    pauschale: 'uebungleiter',
    usedAmount: 0,
    totalCap: 3000,
    documents: [],
  },
  {
    id: 'v54',
    name: 'Sina Brandner',
    initials: 'SB2',
    pauschale: 'ehrenamt',
    usedAmount: 0,
    totalCap: 840,
    documents: [],
  },
  {
    id: 'v55',
    name: 'Theo Wiechert',
    initials: 'TW',
    pauschale: 'uebungleiter',
    usedAmount: 0,
    totalCap: 3000,
    documents: [],
  },
  {
    id: 'v56',
    name: 'Layla Hoffmann',
    initials: 'LH',
    pauschale: 'ehrenamt',
    usedAmount: 0,
    totalCap: 840,
    documents: [],
  },
  {
    id: 'v57',
    name: 'Jonas Reiter',
    initials: 'JR',
    pauschale: 'uebungleiter',
    usedAmount: 0,
    totalCap: 3000,
    documents: [],
  },
];

/**
 * The rows a documentless volunteer gets once found by search: muted
 * placeholders whose only action is manually creating a contract. Both
 * pauschale types are shown — there's no signal yet for which one this
 * volunteer will actually need, so the supervisor picks.
 */
function buildContractMissingDocs(vol: BoardVolunteer): BoardDocument[] {
  const types: PauschalenType[] = ['ehrenamt', 'uebungleiter'];
  return types.map((pauschale) => ({
    id: `${vol.id}-contract-missing-${pauschale}`,
    status: 'contract-missing',
    periodLabel: '2026',
    pauschale,
  }));
}
// ─── Date helpers ─────────────────────────────────────────────────────────────

export function parseDocDate(s: string): Date | null {
  const parts = s.split('.');
  if (parts.length !== 3) return null;
  const [d, m, y] = parts.map(Number);
  if (!d || !m || !y) return null;
  return new Date(y, m - 1, d);
}

function docInRange(doc: BoardDocument, range: DateRange | undefined): boolean {
  if (!range?.from) return true;
  if (!doc.lastActionDate) return true;
  const date = parseDocDate(doc.lastActionDate);
  if (!date) return true;
  const to = range.to ?? range.from;
  return date >= range.from && date <= to;
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
    const t = d.lastActionDate
      ? parseDocDate(d.lastActionDate)?.getTime()
      : undefined;
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
  }
}

/** How many of a tile's matching docs are actionable by the org right now (vs. waiting on the volunteer). Only meaningful for the two mixed-substep signing tiles. */
function countActionableForTile(
  volunteers: BoardVolunteer[],
  tile: Exclude<TileFilter, null>,
): number {
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
  // Ready-to-go is the terminal bundling stage — leave the doc-type filter
  // on "all"; the tile's own row-builder (getReadyToGoDocs) scopes the
  // table to ready timesheets + their contract row, not this dropdown.
  'ready-to-go': 'all',
};

function countForTile(volunteers: BoardVolunteer[], tile: TileFilter): number {
  if (!tile) return 0;
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

  // Filters
  const [activeTile, setActiveTile] = useState<TileFilter>(null);
  const [pauschale, setPauschale] = useState<PauschalenFilter>('all');
  const [docTypeFilter, setDocTypeFilter] = useState<DocTypeFilter>('all');
  const [search, setSearch] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('action-needed');

  // Sheet
  const [selectedDoc, setSelectedDoc] = useState<{
    doc: BoardDocument;
    vol: BoardVolunteer;
  } | null>(null);

  // Doc-level selection (derives vol-level for batch bar)
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());

  // Non-compliant timesheet confirmation
  const [pendingItems, setPendingItems] = useState<DocVolPair[]>([]);
  const [nonCompliantDialog, setNonCompliantDialog] =
    useState<NonCompliantDialogState | null>(null);

  // Contract creation modal (solo contract-generate rows only — batch stays BatchBar's territory)
  const [contractCreationTarget, setContractCreationTarget] =
    useState<DocVolPair | null>(null);

  // Invoice creation modal (solo, compliant timesheet-generate rows only — batch stays BatchBar's territory)
  const [invoiceCreationTarget, setInvoiceCreationTarget] =
    useState<DocVolPair | null>(null);

  // In-session overrides (e.g. flipping a row to contract-signing-vol after
  // send, or to declined with its reason) layered onto the static mock data
  const [docOverrides, setDocOverrides] = useState<Record<string, DocOverride>>(
    {},
  );
  // Manual "used before" corrections from InvoiceCapCard, keyed by volunteer
  // id then pauschale — see applyLimitOverrides.
  const [volunteerLimitOverrides, setVolunteerLimitOverrides] = useState<
    Record<string, Partial<Record<PauschalenType, number>>>
  >({});
  const volunteers = useMemo(
    () =>
      applyLimitOverrides(
        applyDocStatusOverrides(MOCK_VOLUNTEERS, docOverrides),
        volunteerLimitOverrides,
      ),
    [docOverrides, volunteerLimitOverrides],
  );
  const allVolunteers = useMemo(
    () => [...volunteers, ...MOCK_DOCUMENTLESS_VOLUNTEERS],
    [volunteers],
  );

  // Fake success feedback — no mutation is actually wired yet, but every
  // action button should still tell the user something happened.
  function showActionToast(
    action: NonCompliantAction,
    count: number,
    name?: string,
  ) {
    toast.success(
      t(`actionToasts.${action}` as Parameters<typeof t>[0], {
        count,
        name: name ?? '',
      }),
    );
  }

  function requestAction(items: DocVolPair[], action: NonCompliantAction) {
    const single = items.length === 1 ? items[0] : undefined;
    // Reissuing a declined document goes through the same creation modal as
    // a fresh contract/timesheet — declined is a dead end, not a resumable state.
    if (
      action === 'create' &&
      (single?.doc.status === 'contract-generate' ||
        single?.doc.status === 'contract-declined')
    ) {
      setContractCreationTarget(single);
      return;
    }
    if (
      action === 'create' &&
      (single?.doc.status === 'timesheet-generate' ||
        single?.doc.status === 'timesheet-declined')
    ) {
      setInvoiceCreationTarget(single);
      return;
    }

    const nonCompliant = items.filter(({ doc, vol }) =>
      isTimesheetNonCompliant(vol, doc),
    );

    if (nonCompliant.length === 0) {
      // action handler — wired to mutations in production
      showActionToast(action, items.length, single?.vol.name);
      return;
    }

    setPendingItems(items);

    if (single) {
      const contractDoc = findContractDoc(
        single.vol,
        single.doc.pauschale ?? single.vol.pauschale,
      );
      setNonCompliantDialog({
        kind: 'single',
        action,
        contractStatus: contractDoc?.status ?? 'contract-generate',
      });
      return;
    }

    if (nonCompliant.length === items.length) {
      setNonCompliantDialog({ kind: 'batch-all', action, count: items.length });
    } else {
      setNonCompliantDialog({
        kind: 'batch-mixed',
        action,
        nonCompliantCount: nonCompliant.length,
        totalCount: items.length,
      });
    }
  }

  function closeNonCompliantDialog() {
    setNonCompliantDialog(null);
    setPendingItems([]);
  }

  function handleProceedAnyway() {
    // action handler — wired to mutations in production, applies to every item in pendingItems
    const action = nonCompliantDialog?.action;
    const count = pendingItems.length;
    const single = count === 1 ? pendingItems[0] : undefined;
    closeNonCompliantDialog();
    if (!action) return;
    showActionToast(action, count, single?.vol.name);
  }

  function handleOnlyCompliant() {
    // action handler — wired to mutations in production, applies only to the compliant subset
    const dialog = nonCompliantDialog;
    closeNonCompliantDialog();
    if (!dialog || dialog.kind !== 'batch-mixed') return;
    showActionToast(
      dialog.action,
      dialog.totalCount - dialog.nonCompliantCount,
    );
  }

  function handleGenerateContractInstead() {
    const first = pendingItems[0];
    closeNonCompliantDialog();
    if (!first) return;
    const { doc, vol } = first;
    const contractDoc = findContractDoc(vol, doc.pauschale ?? vol.pauschale);
    if (!contractDoc) return;
    if (contractDoc.status === 'contract-generate') {
      // create action — wired to mutations in production (generates the contract)
      toast.success(t('contractGeneratedToast', { name: vol.name }));
      return;
    }
    setSelectedDoc({ doc: contractDoc, vol });
  }

  function toggleDoc(docId: string) {
    setSelectedDocIds((prev) => {
      const next = new Set(prev);
      if (next.has(docId)) next.delete(docId);
      else next.add(docId);
      return next;
    });
  }

  function toggleVolDocs(docIds: string[]) {
    setSelectedDocIds((prev) => {
      const next = new Set(prev);
      const allSelected = docIds.every((id) => next.has(id));
      for (const id of docIds) {
        if (allSelected) next.delete(id);
        else next.add(id);
      }
      return next;
    });
  }

  function toggleAll(docIds: string[], select: boolean) {
    setSelectedDocIds((prev) => {
      const next = new Set(prev);
      for (const id of docIds) {
        if (select) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }

  // Derived for DocumentSheet
  const selectedDate = dateRange?.from ?? new Date();

  const tileLabels: Record<Exclude<TileFilter, null>, string> = {
    'contract-generate': t('tiles.contractGenerate'),
    'contract-signing': t('tiles.contractSigning'),
    'timesheet-generate': t('tiles.timesheetGenerate'),
    'timesheet-signing': t('tiles.timesheetSigning'),
    'ready-to-go': t('tiles.readyToGo'),
  };

  const TILE_IDS: Exclude<TileFilter, null>[] = [
    'contract-generate',
    'contract-signing',
    'timesheet-generate',
    'timesheet-signing',
    'ready-to-go',
  ];

  // Pipeline-tile counts are pauschale-scoped only. docTypeFilter is not an
  // independent user choice here — selecting a tile sets it as a side
  // effect (TILE_DOC_TYPE) — so letting it narrow this list would make every
  // tile's count shrink whenever any one tile is selected, instead of
  // reflecting the org's true, stable totals.
  const baseFilteredVols = useMemo(
    () =>
      volunteers.filter((v) => {
        if (
          pauschale !== 'all' &&
          !v.documents.some((d) => (d.pauschale ?? v.pauschale) === pauschale)
        )
          return false;
        return true;
      }),
    [volunteers, pauschale],
  );

  const tileCounts = useMemo(
    () =>
      Object.fromEntries(
        TILE_IDS.map((id) => [id, countForTile(baseFilteredVols, id)]),
      ) as Record<Exclude<TileFilter, null>, number>,
    [baseFilteredVols, TILE_IDS.map],
  );

  const tileActionableCounts = useMemo(
    () =>
      Object.fromEntries(
        TILE_IDS.map((id) => [
          id,
          countActionableForTile(baseFilteredVols, id),
        ]),
      ) as Record<Exclude<TileFilter, null>, number>,
    [baseFilteredVols, TILE_IDS.map],
  );

  // Documentless volunteers bypass every other filter (tile/docType/pauschale/
  // date) — search is the only thing that can surface them, and once it does
  // they should stay visible regardless of which tile is active.
  const documentlessMatches = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return MOCK_DOCUMENTLESS_VOLUNTEERS.filter((v) =>
      v.name.toLowerCase().includes(q),
    ).map((v) => ({ ...v, documents: buildContractMissingDocs(v) }));
  }, [search]);

  const filteredVols = useMemo(
    () => [
      ...applyFilters(
        volunteers,
        activeTile,
        pauschale,
        docTypeFilter,
        search,
        dateRange,
      ),
      ...documentlessMatches,
    ],
    [
      volunteers,
      activeTile,
      pauschale,
      docTypeFilter,
      search,
      dateRange,
      documentlessMatches,
    ],
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

  // Deselect docs that scroll out of view when filters change — mirrors
  // exactly what VolunteerTableGroup renders, so a doc scrolled out by
  // date/doc-type/tile never lingers selected.
  const visibleDocIds = useMemo(
    () =>
      new Set(
        filteredVols.flatMap((v) =>
          (activeTile === 'ready-to-go'
            ? getReadyToGoDocs(v, dateRange)
            : v.documents
                .filter(
                  (d) =>
                    docTypeFilter === 'all' ||
                    d.status.startsWith(docTypeFilter),
                )
                .filter((d) => docVisibleInRange(d, dateRange))
          ).map((d) => d.id),
        ),
      ),
    [filteredVols, docTypeFilter, dateRange, activeTile],
  );

  useEffect(() => {
    setSelectedDocIds((prev) => {
      const next = new Set([...prev].filter((id) => visibleDocIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [visibleDocIds]);

  // Derive selected docs for BatchBar from doc-level selection. Includes
  // documentlessMatches so a checked "Create contract" placeholder row
  // (only reachable via search) still surfaces in the batch bar.
  const selectedDocs = useMemo(
    () =>
      [...volunteers, ...documentlessMatches]
        .flatMap((v) => v.documents.map((doc) => ({ doc, vol: v })))
        .filter((entry) => selectedDocIds.has(entry.doc.id)),
    [volunteers, selectedDocIds, documentlessMatches],
  );

  function handleContractSent(docId: string) {
    setDocOverrides((prev) => ({
      ...prev,
      [docId]: { status: 'contract-signing-vol' },
    }));
  }

  function handleInvoiceSent(
    docId: string,
    volunteerId: string,
    pauschale: PauschalenType,
    updatedUsedBeforeAmount: number,
  ) {
    setDocOverrides((prev) => ({
      ...prev,
      [docId]: { status: 'timesheet-signing-vol' },
    }));
    setVolunteerLimitOverrides((prev) => ({
      ...prev,
      [volunteerId]: {
        ...prev[volunteerId],
        [pauschale]: updatedUsedBeforeAmount,
      },
    }));
  }

  // Decline on a pending countersign — a contract at 'contract-signing-coord'
  // declines as the coordinator, a timesheet at 'timesheet-signing-super'
  // declines as the supervisor (see decline-reason-dialog.tsx).
  function handleDecline(
    doc: BoardDocument,
    vol: BoardVolunteer,
    reason: string,
  ) {
    const isContract = doc.status.startsWith('contract');
    const declinedAtRole = isContract ? 'coordinator' : 'supervisor';
    setDocOverrides((prev) => ({
      ...prev,
      [doc.id]: {
        status: isContract ? 'contract-declined' : 'timesheet-declined',
        declineReason: reason,
        declinedBy: MOCK_STAFF_ACTORS[declinedAtRole],
        declinedAt: new Date().toLocaleDateString('de-DE'),
        declinedAtRole,
      },
    }));
    toast.success(t('docs.declineDialog.toast', { name: vol.name }));
  }

  // Undoes every in-session mock-data mutation (status overrides from sent
  // contracts/invoices) — a testing convenience, not a real reset endpoint.
  function handleResetPrototype() {
    setDocOverrides({});
    setVolunteerLimitOverrides({});
    setSelectedDocIds(new Set());
    toast.success(t('resetPrototypeToast'));
  }

  const invoiceTargetPauschale = invoiceCreationTarget
    ? (invoiceCreationTarget.doc.pauschale ??
      invoiceCreationTarget.vol.pauschale)
    : null;
  const invoiceTargetUsedBefore =
    invoiceCreationTarget && invoiceTargetPauschale
      ? (invoiceCreationTarget.vol.limits?.[invoiceTargetPauschale]?.used ??
        invoiceCreationTarget.vol.usedAmount)
      : null;

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
                id === 'timesheet-signing'
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
            <SelectItem value="uebungleiter">{t('toolbar.typeUL')}</SelectItem>
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
          selectedDocIds={selectedDocIds}
          onToggleDoc={toggleDoc}
          onToggleVolDocs={toggleVolDocs}
          onToggleAll={toggleAll}
          onDocumentClick={(doc, vol) => setSelectedDoc({ doc, vol })}
          onRequestAction={requestAction}
          docTypeFilter={docTypeFilter}
          dateRange={dateRange}
          activeTile={activeTile}
        />
      )}

      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          className="h-auto px-2 py-1 text-xs text-muted-foreground/70 hover:text-muted-foreground"
          onClick={handleResetPrototype}
        >
          {t('resetPrototype')}
        </Button>
      </div>

      <DocumentSheet
        doc={selectedDoc?.doc ?? null}
        vol={selectedDoc?.vol ?? null}
        signees={
          selectedDoc
            ? getTemplateSignees(selectedDoc.doc, selectedDoc.vol)
            : []
        }
        open={selectedDoc !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedDoc(null);
        }}
        onRequestAction={requestAction}
        onDecline={handleDecline}
        selectedDate={selectedDate}
        orgUId={orgUId}
      />

      <BatchBar
        selectedDocs={selectedDocs}
        onClear={() => setSelectedDocIds(new Set())}
        onRequestAction={requestAction}
      />

      <NonCompliantTimesheetDialog
        state={nonCompliantDialog}
        onOpenChange={(open) => {
          if (!open) closeNonCompliantDialog();
        }}
        onProceedAnyway={handleProceedAnyway}
        onOnlyCompliant={handleOnlyCompliant}
        onGenerateContractInstead={handleGenerateContractInstead}
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
        onSent={() => {
          if (contractCreationTarget)
            handleContractSent(contractCreationTarget.doc.id);
        }}
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
        pauschale={invoiceTargetPauschale}
        usedBeforeAmount={invoiceTargetUsedBefore}
        totalCapAmount={
          invoiceCreationTarget && invoiceTargetPauschale
            ? (invoiceCreationTarget.vol.limits?.[invoiceTargetPauschale]
                ?.total ?? invoiceCreationTarget.vol.totalCap)
            : null
        }
        contractSignedAt={
          invoiceCreationTarget && invoiceTargetPauschale
            ? findActiveContractDate(
                invoiceCreationTarget.vol,
                invoiceTargetPauschale,
              )
            : null
        }
        onSent={(updatedUsedBeforeAmount) => {
          if (invoiceCreationTarget && invoiceTargetPauschale)
            handleInvoiceSent(
              invoiceCreationTarget.doc.id,
              invoiceCreationTarget.vol.id,
              invoiceTargetPauschale,
              updatedUsedBeforeAmount,
            );
        }}
      />

      <CreateDocumentModal
        open={createDocOpen}
        onOpenChange={onCreateDocOpenChange}
        orgUId={orgUId}
        volunteers={allVolunteers}
        onContractSent={handleContractSent}
        onInvoiceSent={handleInvoiceSent}
      />
    </div>
  );
}

// ─── Board skeleton ───────────────────────────────────────────────────────────

const SKELETON_TILE_KEYS = ['tile-1', 'tile-2', 'tile-3', 'tile-4', 'tile-5'];
const SKELETON_ROW_KEYS = ['row-1', 'row-2', 'row-3'];

export function ReimbursementsBoardSkeleton() {
  return (
    <div className="space-y-6 pb-24">
      <div className="flex gap-1 overflow-x-auto pb-1">
        {SKELETON_TILE_KEYS.map((key, i) => (
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
        {SKELETON_ROW_KEYS.map((key) => (
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

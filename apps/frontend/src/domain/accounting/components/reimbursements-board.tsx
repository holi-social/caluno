'use client';

import {
  Button,
  Calendar,
  cn,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from '@repo/ui';
import {
  ArrowUpDownIcon,
  CalendarIcon,
  CheckCircle2Icon,
  CheckIcon,
  ChevronRightIcon,
  FilterXIcon,
  SearchIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ContractCreationModal } from './contract-creation-modal';
import type { PauschalenType } from './doc-type-header';
import { InvoiceCreationModal } from './invoice-creation-modal';
import type {
  NonCompliantAction,
  NonCompliantDialogState,
} from './non-compliant-timesheet-dialog';
import { NonCompliantTimesheetDialog } from './non-compliant-timesheet-dialog';
import { BatchBar } from './reimbursements-batch-bar';
import { DocumentSheet } from './reimbursements-document-sheet';
import {
  type DocTypeFilter,
  isYourActionStatus,
  ReimbursementsTable,
} from './reimbursements-volunteer-group';
import type { Signee } from './template/types';

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
  | 'timesheet-muted';

export type TileFilter =
  | 'contract-generate'
  | 'contract-signing'
  | 'timesheet-generate'
  | 'timesheet-signing'
  | 'ready-to-go'
  | null;

type PauschalenFilter = 'all' | PauschalenType;
type DatePreset = 'all-time' | 'this-month' | 'last-month' | null;
type SortOption = 'action-needed' | 'newest';

export interface DateRange {
  from: Date | undefined;
  to?: Date | undefined;
}

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

/** Applies in-session status overrides (e.g. after sending a contract for signing) onto the mock volunteer list — the mock data itself stays static. */
function applyDocStatusOverrides(
  vols: BoardVolunteer[],
  overrides: Record<string, DocStatus>,
): BoardVolunteer[] {
  if (Object.keys(overrides).length === 0) return vols;
  return vols.map((v) => {
    if (!v.documents.some((d) => d.id in overrides)) return v;
    return {
      ...v,
      documents: v.documents.map((d) => {
        const status = overrides[d.id];
        return status ? { ...d, status } : d;
      }),
    };
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

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_VOLUNTEERS: BoardVolunteer[] = [
  // ── 1–15: ehrenamt ────────────────────────────────────────────────────────
  {
    id: 'v1',
    name: 'Anna Müller',
    initials: 'AM',
    pauschale: 'ehrenamt',
    usedAmount: 360,
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
        status: 'timesheet-ready',
        amount: 120,
        hours: 8,
        lastActionDate: '06.07.2026',
        periodLabel: 'Juli 2026',
      },
      {
        id: 'd108',
        status: 'timesheet-ready',
        amount: 120,
        hours: 8,
        lastActionDate: '28.06.2026',
        periodLabel: 'Juni 2026',
      },
      {
        id: 'd109',
        status: 'timesheet-ready',
        amount: 120,
        hours: 8,
        lastActionDate: '30.05.2026',
        periodLabel: 'Mai 2026',
      },
      {
        id: 'd110',
        status: 'timesheet-ready',
        amount: 120,
        hours: 8,
        lastActionDate: '29.04.2026',
        periodLabel: 'April 2026',
      },
      {
        id: 'd111',
        status: 'timesheet-ready',
        amount: 120,
        hours: 8,
        lastActionDate: '28.03.2026',
        periodLabel: 'März 2026',
      },
      {
        id: 'd112',
        status: 'timesheet-ready',
        amount: 120,
        hours: 8,
        lastActionDate: '27.02.2026',
        periodLabel: 'Februar 2026',
      },
    ],
  },
  {
    id: 'v2',
    name: 'Ben Schmidt',
    initials: 'BS',
    pauschale: 'ehrenamt',
    usedAmount: 480,
    totalCap: 840,
    documents: [
      {
        id: 'd3',
        status: 'contract-active',
        lastActionDate: '15.01.2026',
        periodLabel: '2026',
      },
      {
        id: 'd4',
        status: 'timesheet-signing-vol',
        amount: 180,
        hours: 12,
        lastActionDate: '03.07.2026',
        periodLabel: 'Juli 2026',
      },
    ],
  },
  {
    id: 'v3',
    name: 'Clara Weber',
    initials: 'CW',
    pauschale: 'ehrenamt',
    usedAmount: 240,
    totalCap: 840,
    documents: [
      {
        id: 'd5',
        status: 'contract-generate',
        lastActionDate: '01.07.2026',
        periodLabel: '2026',
      },
    ],
  },
  {
    id: 'v4',
    name: 'David Fischer',
    initials: 'DF',
    pauschale: 'ehrenamt',
    usedAmount: 840,
    totalCap: 840,
    documents: [
      {
        id: 'd6',
        status: 'contract-active',
        lastActionDate: '01.01.2026',
        periodLabel: '2026',
      },
      {
        id: 'd7',
        status: 'timesheet-ready',
        amount: 120,
        hours: 8,
        lastActionDate: '05.07.2026',
        periodLabel: 'Juli 2026',
        isOverCap: true,
      },
    ],
  },
  {
    id: 'v5',
    name: 'Emma Wagner',
    initials: 'EW',
    pauschale: 'ehrenamt',
    usedAmount: 360,
    totalCap: 840,
    documents: [
      {
        id: 'd151',
        status: 'contract-active',
        lastActionDate: '01.01.2026',
        periodLabel: '2026',
      },
      {
        id: 'd8',
        status: 'timesheet-generate',
        amount: 60,
        hours: 4,
        lastActionDate: '07.07.2026',
        periodLabel: 'Juli 2026',
      },
    ],
  },
  {
    id: 'v6',
    name: 'Felix Becker',
    initials: 'FB',
    pauschale: 'ehrenamt',
    usedAmount: 600,
    totalCap: 840,
    documents: [
      {
        id: 'd9',
        status: 'contract-active',
        lastActionDate: '01.01.2026',
        periodLabel: '2026',
      },
      {
        id: 'd10',
        status: 'timesheet-signing-super',
        amount: 240,
        hours: 16,
        lastActionDate: '02.07.2026',
        periodLabel: 'Juni 2026',
      },
    ],
  },
  {
    id: 'v7',
    name: 'Greta Hoffmann',
    initials: 'GH',
    pauschale: 'ehrenamt',
    usedAmount: 160,
    totalCap: 840,
    documents: [
      {
        id: 'd11',
        status: 'contract-signing-coord',
        lastActionDate: '06.07.2026',
        periodLabel: '2026',
      },
    ],
  },
  {
    id: 'v8',
    name: 'Hans Schulz',
    initials: 'HS',
    pauschale: 'ehrenamt',
    usedAmount: 420,
    totalCap: 840,
    documents: [
      {
        id: 'd12',
        status: 'contract-active',
        lastActionDate: '01.01.2026',
        periodLabel: '2026',
      },
      {
        id: 'd13',
        status: 'timesheet-signing-vol',
        amount: 120,
        hours: 8,
        lastActionDate: '01.07.2026',
        periodLabel: 'Juli 2026',
      },
      {
        id: 'd14',
        status: 'timesheet-ready',
        amount: 120,
        hours: 8,
        lastActionDate: '05.06.2026',
        periodLabel: 'Juni 2026',
      },
      {
        id: 'd113',
        status: 'timesheet-ready',
        amount: 120,
        hours: 8,
        lastActionDate: '30.05.2026',
        periodLabel: 'Mai 2026',
      },
      {
        id: 'd114',
        status: 'timesheet-ready',
        amount: 120,
        hours: 8,
        lastActionDate: '29.04.2026',
        periodLabel: 'April 2026',
      },
      {
        id: 'd115',
        status: 'timesheet-ready',
        amount: 120,
        hours: 8,
        lastActionDate: '28.03.2026',
        periodLabel: 'März 2026',
      },
      {
        id: 'd116',
        status: 'timesheet-ready',
        amount: 120,
        hours: 8,
        lastActionDate: '27.02.2026',
        periodLabel: 'Februar 2026',
      },
      {
        id: 'd117',
        status: 'timesheet-ready',
        amount: 120,
        hours: 8,
        lastActionDate: '30.01.2026',
        periodLabel: 'Januar 2026',
      },
    ],
  },
  {
    id: 'v9',
    name: 'Ida Koch',
    initials: 'IK',
    pauschale: 'ehrenamt',
    usedAmount: 0,
    totalCap: 840,
    documents: [
      {
        id: 'd15',
        status: 'contract-generate',
        lastActionDate: '07.07.2026',
        periodLabel: '2026',
      },
    ],
  },
  {
    id: 'v10',
    name: 'Jonas Bauer',
    initials: 'JB',
    pauschale: 'ehrenamt',
    usedAmount: 480,
    totalCap: 840,
    documents: [
      {
        id: 'd16',
        status: 'contract-active',
        lastActionDate: '01.02.2026',
        periodLabel: '2026',
      },
      {
        id: 'd17',
        status: 'timesheet-generate',
        amount: 180,
        hours: 12,
        lastActionDate: '06.07.2026',
        periodLabel: 'Juli 2026',
      },
    ],
  },
  {
    id: 'v11',
    name: 'Klara Richter',
    initials: 'KR',
    pauschale: 'ehrenamt',
    usedAmount: 300,
    totalCap: 840,
    documents: [
      {
        id: 'd152',
        status: 'contract-active',
        lastActionDate: '01.01.2026',
        periodLabel: '2026',
      },
      {
        id: 'd18',
        status: 'timesheet-signing-super',
        amount: 60,
        hours: 4,
        lastActionDate: '30.06.2026',
        periodLabel: 'Juni 2026',
      },
    ],
  },
  {
    id: 'v12',
    name: 'Lena Klein',
    initials: 'LK',
    pauschale: 'ehrenamt',
    usedAmount: 120,
    totalCap: 840,
    documents: [
      {
        id: 'd19',
        status: 'contract-active',
        lastActionDate: '01.01.2026',
        periodLabel: '2026',
      },
      {
        id: 'd20',
        status: 'timesheet-generate',
        amount: 120,
        hours: 8,
        lastActionDate: '07.07.2026',
        periodLabel: 'Juli 2026',
      },
    ],
  },
  {
    id: 'v13',
    name: 'Max Wolf',
    initials: 'MW',
    pauschale: 'ehrenamt',
    usedAmount: 660,
    totalCap: 840,
    documents: [
      {
        id: 'd21',
        status: 'contract-active',
        lastActionDate: '01.03.2026',
        periodLabel: '2026',
      },
      {
        id: 'd22',
        status: 'timesheet-ready',
        amount: 60,
        hours: 4,
        lastActionDate: '07.07.2026',
        periodLabel: 'Juli 2026',
      },
      {
        id: 'd118',
        status: 'timesheet-ready',
        amount: 180,
        hours: 12,
        lastActionDate: '28.06.2026',
        periodLabel: 'Juni 2026',
      },
      {
        id: 'd119',
        status: 'timesheet-ready',
        amount: 180,
        hours: 12,
        lastActionDate: '30.05.2026',
        periodLabel: 'Mai 2026',
      },
      {
        id: 'd120',
        status: 'timesheet-ready',
        amount: 120,
        hours: 8,
        lastActionDate: '29.04.2026',
        periodLabel: 'April 2026',
      },
      {
        id: 'd121',
        status: 'timesheet-ready',
        amount: 120,
        hours: 8,
        lastActionDate: '31.03.2026',
        periodLabel: 'März 2026',
      },
    ],
  },
  {
    id: 'v14',
    name: 'Nina Schröder',
    initials: 'NS',
    pauschale: 'ehrenamt',
    usedAmount: 540,
    totalCap: 840,
    documents: [
      {
        id: 'd23',
        status: 'contract-active',
        lastActionDate: '01.01.2026',
        periodLabel: '2026',
      },
      {
        id: 'd24',
        status: 'timesheet-signing-vol',
        amount: 180,
        hours: 12,
        lastActionDate: '04.07.2026',
        periodLabel: 'Juli 2026',
      },
    ],
  },
  {
    id: 'v15',
    name: 'Otto Braun',
    initials: 'OB',
    pauschale: 'ehrenamt',
    usedAmount: 300,
    totalCap: 840,
    documents: [
      {
        id: 'd25',
        status: 'contract-active',
        lastActionDate: '01.01.2026',
        periodLabel: '2026',
      },
      {
        id: 'd26',
        status: 'timesheet-ready',
        amount: 120,
        hours: 8,
        lastActionDate: '02.07.2026',
        periodLabel: 'Juli 2026',
      },
    ],
  },
  // ── 16–30: uebungleiter ───────────────────────────────────────────────────
  {
    id: 'v16',
    name: 'Paula Zimmermann',
    initials: 'PZ',
    pauschale: 'uebungleiter',
    usedAmount: 1200,
    totalCap: 3000,
    documents: [
      {
        id: 'd27',
        status: 'contract-active',
        lastActionDate: '01.01.2026',
        periodLabel: '2026',
      },
      {
        id: 'd28',
        status: 'timesheet-ready',
        amount: 240,
        hours: 16,
        lastActionDate: '06.07.2026',
        periodLabel: 'Juli 2026',
      },
      {
        id: 'd122',
        status: 'timesheet-ready',
        amount: 360,
        hours: 24,
        lastActionDate: '28.06.2026',
        periodLabel: 'Juni 2026',
      },
      {
        id: 'd123',
        status: 'timesheet-ready',
        amount: 360,
        hours: 24,
        lastActionDate: '30.05.2026',
        periodLabel: 'Mai 2026',
      },
      {
        id: 'd124',
        status: 'timesheet-ready',
        amount: 360,
        hours: 24,
        lastActionDate: '29.04.2026',
        periodLabel: 'April 2026',
      },
      {
        id: 'd125',
        status: 'timesheet-ready',
        amount: 360,
        hours: 24,
        lastActionDate: '28.03.2026',
        periodLabel: 'März 2026',
      },
      {
        id: 'd126',
        status: 'timesheet-ready',
        amount: 360,
        hours: 24,
        lastActionDate: '27.02.2026',
        periodLabel: 'Februar 2026',
      },
      {
        id: 'd127',
        status: 'timesheet-ready',
        amount: 360,
        hours: 24,
        lastActionDate: '30.01.2026',
        periodLabel: 'Januar 2026',
      },
    ],
  },
  {
    id: 'v17',
    name: 'Romy Krause',
    initials: 'RK',
    pauschale: 'uebungleiter',
    usedAmount: 1200,
    totalCap: 3000,
    documents: [
      {
        id: 'd29',
        status: 'contract-active',
        lastActionDate: '01.02.2026',
        periodLabel: '2026',
      },
      {
        id: 'd30',
        status: 'timesheet-signing-vol',
        amount: 360,
        hours: 24,
        lastActionDate: '03.07.2026',
        periodLabel: 'Juli 2026',
      },
    ],
  },
  {
    id: 'v18',
    name: 'Stefan Lehmann',
    initials: 'SL',
    pauschale: 'uebungleiter',
    usedAmount: 600,
    totalCap: 3000,
    documents: [
      {
        id: 'd31',
        status: 'contract-active',
        lastActionDate: '01.01.2026',
        periodLabel: '2026',
      },
      {
        id: 'd32',
        status: 'timesheet-generate',
        amount: 480,
        hours: 32,
        lastActionDate: '06.07.2026',
        periodLabel: 'Juli 2026',
      },
    ],
  },
  {
    id: 'v19',
    name: 'Tina Schmitt',
    initials: 'TS',
    pauschale: 'uebungleiter',
    usedAmount: 1800,
    totalCap: 3000,
    documents: [
      {
        id: 'd33',
        status: 'contract-active',
        lastActionDate: '01.01.2026',
        periodLabel: '2026',
      },
      {
        id: 'd34',
        status: 'timesheet-signing-super',
        amount: 240,
        hours: 16,
        lastActionDate: '01.07.2026',
        periodLabel: 'Juli 2026',
      },
      {
        id: 'd35',
        status: 'timesheet-ready',
        amount: 240,
        hours: 16,
        lastActionDate: '15.06.2026',
        periodLabel: 'Juni 2026',
      },
      {
        id: 'd128',
        status: 'timesheet-ready',
        amount: 240,
        hours: 16,
        lastActionDate: '30.05.2026',
        periodLabel: 'Mai 2026',
      },
      {
        id: 'd129',
        status: 'timesheet-ready',
        amount: 360,
        hours: 24,
        lastActionDate: '29.04.2026',
        periodLabel: 'April 2026',
      },
      {
        id: 'd130',
        status: 'timesheet-ready',
        amount: 360,
        hours: 24,
        lastActionDate: '28.03.2026',
        periodLabel: 'März 2026',
      },
      {
        id: 'd131',
        status: 'timesheet-ready',
        amount: 360,
        hours: 24,
        lastActionDate: '27.02.2026',
        periodLabel: 'Februar 2026',
      },
      {
        id: 'd132',
        status: 'timesheet-ready',
        amount: 240,
        hours: 16,
        lastActionDate: '30.01.2026',
        periodLabel: 'Januar 2026',
      },
    ],
  },
  {
    id: 'v20',
    name: 'Ulrike Neumann',
    initials: 'UN',
    pauschale: 'uebungleiter',
    usedAmount: 0,
    totalCap: 3000,
    documents: [
      {
        id: 'd36',
        status: 'contract-generate',
        lastActionDate: '07.07.2026',
        periodLabel: '2026',
      },
    ],
  },
  {
    id: 'v21',
    name: 'Viktor Schwarz',
    initials: 'VS',
    pauschale: 'uebungleiter',
    usedAmount: 1500,
    totalCap: 3000,
    documents: [
      {
        id: 'd37',
        status: 'contract-active',
        lastActionDate: '01.01.2026',
        periodLabel: '2026',
      },
      {
        id: 'd38',
        status: 'timesheet-generate',
        amount: 360,
        hours: 24,
        lastActionDate: '05.07.2026',
        periodLabel: 'Juli 2026',
      },
      {
        id: 'd133',
        status: 'timesheet-ready',
        amount: 480,
        hours: 32,
        lastActionDate: '28.06.2026',
        periodLabel: 'Juni 2026',
      },
      {
        id: 'd134',
        status: 'timesheet-ready',
        amount: 480,
        hours: 32,
        lastActionDate: '30.05.2026',
        periodLabel: 'Mai 2026',
      },
      {
        id: 'd135',
        status: 'timesheet-ready',
        amount: 480,
        hours: 32,
        lastActionDate: '29.04.2026',
        periodLabel: 'April 2026',
      },
      {
        id: 'd136',
        status: 'timesheet-ready',
        amount: 480,
        hours: 32,
        lastActionDate: '28.03.2026',
        periodLabel: 'März 2026',
      },
      {
        id: 'd137',
        status: 'timesheet-ready',
        amount: 480,
        hours: 32,
        lastActionDate: '27.02.2026',
        periodLabel: 'Februar 2026',
      },
      {
        id: 'd138',
        status: 'timesheet-ready',
        amount: 300,
        hours: 20,
        lastActionDate: '30.01.2026',
        periodLabel: 'Januar 2026',
      },
    ],
  },
  {
    id: 'v22',
    name: 'Wendy Lange',
    initials: 'WL',
    pauschale: 'uebungleiter',
    usedAmount: 480,
    totalCap: 3000,
    documents: [
      {
        id: 'd39',
        status: 'contract-signing-vol',
        lastActionDate: '04.07.2026',
        periodLabel: '2026',
      },
    ],
  },
  {
    id: 'v23',
    name: 'Xaver Krüger',
    initials: 'XK',
    pauschale: 'uebungleiter',
    usedAmount: 1440,
    totalCap: 3000,
    documents: [
      {
        id: 'd40',
        status: 'contract-active',
        lastActionDate: '01.03.2026',
        periodLabel: '2026',
      },
      {
        id: 'd41',
        status: 'timesheet-ready',
        amount: 480,
        hours: 32,
        lastActionDate: '30.06.2026',
        periodLabel: 'Juni 2026',
      },
      {
        id: 'd42',
        status: 'timesheet-signing-vol',
        amount: 360,
        hours: 24,
        lastActionDate: '02.07.2026',
        periodLabel: 'Juli 2026',
      },
    ],
  },
  {
    id: 'v24',
    name: 'Yvonne Werner',
    initials: 'YW',
    pauschale: 'uebungleiter',
    usedAmount: 960,
    totalCap: 3000,
    documents: [
      {
        id: 'd43',
        status: 'contract-active',
        lastActionDate: '01.01.2026',
        periodLabel: '2026',
      },
      {
        id: 'd44',
        status: 'timesheet-generate',
        amount: 240,
        hours: 16,
        lastActionDate: '07.07.2026',
        periodLabel: 'Juli 2026',
      },
    ],
  },
  {
    id: 'v25',
    name: 'Zoé Meier',
    initials: 'ZM',
    pauschale: 'uebungleiter',
    usedAmount: 3000,
    totalCap: 3000,
    documents: [
      {
        id: 'd45',
        status: 'contract-active',
        lastActionDate: '01.01.2026',
        periodLabel: '2026',
      },
      {
        id: 'd46',
        status: 'timesheet-ready',
        amount: 240,
        hours: 16,
        lastActionDate: '07.07.2026',
        periodLabel: 'Juli 2026',
        isOverCap: true,
      },
    ],
  },
  {
    id: 'v26',
    name: 'Arne Haas',
    initials: 'AH',
    pauschale: 'uebungleiter',
    usedAmount: 1680,
    totalCap: 3000,
    documents: [
      {
        id: 'd47',
        status: 'contract-active',
        lastActionDate: '01.02.2026',
        periodLabel: '2026',
      },
      {
        id: 'd48',
        status: 'timesheet-signing-super',
        amount: 360,
        hours: 24,
        lastActionDate: '06.07.2026',
        periodLabel: 'Juli 2026',
      },
    ],
  },
  {
    id: 'v27',
    name: 'Birgit Köhler',
    initials: 'BK',
    pauschale: 'uebungleiter',
    usedAmount: 720,
    totalCap: 3000,
    documents: [
      {
        id: 'd49',
        status: 'contract-active',
        lastActionDate: '01.01.2026',
        periodLabel: '2026',
      },
      {
        id: 'd50',
        status: 'timesheet-signing-vol',
        amount: 240,
        hours: 16,
        lastActionDate: '03.07.2026',
        periodLabel: 'Juli 2026',
      },
    ],
  },
  {
    id: 'v28',
    name: 'Carsten Schulze',
    initials: 'CS',
    pauschale: 'uebungleiter',
    usedAmount: 2160,
    totalCap: 3000,
    documents: [
      {
        id: 'd51',
        status: 'contract-active',
        lastActionDate: '01.01.2026',
        periodLabel: '2026',
      },
      {
        id: 'd52',
        status: 'timesheet-ready',
        amount: 480,
        hours: 32,
        lastActionDate: '04.07.2026',
        periodLabel: 'Juli 2026',
      },
      {
        id: 'd139',
        status: 'timesheet-ready',
        amount: 360,
        hours: 24,
        lastActionDate: '28.06.2026',
        periodLabel: 'Juni 2026',
      },
      {
        id: 'd140',
        status: 'timesheet-ready',
        amount: 360,
        hours: 24,
        lastActionDate: '30.05.2026',
        periodLabel: 'Mai 2026',
      },
      {
        id: 'd141',
        status: 'timesheet-ready',
        amount: 360,
        hours: 24,
        lastActionDate: '29.04.2026',
        periodLabel: 'April 2026',
      },
      {
        id: 'd142',
        status: 'timesheet-ready',
        amount: 360,
        hours: 24,
        lastActionDate: '28.03.2026',
        periodLabel: 'März 2026',
      },
      {
        id: 'd143',
        status: 'timesheet-ready',
        amount: 240,
        hours: 16,
        lastActionDate: '27.02.2026',
        periodLabel: 'Februar 2026',
      },
    ],
  },
  {
    id: 'v29',
    name: 'Diana Maier',
    initials: 'DM',
    pauschale: 'uebungleiter',
    usedAmount: 360,
    totalCap: 3000,
    documents: [
      {
        id: 'd53',
        status: 'contract-active',
        lastActionDate: '01.01.2026',
        periodLabel: '2026',
      },
      {
        id: 'd54',
        status: 'timesheet-generate',
        amount: 120,
        hours: 8,
        lastActionDate: '07.07.2026',
        periodLabel: 'Juli 2026',
      },
    ],
  },
  {
    id: 'v30',
    name: 'Erik Günther',
    initials: 'EG',
    pauschale: 'uebungleiter',
    usedAmount: 1080,
    totalCap: 3000,
    documents: [
      {
        id: 'd55',
        status: 'contract-active',
        lastActionDate: '01.04.2026',
        periodLabel: '2026',
      },
      {
        id: 'd56',
        status: 'timesheet-signing-vol',
        amount: 360,
        hours: 24,
        lastActionDate: '01.07.2026',
        periodLabel: 'Juli 2026',
      },
      {
        id: 'd57',
        status: 'timesheet-ready',
        amount: 360,
        hours: 24,
        lastActionDate: '25.06.2026',
        periodLabel: 'Juni 2026',
      },
    ],
  },
  // ── 31–40: dual pauschale ──────────────────────────────────────────────────
  {
    id: 'v31',
    name: 'Franziska Möller',
    initials: 'FM',
    pauschale: 'ehrenamt',
    usedAmount: 420,
    totalCap: 840,
    limits: {
      ehrenamt: { used: 420, total: 840 },
      uebungleiter: { used: 1200, total: 3000 },
    },
    documents: [
      {
        id: 'd58',
        status: 'contract-active',
        lastActionDate: '01.01.2026',
        periodLabel: '2026',
        pauschale: 'ehrenamt',
      },
      {
        id: 'd59',
        status: 'contract-active',
        lastActionDate: '01.01.2026',
        periodLabel: '2026',
        pauschale: 'uebungleiter',
      },
      {
        id: 'd60',
        status: 'timesheet-ready',
        amount: 120,
        hours: 8,
        lastActionDate: '07.07.2026',
        periodLabel: 'Juli 2026',
        pauschale: 'ehrenamt',
      },
      {
        id: 'd61',
        status: 'timesheet-signing-vol',
        amount: 360,
        hours: 24,
        lastActionDate: '04.07.2026',
        periodLabel: 'Juli 2026',
        pauschale: 'uebungleiter',
      },
    ],
  },
  {
    id: 'v32',
    name: 'Georg Schäfer',
    initials: 'GS',
    pauschale: 'ehrenamt',
    usedAmount: 300,
    totalCap: 840,
    limits: {
      ehrenamt: { used: 300, total: 840 },
      uebungleiter: { used: 600, total: 3000 },
    },
    documents: [
      {
        id: 'd62',
        status: 'contract-active',
        lastActionDate: '01.01.2026',
        periodLabel: '2026',
        pauschale: 'ehrenamt',
      },
      {
        id: 'd160',
        status: 'contract-active',
        lastActionDate: '01.01.2026',
        periodLabel: '2026',
        pauschale: 'uebungleiter',
      },
      {
        id: 'd63',
        status: 'timesheet-generate',
        amount: 240,
        hours: 16,
        lastActionDate: '07.07.2026',
        periodLabel: 'Juli 2026',
        pauschale: 'uebungleiter',
      },
    ],
  },
  {
    id: 'v33',
    name: 'Hannah Kaiser',
    initials: 'HK',
    pauschale: 'uebungleiter',
    usedAmount: 1440,
    totalCap: 3000,
    limits: {
      ehrenamt: { used: 600, total: 840 },
      uebungleiter: { used: 1440, total: 3000 },
    },
    documents: [
      {
        id: 'd64',
        status: 'contract-active',
        lastActionDate: '01.01.2026',
        periodLabel: '2026',
        pauschale: 'ehrenamt',
      },
      {
        id: 'd65',
        status: 'contract-active',
        lastActionDate: '01.01.2026',
        periodLabel: '2026',
        pauschale: 'uebungleiter',
      },
      {
        id: 'd66',
        status: 'timesheet-signing-super',
        amount: 120,
        hours: 8,
        lastActionDate: '02.07.2026',
        periodLabel: 'Juli 2026',
        pauschale: 'ehrenamt',
      },
      {
        id: 'd67',
        status: 'timesheet-ready',
        amount: 480,
        hours: 32,
        lastActionDate: '05.07.2026',
        periodLabel: 'Juli 2026',
        pauschale: 'uebungleiter',
      },
      {
        id: 'd144',
        status: 'timesheet-ready',
        amount: 120,
        hours: 8,
        lastActionDate: '28.06.2026',
        periodLabel: 'Juni 2026',
        pauschale: 'ehrenamt',
      },
      {
        id: 'd145',
        status: 'timesheet-ready',
        amount: 480,
        hours: 32,
        lastActionDate: '28.06.2026',
        periodLabel: 'Juni 2026',
        pauschale: 'uebungleiter',
      },
      {
        id: 'd146',
        status: 'timesheet-ready',
        amount: 120,
        hours: 8,
        lastActionDate: '30.05.2026',
        periodLabel: 'Mai 2026',
        pauschale: 'ehrenamt',
      },
      {
        id: 'd147',
        status: 'timesheet-ready',
        amount: 480,
        hours: 32,
        lastActionDate: '30.05.2026',
        periodLabel: 'Mai 2026',
        pauschale: 'uebungleiter',
      },
      {
        id: 'd148',
        status: 'timesheet-ready',
        amount: 120,
        hours: 8,
        lastActionDate: '29.04.2026',
        periodLabel: 'April 2026',
        pauschale: 'ehrenamt',
      },
      {
        id: 'd149',
        status: 'timesheet-ready',
        amount: 120,
        hours: 8,
        lastActionDate: '28.03.2026',
        periodLabel: 'März 2026',
        pauschale: 'ehrenamt',
      },
      {
        id: 'd150',
        status: 'timesheet-ready',
        amount: 120,
        hours: 8,
        lastActionDate: '27.02.2026',
        periodLabel: 'Februar 2026',
        pauschale: 'ehrenamt',
      },
    ],
  },
  {
    id: 'v34',
    name: 'Ingo Brandt',
    initials: 'IB',
    pauschale: 'ehrenamt',
    usedAmount: 360,
    totalCap: 840,
    limits: {
      ehrenamt: { used: 360, total: 840 },
      uebungleiter: { used: 1200, total: 3000 },
    },
    documents: [
      {
        id: 'd153',
        status: 'contract-active',
        lastActionDate: '01.01.2026',
        periodLabel: '2026',
        pauschale: 'ehrenamt',
      },
      {
        id: 'd154',
        status: 'contract-active',
        lastActionDate: '01.01.2026',
        periodLabel: '2026',
        pauschale: 'uebungleiter',
      },
      {
        id: 'd68',
        status: 'timesheet-generate',
        amount: 60,
        hours: 4,
        lastActionDate: '07.07.2026',
        periodLabel: 'Juli 2026',
        pauschale: 'ehrenamt',
      },
      {
        id: 'd69',
        status: 'timesheet-signing-vol',
        amount: 240,
        hours: 16,
        lastActionDate: '03.07.2026',
        periodLabel: 'Juli 2026',
        pauschale: 'uebungleiter',
      },
    ],
  },
  {
    id: 'v35',
    name: 'Julia Vogt',
    initials: 'JV',
    pauschale: 'ehrenamt',
    usedAmount: 180,
    totalCap: 840,
    limits: {
      ehrenamt: { used: 180, total: 840 },
      uebungleiter: { used: 900, total: 3000 },
    },
    documents: [
      {
        id: 'd70',
        status: 'contract-signing-vol',
        lastActionDate: '06.07.2026',
        periodLabel: '2026',
        pauschale: 'ehrenamt',
      },
      {
        id: 'd71',
        status: 'contract-signing-coord',
        lastActionDate: '07.07.2026',
        periodLabel: '2026',
        pauschale: 'uebungleiter',
      },
    ],
  },
  {
    id: 'v36',
    name: 'Klaus Sommer',
    initials: 'KS',
    pauschale: 'uebungleiter',
    usedAmount: 1500,
    totalCap: 3000,
    limits: {
      ehrenamt: { used: 480, total: 840 },
      uebungleiter: { used: 1500, total: 3000 },
    },
    documents: [
      {
        id: 'd72',
        status: 'contract-active',
        lastActionDate: '01.01.2026',
        periodLabel: '2026',
        pauschale: 'ehrenamt',
      },
      {
        id: 'd73',
        status: 'contract-active',
        lastActionDate: '01.01.2026',
        periodLabel: '2026',
        pauschale: 'uebungleiter',
      },
      {
        id: 'd74',
        status: 'timesheet-ready',
        amount: 120,
        hours: 8,
        lastActionDate: '01.07.2026',
        periodLabel: 'Juli 2026',
        pauschale: 'ehrenamt',
      },
      {
        id: 'd75',
        status: 'timesheet-signing-super',
        amount: 480,
        hours: 32,
        lastActionDate: '04.07.2026',
        periodLabel: 'Juli 2026',
        pauschale: 'uebungleiter',
      },
    ],
  },
  {
    id: 'v37',
    name: 'Laura Kühn',
    initials: 'LK2',
    pauschale: 'ehrenamt',
    usedAmount: 540,
    totalCap: 840,
    limits: {
      ehrenamt: { used: 540, total: 840 },
      uebungleiter: { used: 1560, total: 3000 },
    },
    documents: [
      {
        id: 'd76',
        status: 'contract-active',
        lastActionDate: '01.02.2026',
        periodLabel: '2026',
        pauschale: 'ehrenamt',
      },
      {
        id: 'd161',
        status: 'contract-active',
        lastActionDate: '01.01.2026',
        periodLabel: '2026',
        pauschale: 'uebungleiter',
      },
      {
        id: 'd77',
        status: 'timesheet-generate',
        amount: 180,
        hours: 12,
        lastActionDate: '07.07.2026',
        periodLabel: 'Juli 2026',
        pauschale: 'ehrenamt',
      },
      {
        id: 'd78',
        status: 'timesheet-signing-vol',
        amount: 360,
        hours: 24,
        lastActionDate: '05.07.2026',
        periodLabel: 'Juli 2026',
        pauschale: 'uebungleiter',
      },
    ],
  },
  {
    id: 'v38',
    name: 'Markus Berg',
    initials: 'MB',
    pauschale: 'ehrenamt',
    usedAmount: 60,
    totalCap: 840,
    limits: {
      ehrenamt: { used: 60, total: 840 },
      uebungleiter: { used: 240, total: 3000 },
    },
    documents: [
      {
        id: 'd155',
        status: 'contract-active',
        lastActionDate: '01.01.2026',
        periodLabel: '2026',
        pauschale: 'ehrenamt',
      },
      {
        id: 'd156',
        status: 'contract-active',
        lastActionDate: '01.01.2026',
        periodLabel: '2026',
        pauschale: 'uebungleiter',
      },
      {
        id: 'd79',
        status: 'timesheet-generate',
        amount: 60,
        hours: 4,
        lastActionDate: '07.07.2026',
        periodLabel: 'Juli 2026',
        pauschale: 'ehrenamt',
      },
      {
        id: 'd80',
        status: 'timesheet-signing-super',
        amount: 240,
        hours: 16,
        lastActionDate: '06.07.2026',
        periodLabel: 'Juli 2026',
        pauschale: 'uebungleiter',
      },
    ],
  },
  {
    id: 'v39',
    name: 'Nicole Fuchs',
    initials: 'NF',
    pauschale: 'ehrenamt',
    usedAmount: 400,
    totalCap: 840,
    limits: {
      ehrenamt: { used: 400, total: 840 },
      uebungleiter: { used: 800, total: 3000 },
    },
    documents: [
      {
        id: 'd81',
        status: 'contract-signing-vol',
        lastActionDate: '04.07.2026',
        periodLabel: '2026',
        pauschale: 'ehrenamt',
      },
      {
        id: 'd82',
        status: 'contract-generate',
        lastActionDate: '05.07.2026',
        periodLabel: '2026',
        pauschale: 'uebungleiter',
      },
    ],
  },
  {
    id: 'v40',
    name: 'Oliver Peters',
    initials: 'OP',
    pauschale: 'uebungleiter',
    usedAmount: 1320,
    totalCap: 3000,
    limits: {
      ehrenamt: { used: 660, total: 840 },
      uebungleiter: { used: 1320, total: 3000 },
    },
    documents: [
      {
        id: 'd83',
        status: 'contract-active',
        lastActionDate: '01.01.2026',
        periodLabel: '2026',
        pauschale: 'ehrenamt',
      },
      {
        id: 'd84',
        status: 'contract-active',
        lastActionDate: '01.01.2026',
        periodLabel: '2026',
        pauschale: 'uebungleiter',
      },
      {
        id: 'd85',
        status: 'timesheet-ready',
        amount: 120,
        hours: 8,
        lastActionDate: '07.07.2026',
        periodLabel: 'Juli 2026',
        pauschale: 'ehrenamt',
      },
      {
        id: 'd86',
        status: 'timesheet-generate',
        amount: 360,
        hours: 24,
        lastActionDate: '05.07.2026',
        periodLabel: 'Juli 2026',
        pauschale: 'uebungleiter',
      },
    ],
  },
  // ── 41–50: additional mix ─────────────────────────────────────────────────
  {
    id: 'v41',
    name: 'Patricia Roth',
    initials: 'PR',
    pauschale: 'ehrenamt',
    usedAmount: 360,
    totalCap: 840,
    documents: [
      {
        id: 'd87',
        status: 'contract-active',
        lastActionDate: '01.01.2026',
        periodLabel: '2026',
      },
      {
        id: 'd88',
        status: 'timesheet-signing-vol',
        amount: 60,
        hours: 4,
        lastActionDate: '07.07.2026',
        periodLabel: 'Juli 2026',
      },
    ],
  },
  {
    id: 'v42',
    name: 'Quentin Hahn',
    initials: 'QH',
    pauschale: 'uebungleiter',
    usedAmount: 2880,
    totalCap: 3000,
    documents: [
      {
        id: 'd89',
        status: 'contract-active',
        lastActionDate: '01.01.2026',
        periodLabel: '2026',
      },
      {
        id: 'd90',
        status: 'timesheet-signing-super',
        amount: 480,
        hours: 32,
        lastActionDate: '03.07.2026',
        periodLabel: 'Juli 2026',
      },
    ],
  },
  {
    id: 'v43',
    name: 'Rosa Herrmann',
    initials: 'RH',
    pauschale: 'ehrenamt',
    usedAmount: 120,
    totalCap: 840,
    documents: [
      {
        id: 'd91',
        status: 'timesheet-ready',
        amount: 120,
        hours: 8,
        lastActionDate: '30.06.2026',
        periodLabel: 'Juni 2026',
      },
      {
        id: 'd92',
        status: 'contract-generate',
        lastActionDate: '06.07.2026',
        periodLabel: '2026',
      },
    ],
  },
  {
    id: 'v44',
    name: 'Sabine Berger',
    initials: 'SB',
    pauschale: 'uebungleiter',
    usedAmount: 840,
    totalCap: 3000,
    documents: [
      {
        id: 'd93',
        status: 'contract-active',
        lastActionDate: '01.03.2026',
        periodLabel: '2026',
      },
      {
        id: 'd94',
        status: 'timesheet-generate',
        amount: 240,
        hours: 16,
        lastActionDate: '04.07.2026',
        periodLabel: 'Juli 2026',
      },
      {
        id: 'd95',
        status: 'timesheet-ready',
        amount: 360,
        hours: 24,
        lastActionDate: '20.06.2026',
        periodLabel: 'Juni 2026',
      },
    ],
  },
  {
    id: 'v45',
    name: 'Thomas Förster',
    initials: 'TF',
    pauschale: 'ehrenamt',
    usedAmount: 440,
    totalCap: 840,
    documents: [
      {
        id: 'd96',
        status: 'contract-active',
        lastActionDate: '01.01.2026',
        periodLabel: '2026',
      },
      {
        id: 'd97',
        status: 'timesheet-signing-super',
        amount: 180,
        hours: 12,
        lastActionDate: '02.07.2026',
        periodLabel: 'Juli 2026',
      },
    ],
  },
  {
    id: 'v46',
    name: 'Ursula Hartmann',
    initials: 'UH',
    pauschale: 'uebungleiter',
    usedAmount: 1560,
    totalCap: 3000,
    documents: [
      {
        id: 'd98',
        status: 'contract-active',
        lastActionDate: '01.01.2026',
        periodLabel: '2026',
      },
      {
        id: 'd99',
        status: 'timesheet-signing-vol',
        amount: 480,
        hours: 32,
        lastActionDate: '01.07.2026',
        periodLabel: 'Juli 2026',
      },
    ],
  },
  {
    id: 'v47',
    name: 'Volker Sauer',
    initials: 'VoS',
    pauschale: 'ehrenamt',
    usedAmount: 60,
    totalCap: 840,
    documents: [
      {
        id: 'd157',
        status: 'contract-active',
        lastActionDate: '01.01.2026',
        periodLabel: '2026',
      },
      {
        id: 'd100',
        status: 'timesheet-generate',
        amount: 60,
        hours: 4,
        lastActionDate: '07.07.2026',
        periodLabel: 'Juli 2026',
      },
    ],
  },
  {
    id: 'v48',
    name: 'Walter Steinbach',
    initials: 'WS',
    pauschale: 'uebungleiter',
    usedAmount: 1400,
    totalCap: 3000,
    documents: [
      {
        id: 'd101',
        status: 'contract-active',
        lastActionDate: '01.01.2026',
        periodLabel: '2026',
      },
      {
        id: 'd102',
        status: 'timesheet-ready',
        amount: 360,
        hours: 24,
        lastActionDate: '06.07.2026',
        periodLabel: 'Juli 2026',
      },
      {
        id: 'd103',
        status: 'timesheet-signing-super',
        amount: 360,
        hours: 24,
        lastActionDate: '10.06.2026',
        periodLabel: 'Juni 2026',
      },
    ],
  },
  {
    id: 'v49',
    name: 'Xenia Böhm',
    initials: 'XB',
    pauschale: 'ehrenamt',
    usedAmount: 320,
    totalCap: 840,
    documents: [
      {
        id: 'd104',
        status: 'contract-active',
        lastActionDate: '01.01.2026',
        periodLabel: '2026',
      },
      {
        id: 'd105',
        status: 'timesheet-ready',
        amount: 120,
        hours: 8,
        lastActionDate: '25.06.2026',
        periodLabel: 'Juni 2026',
      },
    ],
  },
  {
    id: 'v50',
    name: 'Yvette Pohl',
    initials: 'YP',
    pauschale: 'uebungleiter',
    usedAmount: 720,
    totalCap: 3000,
    documents: [
      {
        id: 'd106',
        status: 'contract-active',
        lastActionDate: '01.01.2026',
        periodLabel: '2026',
      },
      {
        id: 'd107',
        status: 'timesheet-signing-vol',
        amount: 240,
        hours: 16,
        lastActionDate: '07.07.2026',
        periodLabel: 'Juli 2026',
      },
    ],
  },
  // ── 51: override path — paid shift happened before the contract gate closed.
  // Eligible hours surface as a muted timesheet; the invariant (any timesheet,
  // muted or not, implies a contract row) is satisfied here by the paired
  // contract-missing placeholder, not a real contract-generate.
  {
    id: 'v51',
    name: 'Yannick Dorn',
    initials: 'YD',
    pauschale: 'ehrenamt',
    usedAmount: 90,
    totalCap: 840,
    documents: [
      { id: 'd158', status: 'contract-missing', periodLabel: '2026' },
      {
        id: 'd159',
        status: 'timesheet-muted',
        amount: 90,
        hours: 6,
        lastActionDate: '05.07.2026',
        periodLabel: 'Juli 2026',
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

function parseDocDate(s: string): Date | null {
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

// ─── PeriodPresetButton (checkmark on select, per the single-select convention) ─

interface PeriodPresetButtonProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

function PeriodPresetButton({
  label,
  selected,
  onClick,
}: PeriodPresetButtonProps) {
  return (
    <Button
      size="sm"
      variant="outline"
      className={cn(
        'flex-1 gap-1.5',
        selected &&
          'bg-foreground text-background border-foreground hover:bg-foreground/90',
      )}
      onClick={onClick}
    >
      {selected && <CheckIcon size={14} />}
      {label}
    </Button>
  );
}

// ─── ReimbursementsBoard ──────────────────────────────────────────────────────

interface ReimbursementsBoardProps {
  orgUId: string;
}

export function ReimbursementsBoard({ orgUId }: ReimbursementsBoardProps) {
  const t = useTranslations('Accounting.reimbursements');

  // Period picker — defaults to "all time" (no range = any document at any time)
  const [datePreset, setDatePreset] = useState<DatePreset>('all-time');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [pendingRange, setPendingRange] = useState<DateRange | undefined>(
    dateRange,
  );
  const [periodOpen, setPeriodOpen] = useState(false);

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

  // In-session status overrides (e.g. flipping a row to contract-signing-vol after send) layered onto the static mock data
  const [docStatusOverrides, setDocStatusOverrides] = useState<
    Record<string, DocStatus>
  >({});
  const volunteers = useMemo(
    () => applyDocStatusOverrides(MOCK_VOLUNTEERS, docStatusOverrides),
    [docStatusOverrides],
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
    if (action === 'create' && single?.doc.status === 'contract-generate') {
      setContractCreationTarget(single);
      return;
    }

    const nonCompliant = items.filter(({ doc, vol }) =>
      isTimesheetNonCompliant(vol, doc),
    );

    if (nonCompliant.length === 0) {
      if (action === 'create' && single?.doc.status === 'timesheet-generate') {
        setInvoiceCreationTarget(single);
        return;
      }
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

  function toggleVolDocs(vol: BoardVolunteer) {
    setSelectedDocIds((prev) => {
      const next = new Set(prev);
      const allSelected = vol.documents.every((d) => next.has(d.id));
      for (const d of vol.documents) {
        if (allSelected) next.delete(d.id);
        else next.add(d.id);
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

  // Period handlers
  function handleThisMonth() {
    const now = new Date();
    const range: DateRange = {
      from: new Date(now.getFullYear(), now.getMonth(), 1),
      to: new Date(now.getFullYear(), now.getMonth() + 1, 0),
    };
    setDateRange(range);
    setPendingRange(range);
    setDatePreset('this-month');
    setPeriodOpen(false);
  }

  function handleLastMonth() {
    const now = new Date();
    const range: DateRange = {
      from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      to: new Date(now.getFullYear(), now.getMonth(), 0),
    };
    setDateRange(range);
    setPendingRange(range);
    setDatePreset('last-month');
    setPeriodOpen(false);
  }

  function handleAllTime() {
    setDateRange(undefined);
    setPendingRange(undefined);
    setDatePreset('all-time');
    setPeriodOpen(false);
  }

  function handleApply() {
    if (pendingRange?.from) {
      setDateRange(pendingRange);
      setDatePreset(null);
      setPeriodOpen(false);
    }
  }

  // Derived for DocumentSheet
  const selectedDate = dateRange?.from ?? new Date();

  const periodButtonLabel =
    datePreset === 'all-time'
      ? t('periodPicker.allTime')
      : datePreset === 'this-month'
        ? t('periodPicker.thisMonth')
        : datePreset === 'last-month'
          ? t('periodPicker.lastMonth')
          : t('periodPicker.customPeriod');

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
      if (next === 'ready-to-go') handleThisMonth();
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
    setDocStatusOverrides((prev) => ({
      ...prev,
      [docId]: 'contract-signing-vol',
    }));
  }

  function handleInvoiceSent(docId: string) {
    setDocStatusOverrides((prev) => ({
      ...prev,
      [docId]: 'timesheet-signing-vol',
    }));
  }

  // Undoes every in-session mock-data mutation (status overrides from sent
  // contracts/invoices) — a testing convenience, not a real reset endpoint.
  function handleResetPrototype() {
    setDocStatusOverrides({});
    setSelectedDocIds(new Set());
    toast.success(t('resetPrototypeToast'));
  }

  return (
    <div className="space-y-6 pb-24">
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
                id === 'contract-signing' || id === 'timesheet-signing'
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

        {/* Period picker — right-aligned */}
        <Popover
          open={periodOpen}
          onOpenChange={(open) => {
            if (open) setPendingRange(dateRange);
            setPeriodOpen(open);
          }}
        >
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-10 gap-2 shrink-0">
              <CalendarIcon size={14} />
              {periodButtonLabel}
            </Button>
          </PopoverTrigger>
          {/* Width pinned to the calendar's own rendered size (7 cols × --cell-size + p-3), not the default w-72 — otherwise the calendar sits flush-left in a wider box with dead space on the right. */}
          <PopoverContent className="p-0 w-[248px]" align="end">
            <div className="flex flex-wrap gap-2 p-3 border-b border-border">
              <PeriodPresetButton
                label={t('periodPicker.allTime')}
                selected={datePreset === 'all-time'}
                onClick={handleAllTime}
              />
              <PeriodPresetButton
                label={t('periodPicker.thisMonth')}
                selected={datePreset === 'this-month'}
                onClick={handleThisMonth}
              />
              <PeriodPresetButton
                label={t('periodPicker.lastMonth')}
                selected={datePreset === 'last-month'}
                onClick={handleLastMonth}
              />
            </div>
            <Calendar
              mode="range"
              selected={pendingRange}
              onSelect={setPendingRange}
              captionLayout="dropdown"
              startMonth={new Date(2024, 0)}
              endMonth={new Date(2028, 11)}
            />
            <div className="border-t border-border p-3">
              <Button
                size="sm"
                className="w-full"
                disabled={!pendingRange?.from}
                onClick={handleApply}
              >
                {t('periodPicker.apply')}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
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
        onSent={() => {
          if (invoiceCreationTarget)
            handleInvoiceSent(invoiceCreationTarget.doc.id);
        }}
      />
    </div>
  );
}

// ─── Board skeleton ───────────────────────────────────────────────────────────

export function ReimbursementsBoardSkeleton() {
  return (
    <div className="space-y-6 pb-24">
      <div className="flex gap-1 overflow-x-auto pb-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Fragment key={i}>
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
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
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

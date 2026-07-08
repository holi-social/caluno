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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/ui';
import { ChevronDownIcon, FileTextIcon, TriangleAlertIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { DocTypeHeader } from './doc-type-header';
import type { PauschalenType } from './doc-type-header';
import { LimitHeadroomBar } from './limit-headroom-bar';
import type {
  BoardDocument,
  BoardVolunteer,
  DocStatus,
  PauschalenLimit,
} from './reimbursements-board';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DocTypeFilter = 'all' | 'contract' | 'timesheet';

// ─── Last-action label per status ────────────────────────────────────────────

const LAST_ACTION_LABEL: Record<DocStatus, string> = {
  'contract-generate': 'created',
  'contract-signing-vol': 'sent',
  'contract-signing-coord': 'signed',
  'contract-active': 'activated',
  'timesheet-generate': 'created',
  'timesheet-signing-vol': 'sent',
  'timesheet-signing-super': 'signed',
  'timesheet-ready': 'approved',
};

// ─── Status meta ──────────────────────────────────────────────────────────────

type ActionKey = 'create' | 'remind' | 'countersign';

interface StatusMeta {
  labelKey: string;
  actionKey: ActionKey | null;
  isYourAction: boolean;
}

const STATUS_META: Record<DocStatus, StatusMeta> = {
  'contract-generate': { labelKey: 'contractGenerate', actionKey: 'create', isYourAction: true },
  'contract-signing-vol': { labelKey: 'contractSigningVol', actionKey: 'remind', isYourAction: false },
  'contract-signing-coord': { labelKey: 'contractSigningCoord', actionKey: 'countersign', isYourAction: true },
  'contract-active': { labelKey: 'contractActive', actionKey: null, isYourAction: false },
  'timesheet-generate': { labelKey: 'timesheetGenerate', actionKey: 'create', isYourAction: true },
  'timesheet-signing-vol': { labelKey: 'timesheetSigningVol', actionKey: 'remind', isYourAction: false },
  'timesheet-signing-super': { labelKey: 'timesheetSigningSuper', actionKey: 'countersign', isYourAction: true },
  'timesheet-ready': { labelKey: 'timesheetReady', actionKey: null, isYourAction: false },
};

// ─── CTA variant ──────────────────────────────────────────────────────────────

function getActionVariant(actionKey: ActionKey): 'default' | 'outline' {
  return actionKey === 'remind' ? 'outline' : 'default';
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

const STATUS_SORT_ORDER: DocStatus[] = [
  'contract-generate',
  'timesheet-generate',
  'contract-signing-coord',
  'timesheet-signing-super',
  'timesheet-ready',
  'contract-signing-vol',
  'timesheet-signing-vol',
  'contract-active',
];

// ─── VolunteerTableGroup ──────────────────────────────────────────────────────

interface VolunteerTableGroupProps {
  vol: BoardVolunteer;
  selectedDocIds: Set<string>;
  onToggleDoc: (docId: string) => void;
  onToggleVolDocs: (vol: BoardVolunteer) => void;
  onDocumentClick: (doc: BoardDocument, vol: BoardVolunteer) => void;
  docTypeFilter: DocTypeFilter;
}

function VolunteerTableGroup({
  vol,
  selectedDocIds,
  onToggleDoc,
  onToggleVolDocs,
  onDocumentClick,
  docTypeFilter,
}: VolunteerTableGroupProps) {
  const t = useTranslations('Accounting.reimbursements');
  const [isOpen, setIsOpen] = useState(true);

  // Filter displayed docs by docTypeFilter
  const sortedDocs = [...vol.documents]
    .sort((a, b) => STATUS_SORT_ORDER.indexOf(a.status) - STATUS_SORT_ORDER.indexOf(b.status))
    .filter((doc) => {
      if (docTypeFilter === 'all') return true;
      return doc.status.startsWith(docTypeFilter);
    });

  const ready = sortedDocs.filter((d) => d.status === 'timesheet-ready').length;
  const actionDocs = sortedDocs.filter(
    (d) => STATUS_META[d.status].isYourAction && d.status !== 'contract-active',
  ).length;
  const hasNonCompliant = sortedDocs.some((d) => d.isNonCompliant);

  // Checkbox state for vol header
  const selectedCount = sortedDocs.filter((d) => selectedDocIds.has(d.id)).length;
  const isVolChecked = selectedCount === sortedDocs.length && sortedDocs.length > 0;
  const isVolIndeterminate = selectedCount > 0 && selectedCount < sortedDocs.length;

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
        <TableCell onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={isVolIndeterminate ? 'indeterminate' : isVolChecked}
            onCheckedChange={() => onToggleVolDocs(vol)}
            aria-label={`${vol.name} auswählen`}
          />
        </TableCell>

        <TableCell className="overflow-hidden">
          <div className="min-w-0 overflow-hidden">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base font-medium text-card-foreground truncate">
                {vol.name}
              </span>
              {actionDocs > 0 && (
                <span className="inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-primary px-1 text-xs text-primary-foreground font-medium tabular-nums">
                  {actionDocs}
                </span>
              )}
            </div>
            {vol.limits && Object.keys(vol.limits).length > 1 ? (
              <div className="flex gap-2 mt-1">
                {(Object.entries(vol.limits) as [PauschalenType, PauschalenLimit][]).map(([, lim]) => (
                  <LimitHeadroomBar key={lim.total} used={lim.used} total={lim.total} density="text" />
                ))}
              </div>
            ) : (
              <LimitHeadroomBar used={vol.usedAmount} total={vol.totalCap} density="text" className="mt-1" />
            )}
          </div>
        </TableCell>

        <TableCell className="text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            {t('docs.docCount', { count: sortedDocs.length })}
            {hasNonCompliant && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex shrink-0" onClick={(e) => e.stopPropagation()}>
                      <TriangleAlertIcon size={12} className="text-alert" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t('docs.statusLabel.nonCompliantHint' as Parameters<typeof t>[0])}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </TableCell>

        <TableCell />
        <TableCell />
        <TableCell />

        <TableCell>
          {/* Bundle button stops propagation; chevron lets click through to row */}
          <div className="flex items-center gap-2 justify-end">
            {ready > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <FileTextIcon size={13} />
                {t('bundle.actionLabel')} · {ready}
              </Button>
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
          const isActive = doc.status === 'contract-active';
          const isTimesheet = doc.status.startsWith('timesheet');
          const isGenerate = doc.status === 'contract-generate' || doc.status === 'timesheet-generate';
          const isDocSelected = selectedDocIds.has(doc.id);
          const effectivePauschale = doc.pauschale ?? vol.pauschale;

          return (
            <TableRow
              key={doc.id}
              className={cn(
                'transition-colors',
                isGenerate ? 'cursor-default' : 'cursor-pointer hover:bg-muted/30',
                !isActive && !meta.isYourAction && !isGenerate && 'bg-muted/20',
                isDocSelected && 'bg-primary/5',
              )}
              onClick={() => !isGenerate && onDocumentClick(doc, vol)}
            >
              <TableCell className="py-3 align-top" onClick={(e) => e.stopPropagation()}>
                {!isActive && !isGenerate && (
                  <Checkbox
                    checked={isDocSelected}
                    onCheckedChange={() => onToggleDoc(doc.id)}
                    aria-label={`${doc.periodLabel} auswählen`}
                  />
                )}
              </TableCell>

              <TableCell className={cn('pl-6 py-3 align-top overflow-hidden', isGenerate && 'opacity-40')}>
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

              <TableCell className="py-3 align-top">
                {isActive ? (
                  <span className="text-sm text-success font-medium">
                    {t('docs.statusLabel.contractActive' as Parameters<typeof t>[0])}
                  </span>
                ) : isGenerate ? (
                  <span className="text-sm text-muted-foreground">
                    {t('docs.statusLabel.notYetCreated' as Parameters<typeof t>[0])}
                  </span>
                ) : doc.isNonCompliant && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="flex items-center gap-1 text-sm text-alert cursor-default">
                          <TriangleAlertIcon size={12} />
                          {t('docs.statusLabel.nonCompliant' as Parameters<typeof t>[0])}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {t('docs.statusLabel.nonCompliantHint' as Parameters<typeof t>[0])}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
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
                {!isGenerate && doc.lastActionDate && (
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-card-foreground">
                      {t(`docs.lastActionLabel.${LAST_ACTION_LABEL[doc.status]}` as Parameters<typeof t>[0])}
                    </span>
                    <span className="text-sm tabular-nums text-muted-foreground">
                      {doc.lastActionDate}
                    </span>
                  </div>
                )}
              </TableCell>

              <TableCell className="py-3 align-top">
                <div className="flex justify-end">
                  {!isActive && meta.actionKey && (
                    <Button
                      size="sm"
                      variant={getActionVariant(meta.actionKey)}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      {t(`docs.actions.${meta.actionKey}` as Parameters<typeof t>[0])}
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
  docTypeFilter: DocTypeFilter;
}

export function ReimbursementsTable({
  vols,
  selectedDocIds,
  onToggleDoc,
  onToggleVolDocs,
  onToggleAll,
  onDocumentClick,
  docTypeFilter,
}: ReimbursementsTableProps) {
  const t = useTranslations('Accounting.reimbursements');

  const allVisibleDocIds = vols.flatMap((v) =>
    v.documents
      .filter(
        (d) =>
          d.status !== 'contract-active' &&
          (docTypeFilter === 'all' || d.status.startsWith(docTypeFilter)),
      )
      .map((d) => d.id),
  );

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
                checked={someSelected && !allSelected ? 'indeterminate' : allSelected}
                onCheckedChange={(checked) =>
                  onToggleAll(allVisibleDocIds, checked === true)
                }
                aria-label="Alle auswählen"
              />
            </TableHead>
            <TableHead className="w-52">{t('tableHead.volunteer')}</TableHead>
            <TableHead className="w-36">{t('tableHead.status')}</TableHead>
            <TableHead className="w-14 text-right">{t('tableHead.hours')}</TableHead>
            <TableHead className="w-24 text-right">{t('tableHead.amount')}</TableHead>
            <TableHead className="w-36">{t('tableHead.lastAction')}</TableHead>
            <TableHead className="w-36 text-right">{t('tableHead.action')}</TableHead>
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
              docTypeFilter={docTypeFilter}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

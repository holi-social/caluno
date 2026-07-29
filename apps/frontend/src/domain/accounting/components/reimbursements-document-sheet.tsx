'use client';

import {
  Button,
  cn,
  Separator,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/ui';
import {
  CheckIcon,
  ClockIcon,
  CoinsIcon,
  DownloadIcon,
  EyeIcon,
  TriangleAlertIcon,
  XIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { formatEuro } from '@/lib/formatting/formats';
import { AlertIconTooltip } from './alert-icon-tooltip';
import { DeclineReasonDialog } from './decline-reason-dialog';
import type { PauschalenType } from './doc-type-header';
import { getPauschaleKey, TYPE_COLOR } from './doc-type-header';
import { LimitHeadroomBar } from './limit-headroom-bar';
import type { NonCompliantAction } from './non-compliant-timesheet-dialog';
import type {
  BoardDocument,
  BoardVolunteer,
  DocStatus,
  DocVolPair,
} from './reimbursements-board';
import { isTimesheetNonCompliant } from './reimbursements-board';
import type { Signee, SigneeRole } from './template/types';

// ─── Pipeline step definitions ────────────────────────────────────────────────

type StepState = 'done' | 'active' | 'pending' | 'declined';

interface PipelineStep {
  labelKey: string;
  actorName: string;
  state: StepState;
}

// Mock — no admin/staff profile page or backend record exists for these
// people yet (dev dependency); stands in for "who actually performed this
// step" in place of the generic role label previously shown here.
type StaffActorRole = 'admin' | 'coordinator' | 'supervisor' | 'hq_manager';

const MOCK_STAFF_ACTORS: Record<StaffActorRole, string> = {
  admin: 'Julia Vorstand',
  coordinator: 'Nina Übungsleitung',
  supervisor: 'Markus Kassier',
  hq_manager: 'Petra Geschäftsführung',
};

function getActiveStepIdx(status: DocStatus, signees: Signee[]): number {
  if (status === 'contract-generate' || status === 'timesheet-generate')
    return 0;
  if (status === 'contract-active' || status === 'timesheet-ready')
    return signees.length + 1;
  const activeRole: SigneeRole | null =
    status === 'contract-signing-vol' || status === 'timesheet-signing-vol'
      ? 'volunteer'
      : status === 'contract-signing-coord'
        ? 'coordinator'
        : status === 'timesheet-signing-super'
          ? 'supervisor'
          : null;
  if (!activeRole) return 0;
  const pos = signees.findIndex((s) => s.role === activeRole);
  return pos === -1 ? 1 : pos + 1;
}

function signeeActorName(signee: Signee, volunteerName: string): string {
  if (signee.role === 'volunteer') return volunteerName;
  return MOCK_STAFF_ACTORS[signee.role];
}

/** Which seat in the signing chain declined — everything after this point never rendered as a step. */
function getDeclinedStepIdx(
  signees: Signee[],
  declinedAtRole: SigneeRole | undefined,
): number {
  if (!declinedAtRole) return 0;
  const pos = signees.findIndex((s) => s.role === declinedAtRole);
  return pos === -1 ? 0 : pos + 1;
}

function buildDocSteps(
  doc: BoardDocument,
  signees: Signee[],
  isContract: boolean,
  volunteerName: string,
  t: ReturnType<typeof useTranslations<'Accounting.reimbursements.docs.sheet'>>,
): PipelineStep[] {
  if (
    doc.status === 'contract-declined' ||
    doc.status === 'timesheet-declined'
  ) {
    const declinedIdx = getDeclinedStepIdx(signees, doc.declinedAtRole);
    const steps: PipelineStep[] = [
      {
        labelKey: t('pipeline.generate'),
        actorName: MOCK_STAFF_ACTORS.admin,
        state: 'done',
      },
    ];
    signees.forEach((signee, i) => {
      const idx = i + 1;
      if (idx < declinedIdx) {
        steps.push({
          labelKey: t('pipeline.sign'),
          actorName: signeeActorName(signee, volunteerName),
          state: 'done',
        });
      } else if (idx === declinedIdx) {
        steps.push({
          labelKey: t('pipeline.declined'),
          actorName: signeeActorName(signee, volunteerName),
          state: 'declined',
        });
      }
      // Steps after the decline point are dropped, not just marked pending.
    });
    return steps;
  }

  const activeIdx = getActiveStepIdx(doc.status, signees);
  const totalSteps = signees.length + 2;

  const steps: PipelineStep[] = [];

  steps.push({
    labelKey: t('pipeline.generate'),
    actorName: MOCK_STAFF_ACTORS.admin,
    state: 0 < activeIdx ? 'done' : 0 === activeIdx ? 'active' : 'pending',
  });

  signees.forEach((signee, i) => {
    const idx = i + 1;
    steps.push({
      labelKey: t('pipeline.sign'),
      actorName: signeeActorName(signee, volunteerName),
      state:
        idx < activeIdx ? 'done' : idx === activeIdx ? 'active' : 'pending',
    });
  });

  const finalIdx = totalSteps - 1;
  steps.push({
    labelKey: isContract ? t('pipeline.active') : t('pipeline.ready'),
    actorName: '',
    state:
      finalIdx < activeIdx
        ? 'done'
        : finalIdx === activeIdx
          ? 'active'
          : 'pending',
  });

  return steps;
}

// ─── PipelineTracker ──────────────────────────────────────────────────────────

function PipelineTracker({ steps }: { steps: PipelineStep[] }) {
  return (
    <div className="flex items-start gap-0">
      {steps.map((step, i) => (
        <div key={step.labelKey} className="flex flex-1 flex-col items-center">
          <div className="flex w-full items-center">
            <div
              className={cn(
                'h-0.5 flex-1',
                i === 0
                  ? 'invisible'
                  : step.state !== 'pending'
                    ? 'bg-success'
                    : 'bg-border',
              )}
            />
            <span
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                step.state === 'done' && 'bg-success text-success-foreground',
                step.state === 'active' &&
                  'bg-primary text-primary-foreground ring-2 ring-offset-1 ring-primary/30',
                step.state === 'pending' &&
                  'border-2 border-border bg-background text-muted-foreground',
                step.state === 'declined' && 'bg-alert text-white',
              )}
            >
              {step.state === 'done' ? (
                <CheckIcon size={12} strokeWidth={3} />
              ) : step.state === 'declined' ? (
                <XIcon size={12} strokeWidth={3} />
              ) : (
                i + 1
              )}
            </span>
            <div
              className={cn(
                'h-0.5 flex-1',
                i === steps.length - 1
                  ? 'invisible'
                  : step.state === 'done'
                    ? 'bg-success'
                    : 'bg-border',
              )}
            />
          </div>
          <div className="mt-2 flex flex-col items-center gap-0.5">
            <span
              className={cn(
                'text-center text-xs leading-tight',
                step.state === 'active'
                  ? 'font-semibold text-primary'
                  : step.state === 'done'
                    ? 'font-medium text-success'
                    : step.state === 'declined'
                      ? 'font-semibold text-alert'
                      : 'text-muted-foreground',
              )}
            >
              {step.labelKey}
            </span>
            {step.actorName && (
              <button
                type="button"
                className="text-center text-[10px] leading-tight text-muted-foreground hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {step.actorName}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Mock timeline entries ────────────────────────────────────────────────────

function buildTimeline(
  doc: BoardDocument,
  signees: Signee[],
  volunteerName: string,
  t: ReturnType<typeof useTranslations<'Accounting.reimbursements.docs.sheet'>>,
): Array<{ label: string; actor: string; date: string }> {
  const adminActor = MOCK_STAFF_ACTORS.admin;
  const signeeActors = signees.map((s) => signeeActorName(s, volunteerName));

  const DATES = ['03.07.2026', '06.07.2026', '07.07.2026'];

  const created = {
    label: t('timelineCreated'),
    actor: adminActor,
    date: '01.07.2026',
  };
  const signedEntries = signees.map((_, i) => ({
    label: i === 0 ? t('timelineSigned') : t('timelineCountersigned'),
    actor: signeeActors[i] ?? '',
    date: DATES[i] ?? '07.07.2026',
  }));
  const activated = {
    label: t('timelineActivated'),
    actor: adminActor,
    date: '07.07.2026',
  };

  switch (doc.status) {
    case 'contract-generate':
    case 'timesheet-generate':
      return [];
    case 'contract-signing-coord':
    case 'timesheet-signing-super':
      return [created, signedEntries[0]!];
    case 'contract-active':
      return [created, ...signedEntries, activated];
    case 'timesheet-ready':
      return [created, ...signedEntries];
    case 'contract-declined':
    case 'timesheet-declined': {
      const declinedIdx = getDeclinedStepIdx(signees, doc.declinedAtRole);
      const declined = {
        label: t('timelineDeclined'),
        actor: doc.declinedBy ?? '',
        date: doc.declinedAt ?? '',
      };
      return [created, ...signedEntries.slice(0, declinedIdx - 1), declined];
    }
    default:
      return [created];
  }
}

// ─── Mock timesheet hours per volunteer ──────────────────────────────────────

const MOCK_TIMESHEET_HOURS: Record<
  string,
  { totalHours: number; shiftCount: number }
> = {
  v1: { totalHours: 24, shiftCount: 6 },
  v2: { totalHours: 40, shiftCount: 8 },
  v3: { totalHours: 16, shiftCount: 4 },
  v4: { totalHours: 8, shiftCount: 2 },
  v5: { totalHours: 32, shiftCount: 7 },
};

// ─── DocumentSheet ────────────────────────────────────────────────────────────

interface DocumentSheetProps {
  doc: BoardDocument | null;
  vol: BoardVolunteer | null;
  signees: Signee[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRequestAction: (items: DocVolPair[], action: NonCompliantAction) => void;
  onDecline: (doc: BoardDocument, vol: BoardVolunteer, reason: string) => void;
  selectedDate: Date;
  orgUId: string;
}

export function DocumentSheet({
  doc,
  vol,
  signees,
  open,
  onOpenChange,
  onRequestAction,
  onDecline,
  selectedDate,
  orgUId,
}: DocumentSheetProps) {
  const t = useTranslations('Accounting.reimbursements.docs');
  const ts = useTranslations('Accounting.reimbursements.docs.sheet');
  const tSections = useTranslations('Accounting.templates.sections');
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);

  if (!doc || !vol) return null;

  const isContract = doc.status.startsWith('contract');
  const isDeclined =
    doc.status === 'contract-declined' || doc.status === 'timesheet-declined';
  const kindLabel = t(
    `kindLabel.${isContract ? 'contract' : 'timesheet'}` as Parameters<
      typeof t
    >[0],
  );
  const steps = buildDocSteps(doc, signees, isContract, vol.name, ts);
  const timeline = buildTimeline(doc, signees, vol.name, ts);

  const periodLabel = selectedDate.toLocaleDateString('de-DE', {
    month: 'long',
    year: 'numeric',
  });
  const monthParam = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`;
  const timesheetsUrl = `/admin/${orgUId}/timesheets?month=${monthParam}&volunteer=${vol.id}`;
  const _timesheetMock = MOCK_TIMESHEET_HOURS[vol.id] ?? {
    totalHours: 0,
    shiftCount: 0,
  };
  const timesheetHours = {
    totalHours: doc.hours ?? _timesheetMock.totalHours,
    shiftCount: _timesheetMock.shiftCount,
  };

  const effectivePauschale = doc.pauschale ?? vol.pauschale;
  const docLimit = vol.limits?.[effectivePauschale] ?? {
    used: vol.usedAmount,
    total: vol.totalCap,
  };

  const actionKey =
    doc.status === 'contract-generate' || doc.status === 'timesheet-generate'
      ? 'create'
      : doc.status === 'contract-signing-vol' ||
          doc.status === 'timesheet-signing-vol'
        ? 'remind'
        : doc.status === 'contract-signing-coord' ||
            doc.status === 'timesheet-signing-super'
          ? 'countersign'
          : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 w-full sm:max-w-md p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <SheetTitle className="text-xl font-semibold">
            {isContract ? 'Vertrag' : 'Stundennachweis'} · {vol.name}
          </SheetTitle>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              {ts('period')}: {doc.periodLabel}
              {isTimesheetNonCompliant(vol, doc) && (
                <span className="inline-flex items-center gap-1 ml-2 text-alert">
                  <TriangleAlertIcon size={12} />
                  {t('statusLabel.nonCompliant')}
                </span>
              )}
            </p>
            {(() => {
              const color = TYPE_COLOR[effectivePauschale];
              const label = tSections(
                getPauschaleKey(effectivePauschale) as Parameters<
                  typeof tSections
                >[0],
              );
              return (
                <span
                  className="inline-flex items-center rounded-md border px-1.5 py-0.5 text-xs font-medium shrink-0"
                  style={{
                    color,
                    backgroundColor: `${color}18`,
                    borderColor: color,
                  }}
                >
                  {label}
                </span>
              );
            })()}
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5"
              onClick={() =>
                toast.success(ts('pdfViewToast', { period: doc.periodLabel }))
              }
            >
              <EyeIcon size={13} />
              {ts('pdfView')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5"
              onClick={() =>
                toast.success(
                  ts('pdfDownloadToast', { period: doc.periodLabel }),
                )
              }
            >
              <DownloadIcon size={13} />
              {ts('pdfDownload')}
            </Button>
          </div>
        </SheetHeader>

        <div className="flex flex-col gap-6 px-6 py-6 flex-1 min-h-0 overflow-y-auto">
          {/* Pipeline tracker */}
          <section>
            <p className="text-sm font-semibold text-muted-foreground mb-4">
              {ts('pipelineLabel')}
            </p>
            <PipelineTracker steps={steps} />
          </section>

          {isDeclined && doc.declineReason && (
            <section>
              <p className="text-sm font-semibold text-muted-foreground mb-2">
                {ts('declineReasonTitle')}
              </p>
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-sm text-card-foreground">
                  {doc.declineReason}
                </p>
              </div>
            </section>
          )}

          <Separator />

          {/* Timesheet hours summary (timesheet only) */}
          {!isContract && (
            <>
              <section>
                <p className="text-sm font-semibold text-muted-foreground mb-3">
                  {ts('timesheetHours.title')} · {periodLabel}
                </p>
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <ClockIcon size={14} />
                      <span className="text-sm">
                        {ts('timesheetHours.paidShifts')}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold tabular-nums text-card-foreground">
                        {timesheetHours.totalHours}h
                      </p>
                      <Link
                        href={timesheetsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                      >
                        {ts('timesheetHours.shifts', {
                          count: timesheetHours.shiftCount,
                        })}
                      </Link>
                    </div>
                  </div>
                  {doc.amount !== undefined && (
                    <div className="mt-3 border-t border-border/50 pt-3 flex items-center justify-between gap-4">
                      <span className="text-sm text-muted-foreground">
                        {ts('timesheetHours.grossAmount')}
                      </span>
                      <div className="flex items-baseline gap-2">
                        {timesheetHours.totalHours > 0 &&
                          (() => {
                            const color = TYPE_COLOR[effectivePauschale];
                            return (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span
                                      className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-semibold tabular-nums cursor-default"
                                      style={{
                                        color,
                                        backgroundColor: `${color}18`,
                                        borderColor: `${color}40`,
                                      }}
                                    >
                                      <CoinsIcon size={11} strokeWidth={2.5} />
                                      {formatEuro(
                                        Math.round(
                                          doc.amount /
                                            timesheetHours.totalHours,
                                        ),
                                      )}
                                      /h
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {ts('timesheetHours.rateTooltip')}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            );
                          })()}
                        <span className="text-xl font-bold tabular-nums text-card-foreground">
                          {formatEuro(doc.amount)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </section>
              <Separator />
            </>
          )}

          {/* Limit section */}
          <section>
            <p className="text-sm font-semibold text-muted-foreground mb-3">
              {ts('limitSection')}
            </p>
            <LimitHeadroomBar
              used={docLimit.used}
              total={docLimit.total}
              density="block"
            />
            {(() => {
              // Scoped to this document's own pauschale type only — a
              // dual-pauschale volunteer's other type never appears in this
              // list, so payments of different types are never mixed.
              const timesheetDocs = vol.documents.filter(
                (d) =>
                  d.status.startsWith('timesheet') &&
                  d.amount !== undefined &&
                  (d.pauschale ?? vol.pauschale) === effectivePauschale,
              );
              const paidOut = timesheetDocs.filter(
                (d) => d.status === 'timesheet-ready',
              );
              const pending = timesheetDocs.filter(
                (d) => d.status !== 'timesheet-ready',
              );
              if (paidOut.length === 0 && pending.length === 0) return null;
              return (
                <div className="mt-4 space-y-4">
                  {paidOut.length > 0 && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                        {ts('invoicesPaidOut')}
                      </p>
                      <ul className="space-y-1.5">
                        {paidOut.map((d) => (
                          <li
                            key={d.id}
                            className="flex justify-between text-sm"
                          >
                            <span className="text-card-foreground">
                              {d.periodLabel}
                            </span>
                            <span className="tabular-nums font-medium text-success">
                              {formatEuro(d.amount!)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {pending.length > 0 && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                        {ts('invoicesPending')}
                      </p>
                      <ul className="space-y-1.5">
                        {pending.map((d) => (
                          <li
                            key={d.id}
                            className="flex justify-between text-sm"
                          >
                            <span className="text-muted-foreground">
                              {d.periodLabel}
                            </span>
                            <span className="tabular-nums text-muted-foreground">
                              {formatEuro(d.amount!)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })()}
          </section>

          <Separator />

          {/* Timeline */}
          <section>
            <p className="text-sm font-semibold text-muted-foreground mb-3">
              {ts('timelineSection')}
            </p>
            {timeline.length > 0 ? (
              <ol className="space-y-3">
                {timeline.map((entry) => (
                  <li
                    key={entry.label}
                    className="flex items-start justify-between gap-4"
                  >
                    <div>
                      <span className="text-sm text-card-foreground">
                        {entry.label}
                      </span>
                      <button
                        type="button"
                        className="block text-xs text-muted-foreground hover:underline mt-0.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {entry.actor}
                      </button>
                    </div>
                    <span className="text-sm tabular-nums text-muted-foreground shrink-0">
                      {entry.date}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground">
                {ts('timelineEmpty')}
              </p>
            )}
          </section>
        </div>

        {/* Footer action — sticky: stays visible without scrolling */}
        <SheetFooter className="px-6 py-4 border-t border-border shrink-0">
          {isDeclined ? (
            <Button
              className="w-full"
              onClick={() => {
                onRequestAction([{ doc, vol }], 'create');
                onOpenChange(false);
              }}
            >
              {t('actions.createNew', { docType: kindLabel })}
            </Button>
          ) : actionKey ? (
            <div className="flex w-full items-center gap-2">
              {isTimesheetNonCompliant(vol, doc) && (
                <AlertIconTooltip
                  hint={t('statusLabel.nonCompliantHint')}
                  className="text-alert"
                />
              )}
              <Button
                className="flex-1"
                variant={actionKey === 'create' ? 'default' : 'outline'}
                onClick={() => {
                  onRequestAction([{ doc, vol }], actionKey);
                  onOpenChange(false);
                }}
              >
                {t(`actions.${actionKey}` as Parameters<typeof t>[0])}
              </Button>
              {doc.status === 'timesheet-signing-super' && (
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={() => setDeclineDialogOpen(true)}
                >
                  {t('actions.decline')}
                </Button>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center w-full">
              {ts('noAction')}
            </p>
          )}
        </SheetFooter>
      </SheetContent>
      <DeclineReasonDialog
        open={declineDialogOpen}
        docTypeLabel={kindLabel}
        onOpenChange={setDeclineDialogOpen}
        onConfirm={(reason) => {
          onDecline(doc, vol, reason);
          setDeclineDialogOpen(false);
          onOpenChange(false);
        }}
      />
    </Sheet>
  );
}

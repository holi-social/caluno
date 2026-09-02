'use client';

import {
  useContract,
  useInvoice,
  usePendingContractSignee,
  usePendingInvoiceSignee,
} from '@repo/data/react';
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
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth';
import { formatEuro } from '@/lib/formatting/formats';
import { useFormatting } from '@/lib/formatting/use-formatting';
import { mapSignatureToSignee } from '../lib/board-data.utils';
import { AlertIconTooltip } from './alert-icon-tooltip';
import { DeclineReasonDialog } from './decline-reason-dialog';
import { getPauschaleKey, TYPE_COLOR } from './doc-type-header';
import { LimitHeadroomBar } from './limit-headroom-bar';
import type {
  BoardDocument,
  BoardVolunteer,
  DocVolPair,
} from './reimbursements-board';
import { isTimesheetNonCompliant } from './reimbursements-board';
import { isYourActionStatus } from './reimbursements-volunteer-group';
import type { Signee, SigneeRole } from './template/types';

// ─── Pipeline step definitions ────────────────────────────────────────────────

type StepState = 'done' | 'active' | 'pending' | 'declined';

interface PipelineStep {
  id: string;
  labelKey: string;
  actorName: string;
  state: StepState;
}

type SheetTranslations = ReturnType<
  typeof useTranslations<'Accounting.reimbursements.docs.sheet'>
>;

function signeeActorName(
  signee: Signee,
  volunteerName: string,
  t: SheetTranslations,
): string {
  if (signee.role === 'volunteer') return volunteerName;
  // Coordinator / supervisor are org roles: show the human role label, not
  // the raw permission key the template signee references. The real actor's
  // name is in the status-change timeline below the pipeline.
  return signee.role === 'supervisor'
    ? t('pipeline.superSign')
    : t('pipeline.coordSign');
}

function getActiveStepIdx(status: string, signees: Signee[]): number {
  if (
    status === 'contract-generate' ||
    status === 'timesheet-generate' ||
    status === 'contract-declined' ||
    status === 'timesheet-declined'
  )
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
  t: SheetTranslations,
): PipelineStep[] {
  if (
    doc.status === 'contract-declined' ||
    doc.status === 'timesheet-declined'
  ) {
    const declinedIdx = getDeclinedStepIdx(signees, doc.declinedAtRole);
    const steps: PipelineStep[] = [
      {
        id: 'generate',
        labelKey: t('pipeline.generate'),
        actorName: t('pipeline.actorOrg'),
        state: 'done',
      },
    ];
    signees.forEach((signee, i) => {
      const idx = i + 1;
      if (idx < declinedIdx) {
        steps.push({
          id: signee.id,
          labelKey: t('pipeline.sign'),
          actorName: signeeActorName(signee, volunteerName, t),
          state: 'done',
        });
      } else if (idx === declinedIdx) {
        steps.push({
          id: `declined-${signee.id}`,
          labelKey: t('pipeline.declined'),
          actorName: signeeActorName(signee, volunteerName, t),
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
    id: 'generate',
    labelKey: t('pipeline.generate'),
    actorName: t('pipeline.actorOrg'),
    state: 0 < activeIdx ? 'done' : 0 === activeIdx ? 'active' : 'pending',
  });

  signees.forEach((signee, i) => {
    const idx = i + 1;
    steps.push({
      id: signee.id,
      labelKey: t('pipeline.sign'),
      actorName: signeeActorName(signee, volunteerName, t),
      state:
        idx < activeIdx ? 'done' : idx === activeIdx ? 'active' : 'pending',
    });
  });

  const finalIdx = totalSteps - 1;
  steps.push({
    id: 'final',
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
        <div key={step.id} className="flex flex-1 flex-col items-center">
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
              <span className="text-center text-[10px] leading-tight text-muted-foreground">
                {step.actorName}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

type TimelineEntry = { id: string; label: string; actor: string; date: Date };

function buildTimeline(
  doc: BoardDocument,
  detail:
    | ReturnType<typeof useContract>['data']
    | ReturnType<typeof useInvoice>['data'],
  t: ReturnType<typeof useTranslations<'Accounting.reimbursements.docs.sheet'>>,
): TimelineEntry[] {
  if (!detail) return [];
  const entries: TimelineEntry[] = [];

  for (const change of detail.statusChanges) {
    const actor = change.actorUser?.name ?? t('timeline.actorOrg');
    const occurredAt = new Date(change.occurredAt);
    switch (change.type) {
      case 'CREATED':
        entries.push({
          id: change.id,
          label: t('timelineCreated'),
          actor,
          date: occurredAt,
        });
        break;
      case 'SIGNED':
        entries.push({
          id: change.id,
          label: t('timelineSigned'),
          actor,
          date: occurredAt,
        });
        break;
      case 'COUNTERSIGNED':
        entries.push({
          id: change.id,
          label: t('timelineCountersigned'),
          actor,
          date: occurredAt,
        });
        break;
      case 'ACTIVATED':
        entries.push({
          id: change.id,
          label: t('timelineActivated'),
          actor,
          date: occurredAt,
        });
        break;
      case 'DECLINED':
        entries.push({
          id: change.id,
          label: t('timelineDeclined'),
          actor: doc.declinedBy ?? actor,
          date: doc.declinedAt ?? occurredAt,
        });
        break;
    }
  }

  return entries;
}

// ─── DocumentSheet ────────────────────────────────────────────────────────────

interface DocumentSheetProps {
  doc: BoardDocument | null;
  vol: BoardVolunteer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRequestCreate: (pair: DocVolPair) => void;
  onRequestSign: (pair: DocVolPair) => void;
  onDecline: (pair: DocVolPair, reason: string) => void;
  selectedDate: Date;
  orgUId: string;
}

export function DocumentSheet({
  doc,
  vol,
  open,
  onOpenChange,
  onRequestCreate,
  onRequestSign,
  onDecline,
  selectedDate,
  orgUId,
}: DocumentSheetProps) {
  const t = useTranslations('Accounting.reimbursements.docs');
  const ts = useTranslations('Accounting.reimbursements.docs.sheet');
  const tSections = useTranslations('Accounting.templates.sections');
  const { formatDate } = useFormatting();
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);

  const session = useSession();
  const currentUserId = session.data?.user?.id;

  const isContract = doc?.status.startsWith('contract') ?? false;
  const contractQuery = useContract(isContract ? doc?.id : undefined);
  const invoiceQuery = useInvoice(!isContract ? doc?.id : undefined);

  const contractDetail = contractQuery.data;
  const invoiceDetail = invoiceQuery.data;
  const isDetailLoading = isContract
    ? contractQuery.isLoading
    : invoiceQuery.isLoading;

  const pendingContractSignee = usePendingContractSignee(
    isContract ? doc?.id : undefined,
  );
  const pendingInvoiceSignee = usePendingInvoiceSignee(
    !isContract ? doc?.id : undefined,
  );

  const signees: Signee[] = useMemo(() => {
    const detail = isContract ? contractDetail : invoiceDetail;
    if (!detail) return [];
    const kind = isContract ? 'contract' : 'invoice';
    return detail.signatures.map((s) => mapSignatureToSignee(s, kind));
  }, [contractDetail, invoiceDetail, isContract]);

  const canUserSign = useMemo(() => {
    if (!doc || !currentUserId) return false;
    const pending = isContract
      ? pendingContractSignee.data
      : pendingInvoiceSignee.data;
    if (!pending) return isYourActionStatus(doc.status);
    if (pending.signeeType === 'VOLUNTEER') return false;
    if (pending.eligibleUserIds) {
      return pending.eligibleUserIds.includes(currentUserId);
    }
    return pending.userId === currentUserId;
  }, [
    doc,
    currentUserId,
    isContract,
    pendingContractSignee.data,
    pendingInvoiceSignee.data,
  ]);

  if (!doc || !vol) return null;

  const isDeclined =
    doc.status === 'contract-declined' || doc.status === 'timesheet-declined';
  const kindLabel = t(
    `kindLabel.${isContract ? 'contract' : 'timesheet'}` as Parameters<
      typeof t
    >[0],
  );
  const detail = isContract ? contractDetail : invoiceDetail;
  const steps = buildDocSteps(doc, signees, isContract, vol.name, ts);
  const timeline = buildTimeline(doc, detail, ts);

  const periodLabel = formatDate(selectedDate, {
    month: 'long',
    year: 'numeric',
  });
  const monthParam = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`;
  const timesheetsUrl = `/admin/${orgUId}/timesheets?month=${monthParam}&volunteer=${vol.id}`;

  const effectivePauschale = doc.pauschale ?? vol.pauschale;
  const docLimit = vol.limits?.[effectivePauschale] ?? {
    used: vol.usedAmount,
    total: vol.totalCap,
  };

  const actionKey =
    doc.status === 'contract-generate' ||
    doc.status === 'timesheet-generate' ||
    doc.status === 'contract-declined' ||
    doc.status === 'timesheet-declined' ||
    doc.status === 'contract-missing'
      ? 'create'
      : doc.status === 'contract-signing-coord' ||
          doc.status === 'timesheet-signing-super'
        ? 'countersign'
        : null;

  // Real invoices already have totalHours; for generated rows the backend does
  // not yet exist, so we show nothing.
  const timesheetHours =
    !isContract && invoiceDetail
      ? {
          totalHours: invoiceDetail.totalHours,
          shiftCount: invoiceDetail.invoiceTimeEntries.length,
        }
      : null;

  function handleViewPdf() {
    if (!doc || !vol) return;
    const url = detail?.downloadUrl;
    if (!url) {
      toast.error(ts('pdfUnavailable'));
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function handleDownloadPdf() {
    if (!doc || !vol) return;
    const url = detail?.downloadUrl;
    if (!url) {
      toast.error(ts('pdfUnavailable'));
      return;
    }
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.periodLabel}-${vol.name}.pdf`;
    a.click();
  }

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
              onClick={handleViewPdf}
              disabled={!detail?.downloadUrl || isDetailLoading}
            >
              <EyeIcon size={13} />
              {ts('pdfView')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5"
              onClick={handleDownloadPdf}
              disabled={!detail?.downloadUrl || isDetailLoading}
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
          {!isContract && timesheetHours && (
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
                              {formatEuro(d.amount ?? 0)}
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
                              {formatEuro(d.amount ?? 0)}
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
                    key={entry.id}
                    className="flex items-start justify-between gap-4"
                  >
                    <div>
                      <span className="text-sm text-card-foreground">
                        {entry.label}
                      </span>
                      <span className="block text-xs text-muted-foreground mt-0.5">
                        {entry.actor}
                      </span>
                    </div>
                    <span className="text-sm tabular-nums text-muted-foreground shrink-0">
                      {formatDate(entry.date)}
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
                onRequestCreate({ doc, vol });
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
                disabled={
                  actionKey === 'countersign' &&
                  (!canUserSign || isDetailLoading)
                }
                onClick={() => {
                  if (actionKey === 'create') {
                    onRequestCreate({ doc, vol });
                  } else {
                    onRequestSign({ doc, vol });
                  }
                  onOpenChange(false);
                }}
              >
                {t(`actions.${actionKey}` as Parameters<typeof t>[0])}
              </Button>
              {(doc.status === 'timesheet-signing-super' ||
                doc.status === 'contract-signing-coord') && (
                <Button
                  className="flex-1"
                  variant="outline"
                  disabled={!canUserSign || isDetailLoading}
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
          onDecline({ doc, vol }, reason);
          setDeclineDialogOpen(false);
          onOpenChange(false);
        }}
      />
    </Sheet>
  );
}

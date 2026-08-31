'use client';

import { Badge, Button, cn } from '@repo/ui';
import {
  CheckIcon,
  Clock3Icon,
  DownloadIcon,
  FileSpreadsheetIcon,
  FileUserIcon,
  OctagonXIcon,
  SignatureIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { formatEuro } from '@/lib/formatting/formats';
import { useFormatting } from '@/lib/formatting/use-formatting';
import type {
  VolunteerDocument,
  VolunteerDocumentLine,
  VolunteerDocumentState,
} from '../lib/volunteer-documents.utils';

const STATE_ICON: Record<VolunteerDocumentState, typeof CheckIcon> = {
  'awaiting-signature': SignatureIcon,
  'awaiting-countersignature': Clock3Icon,
  signed: CheckIcon,
  declined: OctagonXIcon,
};

const STATE_BADGE_VARIANT: Record<
  VolunteerDocumentState,
  'alert' | 'outline' | 'success' | 'error'
> = {
  'awaiting-signature': 'alert',
  'awaiting-countersignature': 'outline',
  signed: 'success',
  declined: 'error',
};

const KIND_ICON: Record<'contract' | 'invoice', typeof FileUserIcon> = {
  contract: FileUserIcon,
  invoice: FileSpreadsheetIcon,
};

interface VolunteerDocumentCardProps {
  document: VolunteerDocument;
  onSign: (document: VolunteerDocument) => void;
  onDecline: (document: VolunteerDocument) => void;
  onDownload: (document: VolunteerDocument) => void;
  onOpen: (document: VolunteerDocument) => void;
}

export function VolunteerDocumentCard({
  document,
  onSign,
  onDecline,
  onDownload,
  onOpen,
}: VolunteerDocumentCardProps) {
  const t = useTranslations('MembershipDetail.documents');
  const { formatDate } = useFormatting();

  const StateIcon = STATE_ICON[document.state];
  const KindIcon = KIND_ICON[document.kind];

  const dayAndMonth = (date: Date) =>
    formatDate(date, { day: 'numeric', month: 'long' });

  function lineText(line: VolunteerDocumentLine): string {
    switch (line.kind) {
      case 'generated':
        return t('lines.generated', {
          name: line.actorName ?? '—',
          date: dayAndMonth(line.occurredAt),
        });
      case 'signed-by-me':
        return t('lines.signedByMe', { date: dayAndMonth(line.occurredAt) });
      case 'countersigned-by':
        return t('lines.countersignedBy', {
          name: line.actorName ?? '—',
          date: dayAndMonth(line.occurredAt),
        });
      case 'declined-by':
        return t('lines.declinedBy', {
          name: line.actorName ?? '—',
          date: dayAndMonth(line.occurredAt),
        });
    }
  }

  const awaitingSignature = document.state === 'awaiting-signature';

  return (
    <div
      data-testid="volunteer-document-card"
      data-state={document.state}
      className="flex w-full flex-col gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-accent/40"
    >
      {/* The card header opens the preview; action buttons below stop their own propagation. */}
      <button
        type="button"
        onClick={() => onOpen(document)}
        className="flex w-full flex-col gap-3 text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none rounded-lg"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px] border bg-muted/60 text-muted-foreground"
              aria-hidden="true"
            >
              <KindIcon size={18} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="text-sm leading-none text-muted-foreground truncate">
                {document.periodLabel}
              </p>
              <p className="mt-1 text-base font-bold text-card-foreground leading-snug">
                {t(`names.${document.nameKey}`)}
              </p>
            </div>
          </div>

          <Badge variant={STATE_BADGE_VARIANT[document.state]}>
            <StateIcon />
            {t(`status.${document.state}`)}
          </Badge>
        </div>

        {document.figures && (
          <p className="text-sm font-medium text-foreground tabular-nums">
            {t('figures', {
              shifts: document.figures.shiftCount,
              hours: document.figures.totalHours,
              amount: formatEuro(document.figures.totalAmountCents / 100),
            })}
          </p>
        )}

        <div className="space-y-0.5">
          {document.lines.map((line) => (
            <p
              key={`${line.kind}-${line.occurredAt.getTime()}`}
              className={cn(
                'text-sm',
                line.kind === 'generated' || line.kind === 'declined-by'
                  ? 'text-muted-foreground'
                  : 'text-foreground',
              )}
            >
              {lineText(line)}
            </p>
          ))}
          {document.declineReason && (
            <q className="block text-sm text-muted-foreground">
              {document.declineReason}
            </q>
          )}
        </div>
      </button>

      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            onDownload(document);
          }}
        >
          <DownloadIcon />
          {t('actions.download')}
        </Button>
        {awaitingSignature && (
          <>
            <Button
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                onSign(document);
              }}
            >
              <SignatureIcon />
              {t('actions.sign')}
            </Button>
            <Button
              variant="destructive"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                onDecline(document);
              }}
            >
              <OctagonXIcon />
              {t('actions.decline')}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

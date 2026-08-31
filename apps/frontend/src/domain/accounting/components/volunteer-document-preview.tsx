'use client';

import { useContract, useInvoice } from '@repo/data/react';
import { Button, Skeleton } from '@repo/ui';
import {
  DownloadIcon,
  FileTextIcon,
  OctagonXIcon,
  SignatureIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useFormatting } from '@/lib/formatting/use-formatting';
import { useVolunteerDocumentActions } from '../hooks/use-volunteer-document-actions';
import {
  documentState,
  periodLabel,
  type VolunteerDocumentKind,
} from '../lib/volunteer-documents.utils';
import { VolunteerDocumentDeclineSheet } from './volunteer-document-decline-sheet';

interface VolunteerDocumentPreviewProps {
  documentId: string;
  kind: VolunteerDocumentKind;
}

/**
 * Document preview for the volunteer (undesigned in Pencil — G5). Renders
 * the generated PDF full-width with a footer that mirrors the card actions:
 * Sign + Decline while the document awaits the volunteer's signature,
 * Download alone otherwise.
 */
export function VolunteerDocumentPreview({
  documentId,
  kind,
}: VolunteerDocumentPreviewProps) {
  const t = useTranslations('MembershipDetail.documents');
  const { formatDate } = useFormatting();
  const { sign, decline, download } = useVolunteerDocumentActions();

  const contractQuery = useContract(
    kind === 'contract' ? documentId : undefined,
  );
  const invoiceQuery = useInvoice(kind === 'invoice' ? documentId : undefined);
  const isLoading =
    kind === 'contract' ? contractQuery.isLoading : invoiceQuery.isLoading;

  const [declineOpen, setDeclineOpen] = useState(false);

  const detail = kind === 'contract' ? contractQuery.data : invoiceQuery.data;
  const status =
    kind === 'contract'
      ? contractQuery.data?.contractStatus
      : invoiceQuery.data?.invoiceStatus;
  const periodStart = detail?.periodStart;
  const downloadUrl = detail?.downloadUrl;

  const formatMonth = (date: Date) =>
    formatDate(date, { month: 'long', year: 'numeric' });

  const nameKey: 'agreement' | 'timesheet' =
    kind === 'contract' ? 'agreement' : 'timesheet';
  const periodLabelText = periodStart
    ? periodLabel(kind, periodStart, formatMonth)
    : '';

  const awaitingSignature =
    !!status && documentState(status) === 'awaiting-signature';

  const currentDocument = detail
    ? {
        id: documentId,
        kind,
        nameKey,
        periodLabel: periodLabelText,
        downloadUrl,
      }
    : null;

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 px-4 py-4">
        {isLoading ? (
          <Skeleton className="h-full w-full rounded-xl" />
        ) : downloadUrl ? (
          <iframe
            src={downloadUrl}
            title={t('preview.title', { name: t(`names.${nameKey}`) })}
            className="h-full w-full rounded-xl border border-border bg-card"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card text-center">
            <FileTextIcon className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {t('preview.unavailable')}
            </p>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t bg-background p-4 pb-6">
        {currentDocument && (
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => download(currentDocument)}
            >
              <DownloadIcon />
              {t('actions.download')}
            </Button>
            {awaitingSignature && (
              <>
                <Button
                  className="w-full"
                  onClick={() => sign(currentDocument)}
                >
                  <SignatureIcon />
                  {t('actions.sign')}
                </Button>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setDeclineOpen(true)}
                >
                  <OctagonXIcon />
                  {t('actions.decline')}
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      <VolunteerDocumentDeclineSheet
        open={declineOpen}
        onOpenChange={setDeclineOpen}
        documentName={t(`names.${nameKey}`)}
        onConfirm={(reason) => {
          if (currentDocument) decline(currentDocument, reason);
        }}
      />
    </div>
  );
}

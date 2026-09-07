'use client';

import { useContract, useInvoice } from '@repo/data/react';
import { Button, cn, Skeleton } from '@repo/ui';
import {
  CircleAlertIcon,
  DownloadIcon,
  FileTextIcon,
  OctagonXIcon,
  RotateCwIcon,
  SignatureIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useFormatting } from '@/lib/formatting/use-formatting';
import { useVolunteerDocumentActions } from '../hooks/use-volunteer-document-actions';
import {
  canDecideDocument,
  documentState,
  type PreviewStatus,
  periodLabel,
  type VolunteerDocumentKind,
} from '../lib/volunteer-documents.utils';
import { VolunteerDocumentDeclineSheet } from './volunteer-document-decline-sheet';

/**
 * How long we wait for the iframe's onLoad before treating the preview as
 * failed. A same-origin PDF should load well inside this; a hung load is
 * indistinguishable from a genuine failure to the volunteer, so we surface it
 * as one rather than leaving them staring at a blank frame forever.
 */
const PREVIEW_LOAD_TIMEOUT_MS = 15_000;

interface VolunteerDocumentPreviewProps {
  documentId: string;
  kind: VolunteerDocumentKind;
  /** Used to build the "get help" link back to the membership overview if rendering fails. */
  membershipId: string;
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
  membershipId,
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
  const [renderState, setRenderState] = useState<
    'rendering' | 'ready' | 'error'
  >('rendering');
  const [reloadToken, setReloadToken] = useState(0);

  const detail = kind === 'contract' ? contractQuery.data : invoiceQuery.data;
  const status =
    kind === 'contract'
      ? contractQuery.data?.contractStatus
      : invoiceQuery.data?.invoiceStatus;
  const periodStart = detail?.periodStart;
  const downloadUrl = detail?.downloadUrl;
  const missingProfileFields = detail?.missingProfileFields ?? [];

  // Reset the render lifecycle whenever a (possibly new) document URL shows
  // up, and give it a bounded amount of time to call onLoad before we treat
  // it as a genuine failure rather than leaving the volunteer waiting
  // indefinitely next to two live sign/decline buttons. reloadToken is an
  // otherwise-unused dependency that exists solely to retrigger this effect
  // when the volunteer taps "retry".
  // biome-ignore lint/correctness/useExhaustiveDependencies: reloadToken deliberately re-runs the effect
  useEffect(() => {
    if (!downloadUrl) return;
    setRenderState('rendering');
    const timeout = setTimeout(() => {
      setRenderState((current) =>
        current === 'rendering' ? 'error' : current,
      );
    }, PREVIEW_LOAD_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, [downloadUrl, reloadToken]);

  const previewStatus: PreviewStatus = isLoading
    ? 'loading'
    : !downloadUrl
      ? 'unavailable'
      : renderState;

  const formatMonth = (date: Date) =>
    formatDate(date, { month: 'long', year: 'numeric' });

  const nameKey: 'agreement' | 'timesheet' =
    kind === 'contract' ? 'agreement' : 'timesheet';
  const periodLabelText = periodStart
    ? periodLabel(kind, periodStart, formatMonth)
    : '';

  const awaitingSignature =
    !!status && documentState(status) === 'awaiting-signature';
  const canDecide =
    !!status && canDecideDocument(documentState(status), previewStatus);
  const previewBlocksDecision = awaitingSignature && !canDecide;

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
        {previewStatus === 'loading' ? (
          <Skeleton className="h-full w-full rounded-xl" />
        ) : previewStatus === 'unavailable' ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card text-center">
            <FileTextIcon className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {t('preview.unavailable')}
            </p>
          </div>
        ) : previewStatus === 'error' ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card px-6 text-center">
            <CircleAlertIcon className="size-8 text-destructive" />
            <p className="text-sm text-muted-foreground">
              {t('preview.error')}
            </p>
            <div className="flex flex-col items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setRenderState('rendering');
                  setReloadToken((n) => n + 1);
                }}
              >
                <RotateCwIcon />
                {t('preview.retry')}
              </Button>
              <Link
                href={`/profile/memberships/${membershipId}`}
                className="text-xs font-medium text-primary underline underline-offset-2"
              >
                {t('preview.errorHelp')}
              </Link>
            </div>
          </div>
        ) : (
          // previewStatus === 'rendering' | 'ready': keep the iframe mounted
          // through 'rendering' so onLoad/onError can fire; a skeleton sits
          // on top until it does.
          <div className="relative h-full w-full">
            {previewStatus === 'rendering' && (
              <Skeleton className="absolute inset-0 rounded-xl" />
            )}
            <iframe
              key={reloadToken}
              src={downloadUrl ?? undefined}
              title={t('preview.title', { name: t(`names.${nameKey}`) })}
              onLoad={() => setRenderState('ready')}
              onError={() => setRenderState('error')}
              className={cn(
                'h-full w-full rounded-xl border border-border bg-card',
                previewStatus === 'rendering' && 'invisible',
              )}
            />
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
                {previewBlocksDecision && (
                  <p className="px-1 text-xs text-muted-foreground">
                    {t('preview.signDisabledHint')}
                  </p>
                )}
                <Button
                  className="w-full"
                  disabled={!canDecide || missingProfileFields.length > 0}
                  onClick={() => sign(currentDocument)}
                >
                  <SignatureIcon />
                  {t('actions.sign')}
                </Button>
                {canDecide && missingProfileFields.length > 0 && (
                  <div className="flex flex-col gap-1 px-1">
                    <p className="text-xs text-muted-foreground">
                      {t('missingProfileWarning')}
                    </p>
                    <Link
                      href="/profile"
                      className="text-xs font-medium text-primary underline underline-offset-2"
                    >
                      {t('missingProfileCta')}
                    </Link>
                  </div>
                )}
                <Button
                  variant="destructive"
                  className="w-full"
                  disabled={!canDecide}
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

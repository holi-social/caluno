'use client';

import { useMyContracts, useMyInvoices } from '@repo/data/react';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Skeleton,
} from '@repo/ui';
import { FileTextIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useFormatting } from '@/lib/formatting/use-formatting';
import { useVolunteerDocumentActions } from '../hooks/use-volunteer-document-actions';
import {
  contractToVolunteerDocument,
  invoiceToVolunteerDocument,
  type VolunteerDocument,
} from '../lib/volunteer-documents.utils';
import { VolunteerDocumentCard } from './volunteer-document-card';
import { VolunteerDocumentDeclineSheet } from './volunteer-document-decline-sheet';

interface VolunteerDocumentsSectionProps {
  membershipId: string;
  /** Org-unit the membership belongs to — scopes every document query. */
  organizationUnitId: string;
}

/**
 * The volunteer's "Your documents" section on a membership page: every
 * contract and timesheet this organisation generated for the signed-in
 * volunteer, newest first with anything awaiting the volunteer's signature
 * on top. Signing, declining and downloading all live here.
 */
export function VolunteerDocumentsSection({
  membershipId,
  organizationUnitId,
}: VolunteerDocumentsSectionProps) {
  const t = useTranslations('MembershipDetail.documents');
  const { formatDate } = useFormatting();
  const router = useRouter();
  const { sign, decline, download } = useVolunteerDocumentActions();

  const contractsQuery = useMyContracts({}, organizationUnitId);
  const invoicesQuery = useMyInvoices({}, organizationUnitId);

  const [declineTarget, setDeclineTarget] = useState<VolunteerDocument | null>(
    null,
  );

  const documents = useMemo(() => {
    const formatMonth = (date: Date) =>
      formatDate(date, { month: 'long', year: 'numeric' });
    const contracts = (contractsQuery.data ?? []).map((c) =>
      contractToVolunteerDocument(c, formatMonth),
    );
    const invoices = (invoicesQuery.data ?? []).map((i) =>
      invoiceToVolunteerDocument(i, formatMonth),
    );
    return [...contracts, ...invoices].sort((a, b) => {
      // Anything that needs the volunteer's signature goes first.
      const aNeeds = a.state === 'awaiting-signature' ? 0 : 1;
      const bNeeds = b.state === 'awaiting-signature' ? 0 : 1;
      if (aNeeds !== bNeeds) return aNeeds - bNeeds;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }, [contractsQuery.data, invoicesQuery.data, formatDate]);

  const isLoading = contractsQuery.isLoading || invoicesQuery.isLoading;

  function handleSign(document: VolunteerDocument) {
    sign(document);
  }

  function handleDeclineConfirm(reason: string) {
    if (!declineTarget) return;
    decline(declineTarget, reason);
    setDeclineTarget(null);
  }

  function handleDownload(document: VolunteerDocument) {
    download(document);
  }

  function handleOpen(document: VolunteerDocument) {
    router.push(
      `/profile/memberships/${membershipId}/documents/${document.id}?kind=${document.kind}`,
    );
  }

  const declineName = declineTarget ? t(`names.${declineTarget.nameKey}`) : '';

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold">{t('title')}</h2>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {['doc-1', 'doc-2', 'doc-3'].map((key) => (
            <Skeleton key={key} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <Empty className="border-border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileTextIcon className="size-5 text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle>{t('empty.title')}</EmptyTitle>
            <EmptyDescription>{t('empty.description')}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {documents.map((document) => (
            <VolunteerDocumentCard
              key={`${document.kind}-${document.id}`}
              document={document}
              onSign={handleSign}
              onDecline={setDeclineTarget}
              onDownload={handleDownload}
              onOpen={handleOpen}
            />
          ))}
        </div>
      )}

      <VolunteerDocumentDeclineSheet
        open={declineTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeclineTarget(null);
        }}
        documentName={declineName}
        onConfirm={handleDeclineConfirm}
      />
    </section>
  );
}

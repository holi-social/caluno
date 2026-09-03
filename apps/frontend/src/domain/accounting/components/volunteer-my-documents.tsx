'use client';

import { useMyDocuments } from '@repo/data/react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
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

/** How many documents an org accordion reveals at a time ("load more"). */
const DOCS_PER_PAGE = 3;

/**
 * The volunteer's documents across every organization they belong to,
 * grouped per org in collapsible accordions (single org open at a time —
 * that is the org filter). Reuses the same document card as the membership
 * page, with the same sign/decline/download actions.
 */
export function VolunteerMyDocuments() {
  const t = useTranslations('MyDocuments');
  const tNames = useTranslations('MembershipDetail.documents.names');
  const { formatDate } = useFormatting();
  const router = useRouter();
  const { sign, decline, download } = useVolunteerDocumentActions();

  const myDocumentsQuery = useMyDocuments();

  const [visibleByOrg, setVisibleByOrg] = useState<Record<string, number>>({});
  const [declineTarget, setDeclineTarget] = useState<VolunteerDocument | null>(
    null,
  );

  const groups = useMemo(() => {
    const formatMonth = (date: Date) =>
      formatDate(date, { month: 'long', year: 'numeric' });
    return (
      (myDocumentsQuery.data ?? [])
        .map((group) => {
          const docs = [
            ...group.contracts.map((contract) =>
              contractToVolunteerDocument(contract, formatMonth),
            ),
            ...group.invoices.map((invoice) =>
              invoiceToVolunteerDocument(invoice, formatMonth),
            ),
          ].sort((a, b) => {
            // Anything that needs the volunteer's signature goes first.
            const aNeeds = a.state === 'awaiting-signature' ? 0 : 1;
            const bNeeds = b.state === 'awaiting-signature' ? 0 : 1;
            if (aNeeds !== bNeeds) return aNeeds - bNeeds;
            return b.createdAt.getTime() - a.createdAt.getTime();
          });
          return { ...group, docs };
        })
        // Orgs without any documents stay out of the list entirely.
        .filter((group) => group.docs.length > 0)
    );
  }, [myDocumentsQuery.data, formatDate]);

  if (myDocumentsQuery.isLoading) {
    return (
      <div className="space-y-3">
        {['org-1', 'org-2'].map((key) => (
          <Skeleton key={key} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <Empty className="border-border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileTextIcon className="size-5 text-muted-foreground" />
          </EmptyMedia>
          <EmptyTitle>{t('empty.title')}</EmptyTitle>
          <EmptyDescription>{t('empty.description')}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const handleOpen =
    (groupMembershipId: string) => (document: VolunteerDocument) => {
      router.push(
        `/profile/memberships/${groupMembershipId}/documents/${document.id}?kind=${document.kind}`,
      );
    };

  const declineName = declineTarget ? tNames(declineTarget.nameKey) : '';

  return (
    <>
      {/* Multiple, all open by default — landing on the page shows every
          org's documents right away; collapse the orgs you don't care about. */}
      <Accordion
        type="multiple"
        defaultValue={groups.map((group) => group.organizationUnitId)}
        className="w-full"
      >
        {groups.map((group) => {
          const visible =
            visibleByOrg[group.organizationUnitId] ?? DOCS_PER_PAGE;
          const pendingInOrg = group.docs.filter(
            (doc) => doc.state === 'awaiting-signature',
          ).length;

          return (
            <AccordionItem
              key={group.organizationUnitId}
              value={group.organizationUnitId}
              className="rounded-xl border border-border bg-card px-4"
            >
              <AccordionTrigger className="gap-3">
                <span className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="truncate text-base font-semibold">
                    {group.organizationName}
                  </span>
                  {group.organizationUnitName !== group.organizationName && (
                    <span className="truncate text-sm text-muted-foreground">
                      · {group.organizationUnitName}
                    </span>
                  )}
                </span>
                {pendingInOrg > 0 && (
                  <span className="rounded-full bg-destructive px-2 py-0.5 text-xs font-medium text-white tabular-nums">
                    {pendingInOrg}
                  </span>
                )}
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="flex flex-col gap-3">
                  {group.docs.slice(0, visible).map((document) => (
                    <VolunteerDocumentCard
                      key={`${document.kind}-${document.id}`}
                      document={document}
                      onSign={sign}
                      onDecline={setDeclineTarget}
                      onDownload={download}
                      onOpen={handleOpen(group.membershipId)}
                    />
                  ))}
                  {visible < group.docs.length && (
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={() =>
                        setVisibleByOrg((prev) => ({
                          ...prev,
                          [group.organizationUnitId]:
                            (prev[group.organizationUnitId] ?? DOCS_PER_PAGE) +
                            DOCS_PER_PAGE,
                        }))
                      }
                    >
                      {t('loadMore', {
                        remaining: group.docs.length - visible,
                      })}
                    </Button>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      <VolunteerDocumentDeclineSheet
        open={declineTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeclineTarget(null);
        }}
        documentName={declineName}
        onConfirm={(reason) => {
          if (declineTarget) decline(declineTarget, reason);
          setDeclineTarget(null);
        }}
      />
    </>
  );
}

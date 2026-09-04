import { DataProvider } from '@repo/data/react';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { VolunteerDocumentPreview } from '@/domain/accounting/components/volunteer-document-preview';
import { MembershipDetailHeader } from '@/domain/memberships/components/membership-detail-header';
import { resolveLocale } from '@/i18n/routing';
import { GRAPHQL_API_URL } from '@/lib/constants';
import { getDataClient } from '@/lib/data-client';

type VolunteerDocumentKind = 'contract' | 'invoice';

interface DocumentPreviewPageProps {
  params: Promise<{
    locale: string;
    membershipId: string;
    documentId: string;
  }>;
  searchParams: Promise<{ kind?: string }>;
}

export default async function DocumentPreviewPage({
  params,
  searchParams,
}: DocumentPreviewPageProps) {
  const { locale: rawLocale, membershipId, documentId } = await params;
  const locale = resolveLocale(rawLocale);
  const { kind: rawKind } = await searchParams;

  const kind: VolunteerDocumentKind | undefined =
    rawKind === 'contract' || rawKind === 'invoice' ? rawKind : undefined;
  if (!kind) notFound();

  const data = await getDataClient();
  const membership = await data.membership.findMineById(membershipId);
  if (!membership) notFound();

  const t = await getTranslations('MembershipDetail.documents');

  return (
    <div className="flex h-dvh flex-col">
      <div className="sticky top-0 z-30">
        <MembershipDetailHeader
          title={t(`names.${kind === 'contract' ? 'agreement' : 'timesheet'}`)}
        />
      </div>

      <DataProvider
        apiUrl={GRAPHQL_API_URL}
        organizationUnitId={membership.organizationUnit.id}
        locale={locale}
      >
        <div className="mx-auto flex w-full max-w-4xl grow flex-col px-4">
          <VolunteerDocumentPreview documentId={documentId} kind={kind} />
        </div>
      </DataProvider>
    </div>
  );
}

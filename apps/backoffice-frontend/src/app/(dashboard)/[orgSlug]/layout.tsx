import { DataProvider } from '@repo/data/react';
import type { ReactNode } from 'react';
import { OrgProvider } from '@/contexts/org-context';
import { requireAuth } from '@/lib/auth-server';
import { GRAPHQL_API_URL } from '@/lib/constants';
import { requireOrgAccess } from '@/lib/org-context-server';
import { OrgSyncProvider } from './org-sync-provider';

interface OrgLayoutProps {
  children: ReactNode;
  params: Promise<{ orgSlug: string }>;
}

export default async function OrgLayout({ children, params }: OrgLayoutProps) {
  await requireAuth();
  const { orgSlug } = await params;
  const org = await requireOrgAccess(orgSlug);

  return (
    <OrgProvider org={org}>
      <DataProvider apiUrl={GRAPHQL_API_URL} organizationId={org.id}>
        <OrgSyncProvider orgSlug={org.slug}>{children}</OrgSyncProvider>
      </DataProvider>
    </OrgProvider>
  );
}

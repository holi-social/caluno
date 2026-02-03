import { DataProvider, OrgProvider } from '@repo/data/react';
import { Separator } from '@repo/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@repo/ui/sidebar';
import type { ReactNode } from 'react';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
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
  const { org, organizations } = await requireOrgAccess(orgSlug);

  return (
    <OrgProvider org={org} organizations={organizations}>
      <DataProvider apiUrl={GRAPHQL_API_URL} organizationId={org.id}>
        <OrgSyncProvider orgSlug={org.slug}>
          <SidebarProvider>
            <DashboardSidebar />
            <SidebarInset>
              <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold">Clippy</h1>
                </div>
              </header>
              <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
            </SidebarInset>
          </SidebarProvider>
        </OrgSyncProvider>
      </DataProvider>
    </OrgProvider>
  );
}

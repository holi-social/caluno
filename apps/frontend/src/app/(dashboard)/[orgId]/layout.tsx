import { DataProvider, OrgProvider } from '@repo/data/react';
import {
  Separator,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@repo/ui';
import type { ReactNode } from 'react';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { CreateShiftSheet } from '@/components/sheets/create-shift-sheet';
import { OrgSyncProvider } from '@/domain/organization/components/org-sync-provider';
import { requireAuth } from '@/lib/auth-server';
import { GRAPHQL_API_URL } from '@/lib/constants';
import { getDataClient } from '@/lib/data-client';
import { requireOrgAccess } from '@/lib/org-context-server';
import { ThemeToggle } from '../../../components/theme-toggle';

interface OrgLayoutProps {
  children: ReactNode;
  params: Promise<{ orgId: string }>;
}

export default async function OrgLayout({ children, params }: OrgLayoutProps) {
  await requireAuth();
  const { orgId } = await params;
  const { org, organizations } = await requireOrgAccess(orgId);

  const _data = await getDataClient(orgId);

  return (
    <OrgProvider org={org} organizations={organizations}>
      <DataProvider apiUrl={GRAPHQL_API_URL} organizationId={org.id}>
        <OrgSyncProvider orgId={org.id}>
          <SidebarProvider>
            <DashboardSidebar />
            <SidebarInset>
              <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <div className="flex justify-between gap-2 flex-1">
                  <h1 className="text-lg font-semibold">Clippy</h1>
                  <div className="flex gap-2">
                    <CreateShiftSheet />
                    <ThemeToggle />
                  </div>
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

import { DataProvider, OrgProvider } from '@repo/data/react';
import {
  Separator,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@repo/ui';
import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { CreateShiftButton } from '@/components/create-shift-button';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { InviteShiftSheet } from '@/components/sheets/invite-shift-sheet';
import { ShiftSheet } from '@/components/sheets/shift-sheet';
import { ThemeToggle } from '@/components/theme-toggle';
import { OrgSyncProvider } from '@/domain/organization/components/org-sync-provider';
import { requireAuth } from '@/lib/auth-server';
import { GRAPHQL_API_URL } from '@/lib/constants';
import { getDataClient } from '@/lib/data-client';
import { requireOrgAccess } from '@/lib/org-context-server';

interface OrgLayoutProps {
  children: ReactNode;
  params: Promise<{ orgUId: string }>;
}

export default async function OrgLayout({ children, params }: OrgLayoutProps) {
  await requireAuth();
  const { orgUId } = await params;
  const data = await getDataClient(orgUId);

  const [{ org, organizations }, userPermissions] = await Promise.all([
    requireOrgAccess(orgUId),
    data.user.getMyPermissions(),
  ]);
  const permissionKeys = userPermissions.map((p) => p.key);

  return (
    <OrgProvider org={org} organizations={organizations}>
      <DataProvider apiUrl={GRAPHQL_API_URL} organizationUnitId={orgUId}>
        <OrgSyncProvider orgUId={orgUId}>
          <SidebarProvider>
            <DashboardSidebar permissions={permissionKeys} />
            <SidebarInset>
              <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <div className="flex justify-between gap-2 flex-1">
                  <h1 className="text-lg font-semibold">Clippy</h1>
                  <div className="flex gap-2">
                    <Suspense fallback={null}>
                      <CreateShiftButton />
                    </Suspense>
                    <ThemeToggle />
                  </div>
                </div>
              </header>
              <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
            </SidebarInset>
          </SidebarProvider>
          <Suspense fallback={null}>
            <ShiftSheet />
            <InviteShiftSheet />
          </Suspense>
        </OrgSyncProvider>
      </DataProvider>
    </OrgProvider>
  );
}

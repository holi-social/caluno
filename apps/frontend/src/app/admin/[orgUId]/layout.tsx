import { DataProvider, OrgProvider } from '@repo/data/react';
import {
  Separator,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@repo/ui';
import { Loader2 } from 'lucide-react';
import { type ReactNode, Suspense } from 'react';
import { DashboardSidebar } from '@/components/navigation/dashboard-sidebar';
import { InviteShiftSheet } from '@/components/sheets/invite-shift-sheet';
import { VolunteerSheet } from '@/components/sheets/volunteer-sheet';
import { ThemeToggle } from '@/components/theme-toggle';
import { OrgSyncProvider } from '@/domain/organization/components/org-sync-provider';
import { BlockSheet } from '@/domain/requirement-form/components/block-sheet';
import { requireAuth } from '@/lib/auth-server';
import { GRAPHQL_API_URL } from '@/lib/constants';
import { getDataClient } from '@/lib/data-client';
import { requireOrgAccess } from '@/lib/org-context-server';

interface OrgLayoutProps {
  children: ReactNode;
  sheet: ReactNode;
  params: Promise<{ orgUId: string }>;
}

export default async function OrgLayout({
  children,
  sheet,
  params,
}: OrgLayoutProps) {
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
                  <h1 className="text-lg font-semibold hidden sm:block">
                    Clippy
                  </h1>
                  <div className="flex gap-2 items-center ml-auto sm:ml-0">
                    <Suspense
                      fallback={<Loader2 className="animate-spin size-4" />}
                    >
                      {sheet}
                    </Suspense>
                    <ThemeToggle />
                  </div>
                </div>
              </header>
              <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
            </SidebarInset>
          </SidebarProvider>
          <InviteShiftSheet />
          <BlockSheet />
          <VolunteerSheet />
        </OrgSyncProvider>
      </DataProvider>
    </OrgProvider>
  );
}

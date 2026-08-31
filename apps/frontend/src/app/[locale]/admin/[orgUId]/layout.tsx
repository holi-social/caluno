import { DataProvider, OrgProvider } from '@repo/data/react';
import {
  Separator,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@repo/ui';
import { Loader2 } from 'lucide-react';
import { type ReactNode, Suspense } from 'react';
import { LocaleCookieSeeder } from '@/components/locale-cookie-seeder';
import { DashboardSidebar } from '@/components/navigation/dashboard-sidebar';
import {
  PageHeaderProvider,
  PageHeaderSlot,
} from '@/components/navigation/page-header-context';
import { ProfileNavIcon } from '@/components/navigation/profile-nav-icon';
import { VolunteerSheet } from '@/components/sheets/volunteer-sheet';
import { ThemeToggle } from '@/components/theme-toggle';
import { OrgSyncProvider } from '@/domain/organization/components/org-sync-provider';
import { BlockSheet } from '@/domain/requirement-form/components/block-sheet';
import { resolveLocale } from '@/i18n/routing';
import { requireAuth } from '@/lib/auth-server';
import { GRAPHQL_API_URL } from '@/lib/constants';
import { getDataClient } from '@/lib/data-client';
import { resolveLocaleSeed } from '@/lib/locale-seed';
import { requireOrgAccess } from '@/lib/org-context-server';

interface OrgLayoutProps {
  children: ReactNode;
  sheet: ReactNode;
  params: Promise<{ orgUId: string; locale: string }>;
}

export default async function OrgLayout({
  children,
  sheet,
  params,
}: OrgLayoutProps) {
  await requireAuth();
  const { orgUId, locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const data = await getDataClient({ orgUId, locale });

  const [{ org, organizations }, userPermissions, me] = await Promise.all([
    requireOrgAccess(orgUId),
    data.user.getMyPermissions(),
    data.user.getMe(),
  ]);
  const permissionKeys = userPermissions.map((p) => p.key);
  const localeSeed = await resolveLocaleSeed(orgUId);

  return (
    <OrgProvider org={org} organizations={organizations}>
      <DataProvider
        apiUrl={GRAPHQL_API_URL}
        organizationUnitId={orgUId}
        locale={locale}
      >
        {localeSeed && <LocaleCookieSeeder value={localeSeed} />}
        <OrgSyncProvider orgUId={orgUId}>
          <SidebarProvider>
            <DashboardSidebar permissions={permissionKeys} />
            <SidebarInset>
              <PageHeaderProvider>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                  <SidebarTrigger className="-ml-1" />
                  <Separator orientation="vertical" className="mr-2 h-4" />
                  <div className="flex justify-between gap-2 flex-1">
                    <PageHeaderSlot />
                    <div className="flex gap-2 items-center ml-auto sm:ml-0">
                      <Suspense
                        fallback={<Loader2 className="animate-spin size-4" />}
                      >
                        {sheet}
                      </Suspense>
                      <ThemeToggle />
                      <ProfileNavIcon
                        orgUId={orgUId}
                        imageUrl={me.image}
                        name={me.name}
                      />
                    </div>
                  </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
              </PageHeaderProvider>
            </SidebarInset>
          </SidebarProvider>
          <BlockSheet />
          <VolunteerSheet />
        </OrgSyncProvider>
      </DataProvider>
    </OrgProvider>
  );
}

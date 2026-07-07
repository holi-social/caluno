import { DataProvider } from '@repo/data/react';
import {
  Separator,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@repo/ui';
import type { ReactNode } from 'react';
import { LocaleCookieSeeder } from '@/components/locale-cookie-seeder';
import { HomeSidebar } from '@/components/navigation/home-sidebar';
import { PageTitle } from '@/components/page-title';
import { resolveLocale } from '@/i18n/routing';
import { requireAuth } from '@/lib/auth-server';
import { GRAPHQL_API_URL } from '@/lib/constants';
import { resolveLocaleSeed } from '@/lib/locale-seed';

interface HomeLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function HomeLayout({
  children,
  params,
}: HomeLayoutProps) {
  await requireAuth('/login');
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const localeSeed = await resolveLocaleSeed();

  return (
    <DataProvider apiUrl={GRAPHQL_API_URL} locale={locale}>
      {localeSeed && <LocaleCookieSeeder value={localeSeed} />}
      <SidebarProvider>
        <HomeSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />

            <Separator orientation="vertical" className="mr-2 h-4" />

            <PageTitle />
          </header>

          <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </DataProvider>
  );
}

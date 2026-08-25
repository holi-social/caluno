import { DataProvider } from '@repo/data/react';
import type { PropsWithChildren } from 'react';
import { VolunteerNav } from '@/components/navigation/volunteer-nav';
import { resolveLocale } from '@/i18n/routing';
import { isAuthenticated } from '@/lib/auth-server';
import { GRAPHQL_API_URL } from '@/lib/constants';
import { isAnAdminstrator } from '@/lib/org-context-server';

interface PublicLayoutProps extends PropsWithChildren {
  params: Promise<{ locale: string }>;
}

export default async function PublicLayout({
  children,
  params,
}: PublicLayoutProps) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const authenticated = await isAuthenticated();
  const isAdmin = authenticated ? await isAnAdminstrator() : false;

  return (
    <DataProvider apiUrl={GRAPHQL_API_URL} locale={locale}>
      <div className="flex min-h-screen flex-col">
        <main className="grow pb-24">{children}</main>
        {authenticated && <VolunteerNav isAdmin={isAdmin} />}
      </div>
    </DataProvider>
  );
}

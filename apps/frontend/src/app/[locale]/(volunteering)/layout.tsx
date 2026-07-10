import { DataProvider } from '@repo/data/react';
import type { ReactNode } from 'react';
import { LocaleCookieSeeder } from '@/components/locale-cookie-seeder';
import { VolunteerNav } from '@/components/navigation/volunteer-nav';
import { resolveLocale } from '@/i18n/routing';
import { requireAuth } from '@/lib/auth-server';
import { GRAPHQL_API_URL } from '@/lib/constants';
import { resolveLocaleSeed } from '@/lib/locale-seed';
import { isAnAdminstrator } from '@/lib/org-context-server';

interface VolunteeringOrgLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function VolunteeringOrgLayout({
  children,
  params,
}: VolunteeringOrgLayoutProps) {
  await requireAuth();
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);

  const localeSeed = await resolveLocaleSeed();
  const isAdmin = await isAnAdminstrator();

  return (
    <DataProvider apiUrl={GRAPHQL_API_URL} locale={locale}>
      {localeSeed && <LocaleCookieSeeder value={localeSeed} />}
      <div className="flex min-h-screen flex-col">
        {children}

        <VolunteerNav isAdmin={isAdmin} />
      </div>
    </DataProvider>
  );
}

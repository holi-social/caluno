import { DataProvider } from '@repo/data/react';
import { Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';
import { LocaleCookieSeeder } from '@/components/locale-cookie-seeder';
import { ProfileDropdown } from '@/components/navigation/profile-dropdown';
import { VolunteerNav } from '@/components/navigation/volunteer-nav';
import { Link } from '@/i18n/navigation';
import { resolveLocale } from '@/i18n/routing';
import { requireAuth } from '@/lib/auth-server';
import { GRAPHQL_API_URL } from '@/lib/constants';
import { resolveLocaleSeed } from '@/lib/locale-seed';

interface VolunteeringOrgLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function VolunteeringOrgLayout({
  children,
  params,
}: VolunteeringOrgLayoutProps) {
  const session = await requireAuth();
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);

  const user = session.user;
  const localeSeed = await resolveLocaleSeed();

  return (
    <DataProvider apiUrl={GRAPHQL_API_URL} locale={locale}>
      {localeSeed && <LocaleCookieSeeder value={localeSeed} />}
      <div className="flex min-h-screen flex-col">
        <header className="shrink border-b">
          <div className="container mx-auto px-4 flex items-center h-14 max-w-4xl">
            <Link className="flex-1 page-title flex align-top" href="/">
              Clippy <Sparkles className="size-6 pl-2 text-yellow-400" />
            </Link>
            <ProfileDropdown userName={user.name} userImage={user.image} />
          </div>
        </header>

        <main className="grow overflow-y-auto pb-16">
          <div className="container mx-auto p-4 pt-8 max-w-4xl">{children}</div>
        </main>

        <VolunteerNav />
      </div>
    </DataProvider>
  );
}

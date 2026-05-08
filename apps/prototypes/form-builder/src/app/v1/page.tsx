import { cookies } from 'next/headers';
import { listFormConfigs } from '@/lib/store-configs';
import { listBlocks } from '@/lib/store-blocks';
import { getCurrentUserFromCookieValue, USER_COOKIE } from '@/lib/users';
import { UserSwitcher } from '@/components/v1/user-switcher';
import { DashboardContent } from '@/components/v1/dashboard-content';
import { VersionSwitcher } from '@/components/version-switcher';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const currentUser = getCurrentUserFromCookieValue(
    cookieStore.get(USER_COOKIE)?.value,
  );

  const [configs, blocks] = await Promise.all([
    listFormConfigs(),
    listBlocks(),
  ]);

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold">Formular-Baukasten</h1>
            <p className="text-muted-foreground text-sm">
              Registrierungs- und Onboarding-Formulare verwalten
            </p>
          </div>
          <div className="flex items-center gap-3">
            <VersionSwitcher />
            <UserSwitcher currentUser={currentUser} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <DashboardContent
          forms={configs}
          blocks={blocks}
          currentUser={currentUser}
        />
      </main>
    </div>
  );
}

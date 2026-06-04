import type { ReactNode } from 'react';
import { ProfileDropdown } from '@/components/navigation/profile-dropdown';
import { VolunteerNav } from '@/components/navigation/volunteer-nav';
import { requireAuth } from '@/lib/auth-server';

interface VolunteeringOrgLayoutProps {
  children: ReactNode;
}

export default async function VolunteeringOrgLayout({
  children,
}: VolunteeringOrgLayoutProps) {
  const session = await requireAuth();

  const user = session.user;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="shrink border-b">
        <div className="container mx-auto px-4 flex items-center h-14">
          <div className="flex-1 page-title">Clippy</div>
          <ProfileDropdown userName={user.name} userImage={user.image} />
        </div>
      </header>

      <main className="grow overflow-y-auto pb-16">
        <div className="container mx-auto p-4">{children}</div>
      </main>

      <VolunteerNav />
    </div>
  );
}

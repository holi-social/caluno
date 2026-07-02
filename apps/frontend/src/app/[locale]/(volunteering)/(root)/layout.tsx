import { HomeHeader } from '@repo/ui';
import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';
import { VolunteerShell } from '@/components/volunteering/volunteer-shell';
import { requireAuth } from '@/lib/auth-server';

interface RootPagesLayoutProps {
  children: ReactNode;
}

export default async function RootPagesLayout({
  children,
}: RootPagesLayoutProps) {
  const session = await requireAuth();
  const t = await getTranslations('Common');

  return (
    <VolunteerShell
      header={
        <HomeHeader
          variant="open"
          title={t('greeting', { name: session.user.name })}
        />
      }
    >
      {children}
    </VolunteerShell>
  );
}

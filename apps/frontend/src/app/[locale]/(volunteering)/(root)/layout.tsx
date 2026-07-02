import { HomeHeader } from '@repo/ui';
import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';
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
    <>
      <div className="fixed w-full">
        <HomeHeader title={t('greeting', { name: session.user.name })} />
      </div>
      <main className="grow pb-16 pt-28">
        <div className="container mx-auto p-6 pt-8 max-w-4xl">{children}</div>
      </main>
    </>
  );
}

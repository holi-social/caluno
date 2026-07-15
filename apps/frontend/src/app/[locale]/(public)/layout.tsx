import { DataProvider } from '@repo/data/react';
import type { PropsWithChildren } from 'react';
import { resolveLocale } from '@/i18n/routing';
import { GRAPHQL_API_URL } from '@/lib/constants';

interface PublicLayoutProps extends PropsWithChildren {
  params: Promise<{ locale: string }>;
}

export default async function PublicLayout({
  children,
  params,
}: PublicLayoutProps) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);

  return (
    <DataProvider apiUrl={GRAPHQL_API_URL} locale={locale}>
      {children}
    </DataProvider>
  );
}

import { DataProvider } from '@repo/data/react';
import type { PropsWithChildren } from 'react';
import { GRAPHQL_API_URL } from '@/lib/constants';

export default async function PublicLayout({ children }: PropsWithChildren) {
  return <DataProvider apiUrl={GRAPHQL_API_URL}>{children}</DataProvider>;
}

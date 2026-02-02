import { createDataClient, type DataClient } from '@repo/data';
import { headers } from 'next/headers';
import { GRAPHQL_API_URL } from './constants';
import { getCurrentOrganizationId } from './organization-context-server';

const globalForData = globalThis as unknown as {
  dataClient: DataClient | undefined;
};

export const data =
  globalForData.dataClient ??
  createDataClient({
    url: `${GRAPHQL_API_URL}`,
    credentials: 'include',
  });

if (process.env.NODE_ENV !== 'production') {
  globalForData.dataClient = data;
}

export async function getDataClient(): Promise<DataClient> {
  const orgId = await getCurrentOrganizationId();
  const headersList = await headers();
  const cookieHeader = headersList.get('cookie');

  const clientHeaders: Record<string, string> = {};

  if (orgId) {
    clientHeaders['x-organization-id'] = orgId;
  }

  if (cookieHeader) {
    clientHeaders.cookie = cookieHeader;
  }

  return createDataClient({
    url: GRAPHQL_API_URL,
    headers: clientHeaders,
  });
}

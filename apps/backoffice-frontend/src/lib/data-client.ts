import { createDataClient, type DataClient } from '@repo/data';

const globalForData = globalThis as unknown as {
  dataClient: DataClient | undefined;
};

export const data =
  globalForData.dataClient ??
  createDataClient({
    url: process.env.API_URL || 'http://localhost:5001/graphql',
    credentials: 'include',
  });

if (process.env.NODE_ENV !== 'production') {
  globalForData.dataClient = data;
}

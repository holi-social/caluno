import {
  createDataClient,
  type DataClient,
  ForbiddenDataError,
  LOCALE_HEADER,
  type Locale,
} from '@repo/data';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { GRAPHQL_API_URL } from './constants';

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

interface GetDataClientOptions {
  orgUId?: string;
  locale?: Locale;
}

export async function getDataClient(
  options?: GetDataClientOptions,
): Promise<DataClient> {
  const { orgUId, locale } = options ?? {};
  const headersList = await headers();
  const cookieHeader = headersList.get('cookie');

  const clientHeaders: Record<string, string> = {};

  if (orgUId) {
    clientHeaders['x-organization-unit-id'] = orgUId;
  }

  if (locale) {
    clientHeaders[LOCALE_HEADER] = locale;
  }

  if (cookieHeader) {
    clientHeaders.cookie = cookieHeader;
  }

  return createDataClient({
    url: GRAPHQL_API_URL,
    headers: clientHeaders,
    onError: (error) => {
      if (error instanceof ForbiddenDataError) {
        //  This is less than ideal, as error handling code is not given the chance to handle the error themselves.
        //  They're just booted out to the unauthorized page. So as a fallback it's too broad - it's handling all 403 errors handled and unhandled.
        //  But... the FE shouldn't allow unauthorized GQL in the first place, so as a fallback maybe it's ok. Let's see, revisit later :|
        redirect(`/unauthorized?message=${encodeURIComponent(error.message)}`);
      }
      throw error;
    },
  });
}

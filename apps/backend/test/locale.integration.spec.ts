import 'reflect-metadata';
import {
  beforeAll,
  describe,
  expect,
  it,
  mock,
  setDefaultTimeout,
} from 'bun:test';
import type { INestApplication } from '@nestjs/common';
import { applyBunAuthMocks } from './helpers/auth-mocks';
import {
  graphqlRequest,
  graphqlRequestRequiringData,
} from './helpers/graphql-request';
import { getGraphqlTestContext } from './helpers/graphql-test-context';

applyBunAuthMocks(mock.module);
setDefaultTimeout(20_000);

describe('Locale integration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const context = await getGraphqlTestContext();
    app = context.app;
  });

  it('detects, persists, and returns the user locale, using it as the source of truth for authenticated requests', async () => {
    const getMeResponse = await graphqlRequest<{
      me: { locale: string | null };
    }>(app, {
      query: `
        query GetMeLocale {
          me {
            locale
          }
        }
      `,
      headers: {
        'x-locale': 'en',
      },
    });

    expect(getMeResponse.errors).toBeUndefined();
    expect(getMeResponse.data?.me.locale).toBe('de');

    const updateLocaleResponse = await graphqlRequestRequiringData<{
      updateMyLocale: { id: string; locale: string };
    }>(
      app,
      {
        query: `
        mutation UpdateMyLocale($locale: String!) {
          updateMyLocale(locale: $locale) {
            id
            locale
          }
        }
      `,
        variables: { locale: 'de' },
      },
      'updateMyLocale',
    );

    expect(updateLocaleResponse.updateMyLocale.locale).toBe('de');

    const getMeAfterUpdateResponse = await graphqlRequest<{
      me: { locale: string | null };
    }>(app, {
      query: `
        query GetMeLocale {
          me {
            locale
          }
        }
      `,
      headers: {
        'x-locale': 'en',
        'accept-language': 'fr',
      },
    });

    expect(getMeAfterUpdateResponse.errors).toBeUndefined();
    expect(getMeAfterUpdateResponse.data?.me.locale).toBe('de');
  });
});

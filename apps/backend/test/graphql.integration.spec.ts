import 'reflect-metadata';
import type { INestApplication } from '@nestjs/common';
// @ts-expect-error Bun test types are only available at Bun runtime.
import { afterAll, beforeAll, describe, expect, it, mock } from 'bun:test';
import { applyBunAuthMocks } from './helpers/auth-mocks';
import { createGraphqlTestApp } from './helpers/create-graphql-test-app';
import { graphqlRequest } from './helpers/graphql-request';

applyBunAuthMocks(mock.module);

describe('GraphQL API Integration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createGraphqlTestApp();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('returns GraphQL query root typename', async () => {
    const response = await graphqlRequest<{ __typename: string }>(app, {
      query: `
        query GetRootTypename {
          __typename
        }
      `,
    });

    expect(response.errors).toBeUndefined();
    expect(response.data?.__typename).toBe('Query');
  });
});

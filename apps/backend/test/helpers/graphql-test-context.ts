import type { INestApplication } from '@nestjs/common';
import type { Database } from '../../src/database/database.module';
import { DATABASE_CONNECTION } from '../../src/database/database-connection';
import * as schema from '../../src/database/schema';
import { setAuthMockUserId } from './auth-mocks';
import { createGraphqlFullTestApp } from './create-graphql-full-app';
import { graphqlRequestRequiringData } from './graphql-request';

type GraphqlTestContext = {
  app: INestApplication;
  db: Database;
  testUserId: string;
  organizationId: string;
};

declare global {
  var __graphqlIntegrationTestContextPromise:
    | Promise<GraphqlTestContext>
    | undefined;
  var __graphqlIntegrationTestContextCleanupRegistered: boolean | undefined;
}

const createContext = async (): Promise<GraphqlTestContext> => {
  const testUserId = `test-user-${crypto.randomUUID()}`;

  setAuthMockUserId(testUserId);
  const app = await createGraphqlFullTestApp({ testUserId });
  const db = app.get<Database>(DATABASE_CONNECTION);

  await db
    .insert(schema.users)
    .values({
      id: testUserId,
      name: 'GraphQL Test User',
      email: `graphql-test-${crypto.randomUUID()}@example.com`,
    })
    .onConflictDoNothing();

  const createOrganizationData = await graphqlRequestRequiringData<{
    createOrganization: { id: string };
  }>(
    app,
    {
      query: `
      mutation CreateOrganization($input: CreateOrganizationInput!) {
        createOrganization(input: $input) {
          id
        }
      }
    `,
      variables: {
        input: {
          name: `GraphQL Test Org ${Date.now()}`,
          email: `graphql-test-org-${crypto.randomUUID()}@example.com`,
        },
      },
    },
    'createOrganization',
  );

  return {
    app,
    db,
    testUserId,
    organizationId: createOrganizationData.createOrganization.id,
  };
};

export const getGraphqlTestContext = (): Promise<GraphqlTestContext> => {
  if (!globalThis.__graphqlIntegrationTestContextPromise) {
    globalThis.__graphqlIntegrationTestContextPromise = createContext();
  }

  if (!globalThis.__graphqlIntegrationTestContextCleanupRegistered) {
    globalThis.__graphqlIntegrationTestContextCleanupRegistered = true;

    process.once('beforeExit', async () => {
      const context = await globalThis.__graphqlIntegrationTestContextPromise;
      await context?.app.close();
    });
  }

  return globalThis.__graphqlIntegrationTestContextPromise;
};

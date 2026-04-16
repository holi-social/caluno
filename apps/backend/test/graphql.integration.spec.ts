import 'reflect-metadata';
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
  mock,
  setDefaultTimeout,
} from 'bun:test';
import type { INestApplication } from '@nestjs/common';
import type { Database } from '../src/database/database.module';
import { DATABASE_CONNECTION } from '../src/database/database-connection';
import * as schema from '../src/database/schema';
import { applyBunAuthMocks, setAuthMockUserId } from './helpers/auth-mocks';
import { createGraphqlFullTestApp } from './helpers/create-graphql-full-app';
import {
  type GraphqlResponse,
  graphqlRequest,
} from './helpers/graphql-request';

applyBunAuthMocks(mock.module);
setDefaultTimeout(20_000);

const requireGraphqlData = <TData>(
  response: GraphqlResponse<TData>,
  operation: string,
): TData => {
  expect(response.errors).toBeUndefined();
  if (!response.data) {
    throw new Error(`Expected ${operation} to return data.`);
  }
  return response.data;
};

describe('GraphQL API Integration', () => {
  let app: INestApplication;
  let db: Database;
  const testUserId = `test-user-${crypto.randomUUID()}`;
  let organizationId: string;

  beforeAll(async () => {
    setAuthMockUserId(testUserId);
    console.log('before createGraphqlFullTestApp');
    app = await createGraphqlFullTestApp({ testUserId });
    db = app.get<Database>(DATABASE_CONNECTION);

    await db.insert(schema.users).values({
      id: testUserId,
      name: 'GraphQL Test User',
      email: `graphql-test-${crypto.randomUUID()}@example.com`,
    });

    const createOrganizationResponse = await graphqlRequest<{
      createOrganization: { id: string };
    }>(app, {
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
    });

    const createOrganizationData = requireGraphqlData(
      createOrganizationResponse,
      'createOrganization',
    );
    organizationId = createOrganizationData.createOrganization.id;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('creates and retrieves requirement profile and submission', async () => {
    const requirementTypes = ['DOCUMENT', 'CHECK', 'DATE', 'TEXT'] as const;
    const createdRequirements: Array<{ id: string; type: string }> = [];

    for (const type of requirementTypes) {
      const response = await graphqlRequest<{
        createRequirement: { id: string; type: string };
      }>(app, {
        query: `
          mutation CreateRequirement($input: CreateRequirementInput!) {
            createRequirement(input: $input) {
              id
              type
            }
          }
        `,
        variables: {
          input: {
            organizationId,
            type,
            name: `Requirement ${type}`,
            description: `Description for ${type}`,
            mandatory: true,
          },
        },
      });

      const createRequirementData = requireGraphqlData(
        response,
        'createRequirement',
      );
      expect(createRequirementData.createRequirement.type).toBe('XXX');
      createdRequirements.push(createRequirementData.createRequirement);
    }

    const requirementIdByType = Object.fromEntries(
      createdRequirements.map((requirement) => [
        requirement.type,
        requirement.id,
      ]),
    ) as Record<(typeof requirementTypes)[number], string>;

    const createProfileResponse = await graphqlRequest<{
      createRequirementProfile: {
        id: string;
        requirements: Array<{ id: string }>;
      };
    }>(app, {
      query: `
        mutation CreateRequirementProfile($input: CreateRequirementProfileInput!) {
          createRequirementProfile(input: $input) {
            id
            requirements {
              id
            }
          }
        }
      `,
      variables: {
        input: {
          organizationId,
          name: 'Test Requirement Profile',
          description: 'Profile containing all requirement types',
          requirementIds: createdRequirements.map((item) => item.id),
        },
      },
    });

    const createRequirementProfileData = requireGraphqlData(
      createProfileResponse,
      'createRequirementProfile',
    );
    const profileId = createRequirementProfileData.createRequirementProfile.id;
    expect(
      createProfileResponse.data?.createRequirementProfile.requirements,
    ).toHaveLength(4);

    const getProfileResponse = await graphqlRequest<{
      requirementProfile: {
        id: string;
        requirements: Array<{ id: string; type: string }>;
      } | null;
    }>(app, {
      query: `
        query GetRequirementProfile($id: String!) {
          requirementProfile(id: $id) {
            id
            requirements {
              id
              type
            }
          }
        }
      `,
      variables: { id: profileId },
    });

    expect(getProfileResponse.errors).toBeUndefined();
    expect(getProfileResponse.data?.requirementProfile?.id).toBe(profileId);
    expect(
      getProfileResponse.data?.requirementProfile?.requirements,
    ).toHaveLength(4);

    const createSubmissionResponse = await graphqlRequest<{
      createRequirementProfileSubmission: {
        id: string;
        status: string;
        fulfillments: Array<{ id: string; type: string; status: string }>;
      };
    }>(app, {
      query: `
        mutation CreateRequirementProfileSubmission($input: CreateRequirementProfileSubmissionInput!) {
          createRequirementProfileSubmission(input: $input) {
            id
            status
            fulfillments {
              id
              type
              status
            }
          }
        }
      `,
      variables: {
        input: {
          profileId,
          membershipId: null,
          membershipRequestId: null,
          fulfillments: [
            {
              requirementId: requirementIdByType.DOCUMENT,
              status: 'SUBMITTED',
              documentId: 'doc-123',
            },
            {
              requirementId: requirementIdByType.CHECK,
              status: 'SUBMITTED',
              checked: true,
            },
            {
              requirementId: requirementIdByType.DATE,
              status: 'SUBMITTED',
              date: new Date('2026-01-01T00:00:00.000Z').toISOString(),
            },
            {
              requirementId: requirementIdByType.TEXT,
              status: 'SUBMITTED',
              text: 'This is the text fulfillment.',
            },
          ],
        },
      },
    });

    const createRequirementProfileSubmissionData = requireGraphqlData(
      createSubmissionResponse,
      'createRequirementProfileSubmission',
    );
    const submissionId =
      createRequirementProfileSubmissionData.createRequirementProfileSubmission
        .id;
    expect(
      createRequirementProfileSubmissionData.createRequirementProfileSubmission
        .fulfillments,
    ).toHaveLength(4);

    const getSubmissionResponse = await graphqlRequest<{
      requirementProfileSubmission: {
        id: string;
        status: string;
        requirementProfile: { id: string };
        fulfillments: Array<{
          id: string;
          type: string;
          status: string;
          documentId?: string | null;
          checked?: boolean | null;
          date?: string | null;
          text?: string | null;
        }>;
      } | null;
    }>(app, {
      query: `
        query GetRequirementProfileSubmission($id: String!) {
          requirementProfileSubmission(id: $id) {
            id
            status
            requirementProfile {
              id
            }
            fulfillments {
              id
              type
              status
              ... on RequirementFulfillmentUpload {
                documentId
              }
              ... on RequirementFulfillmentCheck {
                checked
              }
              ... on RequirementFulfillmentDate {
                date
              }
              ... on RequirementFulfillmentText {
                text
              }
            }
          }
        }
      `,
      variables: { id: submissionId },
    });

    expect(getSubmissionResponse.errors).toBeUndefined();
    expect(getSubmissionResponse.data?.requirementProfileSubmission?.id).toBe(
      submissionId,
    );
    expect(
      getSubmissionResponse.data?.requirementProfileSubmission
        ?.requirementProfile.id,
    ).toBe(profileId);
    expect(
      getSubmissionResponse.data?.requirementProfileSubmission?.fulfillments,
    ).toHaveLength(4);
    const fulfillments =
      getSubmissionResponse.data?.requirementProfileSubmission?.fulfillments ??
      [];
    const documentFulfillment = fulfillments.find(
      (fulfillment) => fulfillment.type === 'DOCUMENT',
    );
    const checkFulfillment = fulfillments.find(
      (fulfillment) => fulfillment.type === 'CHECK',
    );
    const dateFulfillment = fulfillments.find(
      (fulfillment) => fulfillment.type === 'DATE',
    );
    const textFulfillment = fulfillments.find(
      (fulfillment) => fulfillment.type === 'TEXT',
    );
    expect(documentFulfillment?.documentId).toBe('doc-123');
    expect(checkFulfillment?.checked).toBe(true);
    expect(dateFulfillment?.date).toBe('2026-01-01T00:00:00.000Z');
    expect(textFulfillment?.text).toBe('This is the text fulfillment.');
  });
});

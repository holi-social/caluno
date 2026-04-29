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

describe('GraphQL API Integration', () => {
  let app: INestApplication;
  let organizationId: string;

  beforeAll(async () => {
    const context = await getGraphqlTestContext();
    app = context.app;
    organizationId = context.organizationId;
  });

  it('creates and retrieves requirement profile and submission', async () => {
    const requirementTypes = ['DOCUMENT', 'CHECK', 'DATE', 'TEXT'] as const;
    const createdRequirements: Array<{ id: string; type: string }> = [];

    for (const type of requirementTypes) {
      const createRequirementData = await graphqlRequestRequiringData<{
        createRequirement: { id: string; type: string };
      }>(
        app,
        {
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
        },
        'createRequirement',
      );

      expect(createRequirementData.createRequirement.type).toBe(type);
      createdRequirements.push(createRequirementData.createRequirement);
    }

    const requirementIdByType = Object.fromEntries(
      createdRequirements.map((requirement) => [
        requirement.type,
        requirement.id,
      ]),
    ) as Record<(typeof requirementTypes)[number], string>;

    const createRequirementProfileData = await graphqlRequestRequiringData<{
      createRequirementProfile: {
        id: string;
        requirements: Array<{ id: string }>;
      };
    }>(
      app,
      {
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
      },
      'createRequirementProfile',
    );

    const profileId = createRequirementProfileData.createRequirementProfile.id;
    expect(
      createRequirementProfileData.createRequirementProfile.requirements,
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

    const createRequirementProfileSubmissionData =
      await graphqlRequestRequiringData<{
        createRequirementProfileSubmission: {
          id: string;
          status: string;
          fulfillments: Array<{ id: string; type: string; status: string }>;
        };
      }>(
        app,
        {
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
                  documentId: 'doc-123',
                },
                {
                  requirementId: requirementIdByType.CHECK,
                  checked: true,
                },
                {
                  requirementId: requirementIdByType.DATE,
                  date: new Date('2026-01-01T00:00:00.000Z').toISOString(),
                },
                {
                  requirementId: requirementIdByType.TEXT,
                  text: 'This is the text fulfillment.',
                },
              ],
            },
          },
        },
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

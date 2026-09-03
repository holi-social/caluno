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
import * as schema from '../src/database/schema';
import { FilePurpose, FileStatus, FileVisibility } from '../src/storage/enums';
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
  let db: Awaited<ReturnType<typeof getGraphqlTestContext>>['db'];
  let testUserId: string;
  let organizationId: string;
  let organizationUnitId: string;

  beforeAll(async () => {
    const context = await getGraphqlTestContext();
    app = context.app;
    db = context.db;
    testUserId = context.testUserId;
    organizationId = context.organizationId;
    organizationUnitId = context.organizationUnitId;
  });

  it('creates and retrieves requirement profile and submission', async () => {
    const requirementTypes = ['DOCUMENT', 'CHECK', 'DATE', 'TEXT'] as const;
    const createdRequirements: Array<{ id: string; type: string }> = [];
    const orgUnitHeaders = { 'x-organization-unit-id': organizationUnitId };

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
          headers: orgUnitHeaders,
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
        headers: orgUnitHeaders,
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
      headers: orgUnitHeaders,
    });

    expect(getProfileResponse.errors).toBeUndefined();
    expect(getProfileResponse.data?.requirementProfile?.id).toBe(profileId);
    expect(
      getProfileResponse.data?.requirementProfile?.requirements,
    ).toHaveLength(4);

    const [documentFile] = await db
      .insert(schema.files)
      .values({
        storageKey: `private/${organizationUnitId}/${testUserId}/test-document.pdf`,
        bucket: process.env.STORAGE_BUCKET ?? 'caluno',
        visibility: FileVisibility.PRIVATE,
        purpose: FilePurpose.REQUIREMENT_DOCUMENT,
        mimeType: 'application/pdf',
        filename: 'test-document.pdf',
        byteSize: 10,
        status: FileStatus.UPLOADED,
        uploadedByUserId: testUserId,
        organizationUnitId,
        uploadedAt: new Date(),
      })
      .returning();

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
                  fileId: documentFile.id,
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
          headers: orgUnitHeaders,
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
          fileId?: string | null;
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
                fileId
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
      headers: orgUnitHeaders,
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
    expect(documentFulfillment?.fileId).toBe(documentFile.id);
    expect(checkFulfillment?.checked).toBe(true);
    expect(dateFulfillment?.date).toBe('2026-01-01T00:00:00.000Z');
    expect(textFulfillment?.text).toBe('This is the text fulfillment.');
  });
});

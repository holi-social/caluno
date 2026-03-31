'use server';

import type { CreateOrganizationInput } from '@repo/data';
import { redirect } from 'next/navigation';
import { getDataClient } from '@/lib/data-client';

const GET_ORG_ROOT_QUERY = /* GraphQL */ `
  query GetOrganizationRootUnit($id: String!) {
    organization(id: $id) {
      id
      root {
        id
      }
    }
  }
`;

const GET_ORG_ID_FROM_UNIT_QUERY = /* GraphQL */ `
  query GetOrganizationIdFromUnit($id: String!) {
    organizationUnit(id: $id) {
      id
      organization {
        id
      }
    }
  }
`;

interface CreateOrganizationResult {
  success: boolean;
  error?: string;
}

export async function createOrganization(
  _prevState: CreateOrganizationResult | null,
  formData: FormData,
): Promise<CreateOrganizationResult> {
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string;
  const websiteUrl = formData.get('websiteUrl') as string;
  const address = formData.get('address') as string;

  if (!name) {
    return {
      success: false,
      error: 'Organization name is required',
    };
  }

  const input: CreateOrganizationInput = {
    name,
    description: description || undefined,
    email: email || undefined,
    phone: phone || undefined,
    websiteUrl: websiteUrl || undefined,
    address: address || undefined,
  };

  const data = await getDataClient();

  let org: { id: string };

  try {
    org = await data.organization.create(input);
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to create organization. Please try again.',
    };
  }
  const graphQLClient = data.getGraphQLClient();
  const result = await graphQLClient.request<{
    organization: { root: { id: string } } | null;
  }>(GET_ORG_ROOT_QUERY, { id: org.id });
  const rootOrgUnitId = result.organization?.root.id;

  if (!rootOrgUnitId) {
    return {
      success: false,
      error:
        'Organization created, but failed to resolve root organization unit.',
    };
  }

  redirect(`/${rootOrgUnitId}`);
}

export async function getVolunteers(organizationUnitId: string) {
  const data = await getDataClient(organizationUnitId);
  const graphQLClient = data.getGraphQLClient();
  const result = await graphQLClient.request<{
    organizationUnit: { organization: { id: string } } | null;
  }>(GET_ORG_ID_FROM_UNIT_QUERY, { id: organizationUnitId });
  const organizationId = result.organizationUnit?.organization.id;

  if (!organizationId) {
    return [];
  }

  return await data.organization.findVolunteers(organizationId);
}

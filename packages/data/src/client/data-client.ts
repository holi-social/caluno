import { GraphQLClient } from 'graphql-request';
import { OrganizationRepository } from '../repositories/organization/organization.repository';
import { ProjectRepository } from '../repositories/project/project.repository';
import { ShiftRepository } from '../repositories/shift/shift.repository';
import { UserRepository } from '../repositories/user/user.repository';
import type { GraphQLClientConfig } from './graphql-client';
import type { OrganizationContext } from './organization-context';

export class DataClient {
  private graphqlClient: GraphQLClient;

  public readonly user: UserRepository;
  public readonly organization: OrganizationRepository;
  public readonly project: ProjectRepository;
  public readonly shift: ShiftRepository;

  // Optional organization context
  public readonly organizationContext?: OrganizationContext;

  constructor(
    config: GraphQLClientConfig,
    organizationContext?: OrganizationContext,
  ) {
    this.graphqlClient = new GraphQLClient(config.url, {
      credentials: config.credentials,
      headers: config.headers,
    });

    this.organizationContext = organizationContext;
    this.user = new UserRepository(this.graphqlClient);
    this.organization = new OrganizationRepository(this.graphqlClient);
    this.project = new ProjectRepository(this.graphqlClient);
    this.shift = new ShiftRepository(this.graphqlClient);
  }

  async getCurrentOrganizationId(): Promise<string | null> {
    return (await this.organizationContext?.getCurrentOrganizationId()) ?? null;
  }

  getGraphQLClient(): GraphQLClient {
    return this.graphqlClient;
  }
}

export function createDataClient(
  config: GraphQLClientConfig,
  organizationContext?: OrganizationContext,
): DataClient {
  return new DataClient(config, organizationContext);
}

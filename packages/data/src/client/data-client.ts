import { GraphQLClient } from 'graphql-request';
import { MembershipRequestRepository } from '../repositories/membershipRequest/membershipRequest.repository';
import { OrganizationRepository } from '../repositories/organization/organization.repository';
import { OrganizationUnitRepository } from '../repositories/organization/organization-unit.repository';
import { RoleRepository } from '../repositories/role/role.repository';
import { ShiftRepository } from '../repositories/shift/shift.repository';
import { TimeEntryRepository } from '../repositories/time-entry/time-entry.repository';
import { UserRepository } from '../repositories/user/user.repository';
import type { GraphQLClientConfig } from './graphql-client';
import type { OrganizationContext } from './organization-context';

export class DataClient {
  private graphqlClient: GraphQLClient;

  public readonly user: UserRepository;
  public readonly organization: OrganizationRepository;
  public readonly organizationUnit: OrganizationUnitRepository;
  public readonly shift: ShiftRepository;
  public readonly timeEntry: TimeEntryRepository;
  public readonly membershipRequest: MembershipRequestRepository;
  public readonly role: RoleRepository;

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
    this.organizationUnit = new OrganizationUnitRepository(this.graphqlClient);
    this.shift = new ShiftRepository(this.graphqlClient);
    this.timeEntry = new TimeEntryRepository(this.graphqlClient);
    this.membershipRequest = new MembershipRequestRepository(
      this.graphqlClient,
    );
    this.role = new RoleRepository(this.graphqlClient);
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

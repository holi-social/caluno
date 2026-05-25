import { DataError } from '../errors/data-error';
import { getSdk, type SdkFunctionWrapper } from '../generated/graphql';
import { MembershipRequestRepository } from '../repositories/membershipRequest/membershipRequest.repository';
import { OrganizationRepository } from '../repositories/organization/organization.repository';
import { OrganizationUnitRepository } from '../repositories/organization/organization-unit.repository';
import { RoleRepository } from '../repositories/role/role.repository';
import { ShiftRepository } from '../repositories/shift/shift.repository';
import { TimeEntryRepository } from '../repositories/time-entry/time-entry.repository';
import { UserRepository } from '../repositories/user/user.repository';
import {
  createGraphQLClient,
  type GraphQLClientConfig,
} from './graphql-client';
import type { OrganizationContext } from './organization-context';

export interface DataClientConfig extends GraphQLClientConfig {
  onError?: (error: DataError) => void;
}

const rethrowErrorHandler = (error: DataError) => {
  throw error;
};

export class DataClient {
  public readonly user: UserRepository;
  public readonly organization: OrganizationRepository;
  public readonly organizationUnit: OrganizationUnitRepository;
  public readonly shift: ShiftRepository;
  public readonly timeEntry: TimeEntryRepository;
  public readonly membershipRequest: MembershipRequestRepository;
  public readonly role: RoleRepository;

  public readonly organizationContext?: OrganizationContext;

  constructor(
    { onError = rethrowErrorHandler, ...clientConfig }: DataClientConfig,
    organizationContext?: OrganizationContext,
  ) {
    const graphqlClient = createGraphQLClient(clientConfig);

    const wrapper: SdkFunctionWrapper = async (action) => {
      try {
        return await action();
      } catch (error) {
        const dataError = DataError.fromGraphQLError(error);
        onError(dataError);
        throw dataError;
      }
    };

    const sdk = getSdk(graphqlClient, wrapper);

    this.organizationContext = organizationContext;
    this.user = new UserRepository(sdk);
    this.organization = new OrganizationRepository(sdk);
    this.organizationUnit = new OrganizationUnitRepository(sdk);
    this.shift = new ShiftRepository(sdk);
    this.timeEntry = new TimeEntryRepository(sdk);
    this.membershipRequest = new MembershipRequestRepository(sdk);
    this.role = new RoleRepository(sdk);
  }

  async getCurrentOrganizationId(): Promise<string | null> {
    return (await this.organizationContext?.getCurrentOrganizationId()) ?? null;
  }
}

export function createDataClient(
  config: DataClientConfig,
  organizationContext?: OrganizationContext,
): DataClient {
  return new DataClient(config, organizationContext);
}

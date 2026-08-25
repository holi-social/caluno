import type { DataError } from '../errors/data-error';
import { fromGraphQLError } from '../errors/translate';
import { getSdk, type SdkFunctionWrapper } from '../generated/graphql';
import { EventRepository } from '../repositories/event/event.repository';
import { MembershipRepository } from '../repositories/membership/membership.repository';
import { MembershipRequestRepository } from '../repositories/membershipRequest/membershipRequest.repository';
import { OrganizationRepository } from '../repositories/organization/organization.repository';
import { OrganizationUnitRepository } from '../repositories/organization/organization-unit.repository';
import { PublicEventRepository } from '../repositories/public-event/public-event.repository';
import { PublicOrganizationUnitRepository } from '../repositories/public-organization-unit/public-organization-unit.repository';
import { RequirementFormRepository } from '../repositories/requirementForm/requirement-form.repository';
import { RequirementProfileRepository } from '../repositories/requirementProfile/requirement-profile.repository';
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
  public readonly event: EventRepository;
  public readonly shift: ShiftRepository;
  public readonly timeEntry: TimeEntryRepository;
  public readonly membership: MembershipRepository;
  public readonly membershipRequest: MembershipRequestRepository;
  public readonly requirementForm: RequirementFormRepository;
  public readonly requirementProfile: RequirementProfileRepository;
  public readonly role: RoleRepository;
  public readonly publicEvent: PublicEventRepository;
  public readonly publicOrganizationUnit: PublicOrganizationUnitRepository;

  public readonly organizationContext?: OrganizationContext;

  constructor(
    { onError = rethrowErrorHandler, ...clientConfig }: DataClientConfig,
    organizationContext?: OrganizationContext,
  ) {
    const graphqlClient = createGraphQLClient(clientConfig);

    const graphQLCallWrapper: SdkFunctionWrapper = async (action) => {
      try {
        return await action();
      } catch (error) {
        const dataError = fromGraphQLError(error);
        onError(dataError);
        throw dataError;
      }
    };

    const sdk = getSdk(graphqlClient, graphQLCallWrapper);

    this.organizationContext = organizationContext;
    this.user = new UserRepository(sdk);
    this.organization = new OrganizationRepository(sdk);
    this.organizationUnit = new OrganizationUnitRepository(sdk);
    this.event = new EventRepository(sdk);
    this.shift = new ShiftRepository(sdk);
    this.timeEntry = new TimeEntryRepository(sdk);
    this.membership = new MembershipRepository(sdk);
    this.membershipRequest = new MembershipRequestRepository(sdk);
    this.requirementForm = new RequirementFormRepository(sdk);
    this.requirementProfile = new RequirementProfileRepository(sdk);
    this.role = new RoleRepository(sdk);
    this.publicEvent = new PublicEventRepository(sdk);
    this.publicOrganizationUnit = new PublicOrganizationUnitRepository(sdk);
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

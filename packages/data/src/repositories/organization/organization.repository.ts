import type {
  CreateOrganizationInput,
  GetMyOrganizationUnitsQuery,
} from '../../generated/graphql';
import { BaseRepository } from '../base/base.repository';

export type MyOrganizationUnit =
  GetMyOrganizationUnitsQuery['myOrganizationUnits'][number];

export interface FindOrganizationsOptions {
  limit?: number;
  offset?: number;
}

export class OrganizationRepository extends BaseRepository {
  async findById(id: string) {
    const data = await this.sdk.GetOrganization({ id });
    return data.organization;
  }

  async findBySlug(slug: string) {
    const data = await this.sdk.GetOrganizationBySlug({ slug });
    return data.organizationBySlug;
  }

  async findRootUnit(organizationId: string) {
    const data = await this.sdk.GetOrganizationRoot({ id: organizationId });
    return data.organization?.root ?? null;
  }

  async findVolunteersByUnit(organizationUnitId: string) {
    const data = await this.sdk.GetOrganizationVolunteersByUnit({
      id: organizationUnitId,
    });
    return data.members ?? [];
  }

  async findUnitWithOrg(organizationUnitId: string) {
    const data = await this.sdk.GetOrganizationUnitPublicInfo({
      id: organizationUnitId,
    });
    return data.organizationUnit ?? null;
  }

  async findAllWithRoot(options: FindOrganizationsOptions = {}) {
    const { limit = 100, offset = 0 } = options;
    const data = await this.sdk.GetOrganizationsWithRoot({ limit, offset });
    return data.organizations.items;
  }

  async findMyOrganizationUnits() {
    const data = await this.sdk.GetMyOrganizationUnits();
    return data.myOrganizationUnits;
  }

  async findMyAdminstrableOrganizationUnits() {
    const data = await this.sdk.GetMyAdminstableOrganizationUnits();
    return data.myAdminstableOrganizationUnits;
  }

  async findMyCheckInAdministrableOrganizationUnits() {
    const data = await this.sdk.GetMyCheckInAdministrableOrganizationUnits();
    return data.myCheckInAdministrableOrganizationUnits;
  }

  async findAll(options: FindOrganizationsOptions = {}) {
    const { limit = 10, offset = 0 } = options;
    const data = await this.sdk.GetOrganizations({ limit, offset });
    return data.organizations;
  }

  async create(input: CreateOrganizationInput) {
    const data = await this.sdk.CreateOrganization({ input });
    return data.createOrganization;
  }

  async setRequiredForms(organizationUnitId: string, formIds: string[]) {
    const data = await this.sdk.SetRequiredForms({
      organizationUnitId,
      formIds,
    });
    return data.setRequiredForms;
  }
}

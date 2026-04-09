import { DataError } from '../../errors/data-error';
import type { CreateOrganizationInput } from '../../generated/graphql';
import { BaseRepository } from '../base/base.repository';

export interface FindOrganizationsOptions {
  limit?: number;
  offset?: number;
}

export class OrganizationRepository extends BaseRepository {
  async findById(id: string) {
    try {
      const data = await this.sdk.GetOrganization({ id });
      return data.organization;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }

  async findBySlug(slug: string) {
    try {
      const data = await this.sdk.GetOrganizationBySlug({ slug });
      return data.organizationBySlug;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }

  async findRootUnit(organizationId: string) {
    try {
      const data = await this.sdk.GetOrganizationRoot({ id: organizationId });
      return data.organization?.root ?? null;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }

  async findVolunteersByUnit(organizationUnitId: string) {
    try {
      const data = await this.sdk.GetOrganizationVolunteersByUnit({
        id: organizationUnitId,
      });
      return data.organizationUnit?.organization.volunteers ?? [];
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }

  async findUnitWithOrg(organizationUnitId: string) {
    try {
      const data = await this.sdk.GetOrganizationUnitWithOrg({
        id: organizationUnitId,
      });
      return data.organizationUnit ?? null;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }

  async findAllWithRoot(options: FindOrganizationsOptions = {}) {
    const { limit = 100, offset = 0 } = options;
    try {
      const data = await this.sdk.GetOrganizationsWithRoot({ limit, offset });
      return data.organizations.items;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }

  async findAll(options: FindOrganizationsOptions = {}) {
    const { limit = 10, offset = 0 } = options;
    try {
      const data = await this.sdk.GetOrganizations({ limit, offset });
      return data.organizations;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }

  async findVolunteers(organizationId: string) {
    try {
      const data = await this.sdk.GetVolunteers({ id: organizationId });
      return data.organization.volunteers;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }

  async create(input: CreateOrganizationInput) {
    try {
      const data = await this.sdk.CreateOrganization({ input });
      return data.createOrganization;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }
}

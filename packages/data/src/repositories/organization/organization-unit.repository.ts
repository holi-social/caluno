import { DataError } from '../../errors/data-error';
import type {
  CreateOrganizationUnitInput,
  UpdateOrganizationUnitInput,
} from '../../generated/graphql';
import { BaseRepository } from '../base/base.repository';

export class OrganizationUnitRepository extends BaseRepository {
  async findById(id: string) {
    try {
      const data = await this.sdk.GetOrganizationUnit({ id });
      return data.organizationUnit;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }

  async findTree(organizationId: string) {
    try {
      const data = await this.sdk.GetOrganizationUnitTree({
        id: organizationId,
      });
      return data.organization?.root ?? null;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }

  async findAllTypes() {
    try {
      const data = await this.sdk.GetOrganizationUnitTypes();
      return data.organizationUnitTypes;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }

  async create(input: CreateOrganizationUnitInput) {
    try {
      const data = await this.sdk.CreateOrganizationUnit({ input });
      return data.createOrganizationUnit;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }

  async update(id: string, input: UpdateOrganizationUnitInput) {
    try {
      const data = await this.sdk.UpdateOrganizationUnit({ id, input });
      return data.updateOrganizationUnit;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }

  async delete(id: string) {
    try {
      const data = await this.sdk.DeleteOrganizationUnit({ id });
      return data.deleteOrganizationUnit;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }
}

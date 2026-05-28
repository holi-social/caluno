import type {
  CreateOrganizationUnitInput,
  UpdateOrganizationUnitInput,
} from '../../generated/graphql';
import { BaseRepository } from '../base/base.repository';

export class OrganizationUnitRepository extends BaseRepository {
  async findById(id: string) {
    const data = await this.sdk.GetOrganizationUnit({ id });
    return data.organizationUnit;
  }

  async findTree(organizationId: string) {
    const data = await this.sdk.GetOrganizationUnitTree({
      id: organizationId,
    });
    return data.organization?.root ?? null;
  }

  async findAllTypes() {
    const data = await this.sdk.GetOrganizationUnitTypes();
    return data.organizationUnitTypes;
  }

  async create(input: CreateOrganizationUnitInput) {
    const data = await this.sdk.CreateOrganizationUnit({ input });
    return data.createOrganizationUnit;
  }

  async update(id: string, input: UpdateOrganizationUnitInput) {
    const data = await this.sdk.UpdateOrganizationUnit({ id, input });
    return data.updateOrganizationUnit;
  }

  async delete(id: string) {
    const data = await this.sdk.DeleteOrganizationUnit({ id });
    return data.deleteOrganizationUnit;
  }
}

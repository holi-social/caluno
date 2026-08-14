import type {
  CreateOrganizationUnitInput,
  UpdateOrganizationUnitInput,
} from '../../generated/graphql';
import { BaseRepository } from '../base/base.repository';

export interface OrgUnitTreeNode {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  deletedAt: string | null;
  type: { id: string; name: string; icon: string };
  children: OrgUnitTreeNode[];
}

export class OrganizationUnitRepository extends BaseRepository {
  async findById(id: string) {
    const data = await this.sdk.GetOrganizationUnit({ id });
    return data.organizationUnit;
  }

  async findOrganizationTree(): Promise<OrgUnitTreeNode | null> {
    const data = await this.sdk.GetOrganizationTree();
    return (data.organizationTree?.root as unknown as OrgUnitTreeNode) ?? null;
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

  async isMemberOfOrgUnitOrAncestor(
    organizationUnitId: string,
    userId: string,
  ): Promise<boolean> {
    const data = await this.sdk.IsMemberOfOrgUnitOrAncestor({
      organizationUnitId,
      userId,
    });
    return data.isMemberOfUnitOrAncestor;
  }
}

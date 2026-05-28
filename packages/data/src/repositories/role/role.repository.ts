import type {
  CreateRoleInput,
  GetRoleQuery,
  GetRolesQuery,
} from '../../generated/graphql';
import { BaseRepository } from '../base/base.repository';

export type RoleListItem = GetRolesQuery['roles'][number];
export type RoleDetails = GetRoleQuery['role'];

export class RoleRepository extends BaseRepository {
  async findById(id: string) {
    const data = await this.sdk.GetRole({ id });
    return data.role;
  }

  async findAll() {
    const data = await this.sdk.GetRoles();
    return data.roles;
  }

  async findAllPermissions() {
    const data = await this.sdk.GetPermissions();
    return data.permissions;
  }

  async findPermissionGroups() {
    const data = await this.sdk.GetPermissionGroups();
    return data.permissionGroups;
  }

  async create(input: CreateRoleInput) {
    const data = await this.sdk.createRole({ input });
    return data.createRole;
  }

  async update(id: string, input: CreateRoleInput) {
    const data = await this.sdk.UpdateRole({ id, input });
    return data.updateRole;
  }

  async delete(id: string) {
    const data = await this.sdk.DeleteRole({ id });
    return data.deleteRole;
  }
}

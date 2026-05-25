import { fromGraphQLError } from '../../errors/translate';
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
    try {
      const data = await this.sdk.GetRole({ id });
      return data.role;
    } catch (error) {
      throw fromGraphQLError(error);
    }
  }

  async findAll() {
    try {
      const data = await this.sdk.GetRoles();
      return data.roles;
    } catch (error) {
      throw fromGraphQLError(error);
    }
  }

  async findAllPermissions() {
    try {
      const data = await this.sdk.GetPermissions();
      return data.permissions;
    } catch (error) {
      throw fromGraphQLError(error);
    }
  }

  async findPermissionGroups() {
    try {
      const data = await this.sdk.GetPermissionGroups();
      return data.permissionGroups;
    } catch (error) {
      throw fromGraphQLError(error);
    }
  }

  async create(input: CreateRoleInput) {
    try {
      const data = await this.sdk.createRole({ input });
      return data.createRole;
    } catch (error) {
      throw fromGraphQLError(error);
    }
  }

  async update(id: string, input: CreateRoleInput) {
    try {
      const data = await this.sdk.UpdateRole({ id, input });
      return data.updateRole;
    } catch (error) {
      throw fromGraphQLError(error);
    }
  }

  async delete(id: string) {
    try {
      const data = await this.sdk.DeleteRole({ id });
      return data.deleteRole;
    } catch (error) {
      throw fromGraphQLError(error);
    }
  }
}

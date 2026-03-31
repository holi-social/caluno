import { DataError } from '../../errors/data-error';
import type { CreateRoleInput, GetRolesQuery } from '../../generated/graphql';
import { BaseRepository } from '../base/base.repository';

export type RoleListItem = GetRolesQuery['roles'][number];

export class RoleRepository extends BaseRepository {
  async findAll() {
    try {
      const data = await this.sdk.GetRoles();
      return data.roles;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }

  async findAllPermissions() {
    try {
      const data = await this.sdk.GetPermissions();
      return data.permissions;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }

  async create(input: CreateRoleInput) {
    try {
      const data = await this.sdk.createRole({ input });
      return data.createRole;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }

  async update(id: string, input: CreateRoleInput) {
    try {
      const data = await this.sdk.UpdateRole({ id, input });
      return data.updateRole;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }

  async delete(id: string) {
    try {
      const data = await this.sdk.DeleteRole({ id });
      return data.deleteRole;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }
}

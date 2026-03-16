import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { AuthService } from '../auth.service';
import { PermissionMapper } from '../mappers/permission.mapper';
import { Permission } from '../models/permission.model';
import { Role } from '../models/role.model';
import type { RoleEntity } from '../schemas/role.schema';

@Resolver(() => Role)
export class RoleFieldResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly permissionMapper: PermissionMapper,
  ) {}

  @ResolveField(() => [Permission])
  async permissions(@Parent() role: RoleEntity): Promise<Permission[]> {
    const permissions = await this.authService.findRolePermissions(role.id);
    return this.permissionMapper.toArray(permissions);
  }
}

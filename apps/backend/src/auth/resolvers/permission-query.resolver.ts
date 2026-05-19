import { Query, Resolver } from '@nestjs/graphql';
import { AuthService } from '../auth.service';
import { PermissionMapper } from '../mappers/permission.mapper';
import { Permission } from '../models/permission.model';
import { PermissionGroup } from '../models/permission-group.model';

@Resolver(() => Permission)
export class PermissionQueryResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly permissionMapper: PermissionMapper,
  ) {}

  @Query(() => [Permission])
  async permissions(): Promise<Permission[]> {
    const permissions = await this.authService.findAllPermissions();
    return this.permissionMapper.toArray(permissions);
  }

  @Query(() => [PermissionGroup])
  async permissionGroups(): Promise<PermissionGroup[]> {
    const groups = await this.authService.findPermissionGroups();

    return groups.map((group) => ({
      key: group.key,
      label: group.label,
      items: group.items.map((item) => ({
        label: item.label,
        permission: this.permissionMapper.toModelOrThrow(item.permission),
      })),
    }));
  }
}

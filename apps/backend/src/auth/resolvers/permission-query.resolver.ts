import { Query, Resolver } from '@nestjs/graphql';
import { AuthService } from '../auth.service';
import { PermissionMapper } from '../mappers/permission.mapper';
import { Permission } from '../models/permission.model';

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
}

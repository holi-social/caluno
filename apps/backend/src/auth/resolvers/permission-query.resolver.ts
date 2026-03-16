import { Query, Resolver } from '@nestjs/graphql';
import { AuthService } from '../auth.service';
import { Permission } from '../models/permission.model';

@Resolver(() => Permission)
export class PermissionQueryResolver {
  constructor(private readonly authService: AuthService) {}

  @Query(() => [Permission])
  async permissions(): Promise<Permission[]> {
    return this.authService.findAllPermissions();
  }
}

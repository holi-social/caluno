import { Context, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { AuthService } from '../../auth/auth.service';
import { PermissionMapper } from '../../auth/mappers/permission.mapper';
import { Permission } from '../../auth/models/permission.model';
import { ForbiddenGraphQLError } from '../../graphql/errors';
import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { User } from '../models/user.model';

@Resolver(() => User)
export class UserFieldResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly permissionMapper: PermissionMapper,
  ) {}

  @ResolveField(() => [Permission])
  async permissions(
    @Parent() user: User,
    @Context() ctx: AuthenticatedGraphQLContext,
  ): Promise<Permission[]> {
    if (user.id !== ctx.user.id) {
      throw new ForbiddenGraphQLError('You can only view your own permissions');
    }

    const permissions = await this.authService.findUserPermissions(
      user.id,
      ctx.organizationUnitId,
    );
    return this.permissionMapper.toArray(permissions);
  }
}

import { Context, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { PermissionMapper } from 'src/auth/mappers/permission.mapper';
import { Permission } from 'src/auth/models/permission.model';
import type { AuthenticatedGraphQLContext } from 'src/graphql/graphql.context';
import { AuthService } from '../../auth/auth.service';
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
    const permissions = await this.authService.findUserPermissions(
      user.id,
      ctx.organizationId,
    );
    return this.permissionMapper.toArray(permissions);
  }
}

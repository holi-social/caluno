import { Args, Context, Query, Resolver } from '@nestjs/graphql';
import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { AuthService } from '../auth.service';
import { RoleMapper } from '../mappers/role.mapper';
import { Role } from '../models/role.model';

@Resolver(() => Role)
export class RoleQueryResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly roleMapper: RoleMapper,
  ) {}

  @Query(() => [Role])
  async roles(
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<Role[]> {
    const roles = await this.authService.findAllRoles(
      context.organizationUnitId,
    );
    return this.roleMapper.toArray(roles);
  }

  @Query(() => Role)
  async role(@Args('id') id: string): Promise<Role> {
    const role = await this.authService.findRoleById(id);
    return this.roleMapper.toModelOrThrow(role);
  }
}

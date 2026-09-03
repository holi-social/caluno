import { Args, Context, ID, Mutation, Resolver } from '@nestjs/graphql';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { AuthService } from '../auth.service';
import { PERMISSIONS } from '../constants';
import { Permissions } from '../decorators/permissions.decorator';
import { CreateRoleInput } from '../inputs/create-role.input';
import { RoleMapper } from '../mappers/role.mapper';
import { Role } from '../models/role.model';

@Resolver(() => Role)
export class RoleMutationResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly roleMapper: RoleMapper,
  ) {}

  @Permissions(PERMISSIONS.ORG_EDIT)
  @Mutation(() => Role)
  async createRole(
    @Context() context: AuthenticatedGraphQLContext,
    @Session() session: UserSession,
    @Args('input') input: CreateRoleInput,
  ): Promise<Role> {
    const role = await this.authService.createRole(
      context.organizationUnitId,
      input,
      session.user.id,
    );
    return this.roleMapper.toModelOrThrow(role);
  }

  @Permissions(PERMISSIONS.ORG_EDIT)
  @Mutation(() => Role)
  async updateRole(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: CreateRoleInput,
    @Context() context: AuthenticatedGraphQLContext,
    @Session() session: UserSession,
  ): Promise<Role> {
    const updatedRole = await this.authService.updateRole(
      id,
      input,
      session.user.id,
    );
    return this.roleMapper.toModelOrThrow(updatedRole);
  }

  @Permissions(PERMISSIONS.ORG_EDIT)
  @Mutation(() => Role)
  async deleteRole(
    @Args('id', { type: () => ID }) id: string,
    @Context() context: AuthenticatedGraphQLContext,
    @Session() session: UserSession,
  ): Promise<Role> {
    const deletedRole = await this.authService.deleteRole(id, session.user.id);
    return this.roleMapper.toModelOrThrow(deletedRole);
  }
}

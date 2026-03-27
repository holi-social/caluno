import { Args, Context, ID, Mutation, Resolver } from '@nestjs/graphql';
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

  @Permissions(PERMISSIONS.ORG_ROLE_CREATE)
  @Mutation(() => Role)
  async createOrganizationRole(
    @Context() context: AuthenticatedGraphQLContext,
    @Args('input') input: CreateRoleInput,
  ): Promise<Role> {
    const role = await this.authService.createOrganizationRole(
      context.organizationId,
      input,
    );
    return this.roleMapper.toModelOrThrow(role);
  }

  @Permissions(PERMISSIONS.ORG_UNIT_ROLE_CREATE)
  @Mutation(() => Role)
  async createOrganizationUnitRole(
    @Context() context: AuthenticatedGraphQLContext,
    @Args('input') input: CreateRoleInput,
  ): Promise<Role> {
    const role = await this.authService.createOrganizationUnitRole(
      context.organizationUnitId,
      input,
    );
    return this.roleMapper.toModelOrThrow(role);
  }

  @Permissions(PERMISSIONS.ORG_ROLE_UPDATE, PERMISSIONS.ORG_UNIT_ROLE_UPDATE)
  @Mutation(() => Role)
  async updateRole(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: CreateRoleInput,
  ): Promise<Role> {
    const updatedRole = await this.authService.updateRole(id, input);
    return this.roleMapper.toModelOrThrow(updatedRole);
  }

  @Permissions(PERMISSIONS.ORG_ROLE_DELETE, PERMISSIONS.ORG_UNIT_ROLE_DELETE)
  @Mutation(() => Role)
  async deleteRole(@Args('id', { type: () => ID }) id: string): Promise<Role> {
    const deletedRole = await this.authService.deleteRole(id);
    return this.roleMapper.toModelOrThrow(deletedRole);
  }
}

import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { RoleMapper } from '../../auth/mappers/role.mapper';
import { Role } from '../../auth/models/role.model';
import type { RoleEntity } from '../../auth/schemas/role.schema';
import { Membership } from '../models/membership.model';
import type { MembershipEntity } from '../schemas/membership.schema';

@Resolver(() => Membership)
export class MembershipFieldResolver {
  constructor(private readonly roleMapper: RoleMapper) {}

  @ResolveField(() => [Role])
  async roles(
    @Parent() membership: MembershipEntity & {
      roles?: Array<{ role: RoleEntity }>;
    },
  ): Promise<Role[]> {
    if (!membership.roles) {
      return [];
    }
    return membership.roles
      .map((r) => this.roleMapper.toModel(r.role))
      .filter((r): r is Role => r !== null);
  }
}

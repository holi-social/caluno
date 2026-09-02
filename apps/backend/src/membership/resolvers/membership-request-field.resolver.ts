import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { AuthService } from '../../auth/auth.service';
import { PERMISSIONS } from '../../auth/constants';
import type { UserEntity } from '../../auth/schemas/auth.schema';
import { UserMapper } from '../../user/mappers/user.mapper';
import { User } from '../../user/models/user.model';
import { UserService } from '../../user/user.service';
import { MembershipRequest } from '../models/membership-request.model';
import type { MembershipRequestEntity } from '../schemas/membership-request.schema';

type MembershipRequestParent = MembershipRequestEntity & {
  reviewedBy?: User | UserEntity | null;
  organizationUnit?: { id: string } | null;
};

@Resolver(() => MembershipRequest)
export class MembershipRequestFieldResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly userMapper: UserMapper,
  ) {}

  @ResolveField(() => User, { nullable: true })
  async contact(
    @Parent() request: MembershipRequestParent,
  ): Promise<User | null> {
    if (request.reviewedBy) {
      return request.reviewedBy as User;
    }

    const organizationUnitId = request.organizationUnit?.id;
    if (!organizationUnitId) {
      return null;
    }

    const admins = await this.authService.findUsersWithPermission(
      organizationUnitId,
      PERMISSIONS.VOLUNTEER_EDIT,
    );

    const firstAdmin = admins[0];
    if (!firstAdmin) {
      return null;
    }

    const user = await this.userService.findById(firstAdmin.id);
    if (!user) {
      return null;
    }

    return this.userMapper.toModelOrThrow(user);
  }
}

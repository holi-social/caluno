import { Context, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { UserMapper } from '../../user/mappers/user.mapper';
import { User } from '../../user/models/user.model';
import { ShiftInstance } from '../models/shift-instance.model';
import type { ShiftInstanceEntity } from '../schemas/shift-instance.schema';
import { ShiftService } from '../shift.service';

@Resolver(() => ShiftInstance)
export class ShiftInstanceFieldResolver {
  constructor(
    private readonly shiftService: ShiftService,
    private readonly userMapper: UserMapper,
  ) {}

  @Permissions(PERMISSIONS.SHIFT_READ)
  @ResolveField(() => [User])
  async volunteers(
    @Parent() instance: ShiftInstanceEntity,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<User[]> {
    const volunteers = await this.shiftService.findVolunteers(
      instance.id,
      context.organizationUnitId,
    );
    return this.userMapper.toArray(volunteers);
  }
}

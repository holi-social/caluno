import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { UserMapper } from '../../user/mappers/user.mapper';
import { User } from '../../user/models/user.model';
import { UserService } from '../../user/user.service';
import { ShiftInstanceCallOutSummary } from '../models/shift-instance-call-out.model';

type ShiftInstanceCallOutSummaryWithSender = ShiftInstanceCallOutSummary & {
  sentById: string;
};

@Resolver(() => ShiftInstanceCallOutSummary)
export class ShiftInstanceCallOutSummaryFieldResolver {
  constructor(
    private readonly userService: UserService,
    private readonly userMapper: UserMapper,
  ) {}

  @ResolveField(() => User)
  async sentBy(
    @Parent() summary: ShiftInstanceCallOutSummaryWithSender,
  ): Promise<User> {
    const sender = await this.userService.findByIdOrThrow(summary.sentById);
    return this.userMapper.toModelOrThrow(sender);
  }
}

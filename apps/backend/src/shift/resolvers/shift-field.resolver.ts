import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { UserMapper } from 'src/user/mappers/user.mapper';
import { User } from 'src/user/models/user.model';
import { Shift } from '../models/shift.model';
import type { ShiftEntity } from '../schemas/shift.schema';
import { ShiftService } from '../shift.service';

@Resolver(() => Shift)
export class ShiftFieldResolver {
  constructor(
    private readonly shiftService: ShiftService,
    private readonly userMapper: UserMapper,
  ) {}

  @ResolveField(() => User)
  async createdBy(@Parent() shift: ShiftEntity): Promise<User> {
    const creator = await this.shiftService.findCreator(shift.createdById);
    return this.userMapper.toModelOrThrow(creator);
  }

  @ResolveField(() => User)
  async volunteers(@Parent() shift: ShiftEntity): Promise<User[]> {
    const volunteers = await this.shiftService.findVolunteers(shift.id);
    return this.userMapper.toArray(volunteers);
  }
}

import { Args, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Shift } from '../models/shift.model';
import { User } from 'src/user/models/user.model';
import { ShiftService } from '../shift.service';
import { UserMapper } from 'src/user/mappers/user.mapper';
import type { ShiftEntity } from '../schemas/shift.schema';
import { PaginationInput } from 'src/graphql/pagination.input';

@Resolver(() => Shift)
export class ShiftFieldResolver {
  constructor(
    private readonly shiftService: ShiftService,
    private readonly userMapper: UserMapper,
  ) {}

  @ResolveField(() => User)
  async volunteers(@Parent() shift: ShiftEntity): Promise<User[]> {
    const volunteers = await this.shiftService.findVolunteers(shift.id);
    return this.userMapper.toArray(volunteers);
  }
}

import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { UserMapper } from '../../user/mappers/user.mapper';
import { User } from '../../user/models/user.model';
import { ShiftRecurrenceRuleMapper } from '../mappers/shift-recurrence-rule.mapper';
import { Shift } from '../models/shift.model';
import { ShiftRecurrenceRule } from '../models/shift-recurrence-rule.model';
import type { ShiftEntity } from '../schemas/shift.schema';
import { ShiftService } from '../shift.service';

@Resolver(() => Shift)
export class ShiftFieldResolver {
  constructor(
    private readonly shiftService: ShiftService,
    private readonly userMapper: UserMapper,
    private readonly shiftRecurrenceRuleMapper: ShiftRecurrenceRuleMapper,
  ) {}

  @Permissions(PERMISSIONS.SHIFT_READ)
  @ResolveField(() => User)
  async createdBy(@Parent() shift: ShiftEntity): Promise<User> {
    const creator = await this.shiftService.findCreator(shift.createdById);
    return this.userMapper.toModelOrThrow(creator);
  }

  @Permissions(PERMISSIONS.SHIFT_READ)
  @ResolveField(() => User)
  async volunteers(@Parent() shift: ShiftEntity): Promise<User[]> {
    const volunteers = await this.shiftService.findVolunteers(shift.id);
    return this.userMapper.toArray(volunteers);
  }

  @Permissions(PERMISSIONS.SHIFT_READ)
  @ResolveField(() => ShiftRecurrenceRule, { nullable: true })
  async recurrenceRule(
    @Parent() shift: ShiftEntity,
  ): Promise<ShiftRecurrenceRule | null> {
    const rule = await this.shiftService.findRecurrenceRule(shift.id);
    return this.shiftRecurrenceRuleMapper.toModel(rule);
  }
}

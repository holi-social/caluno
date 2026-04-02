import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { MembershipModule } from '../membership/membership.module';
import { UserModule } from '../user/user.module';
import { ShiftMapper } from './mappers/shift.mapper';
import { ShiftRecurrenceRuleMapper } from './mappers/shift-recurrence-rule.mapper';
import { ShiftFieldResolver } from './resolvers/shift-field.resolver';
import { ShiftMutationResolver } from './resolvers/shift-mutation.resolver';
import { ShiftQueryResolver } from './resolvers/shift-query.resolver';
import { ShiftService } from './shift.service';

@Module({
  imports: [DatabaseModule, UserModule, MembershipModule],
  providers: [
    ShiftService,
    ShiftQueryResolver,
    ShiftMapper,
    ShiftRecurrenceRuleMapper,
    ShiftMutationResolver,
    ShiftFieldResolver,
  ],
  exports: [ShiftMapper, ShiftRecurrenceRuleMapper, ShiftService],
})
export class ShiftModule {}

import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { MembershipModule } from '../membership/membership.module';
import { ShiftModule } from '../shift/shift.module';
import { UserModule } from '../user/user.module';
import { TimeEntryMapper } from './mappers/time-entry.mapper';
import {
  TimeTrackingMutationResolver,
  TimeTrackingQueryResolver,
} from './resolvers';
import { TimeTrackingService } from './time-tracking.service';

@Module({
  imports: [DatabaseModule, MembershipModule, ShiftModule, UserModule],
  providers: [
    TimeTrackingService,
    TimeEntryMapper,
    TimeTrackingMutationResolver,
    TimeTrackingQueryResolver,
  ],
  exports: [TimeTrackingService],
})
export class TimeTrackingModule {}

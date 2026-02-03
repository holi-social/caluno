import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { MembershipModule } from '../membership/membership.module';
import { TaskModule } from '../task/task.module';
import { UserModule } from '../user/user.module';
import { TimeEntryMapper } from './mappers/time-entry.mapper';
import { VolunteerSessionMapper } from './mappers/volunteer-session.mapper';
import {
  TimeTrackingMutationResolver,
  VolunteerSessionFieldResolver,
} from './resolvers';
import { TimeTrackingService } from './time-tracking.service';

@Module({
  imports: [DatabaseModule, MembershipModule, TaskModule, UserModule],
  providers: [
    TimeTrackingService,
    VolunteerSessionMapper,
    TimeEntryMapper,
    TimeTrackingMutationResolver,
    VolunteerSessionFieldResolver,
  ],
  exports: [TimeTrackingService],
})
export class TimeTrackingModule {}

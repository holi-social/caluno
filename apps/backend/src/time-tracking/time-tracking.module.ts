import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { MembershipModule } from '../membership/membership.module';
import { TaskModule } from '../task/task.module';
import { UserModule } from '../user/user.module';
import { TimeRecordMapper } from './mappers/time-record.mapper';
import { TimeSessionMapper } from './mappers/time-session.mapper';
import {
  TimeTrackingMutationResolver,
  TimeSessionFieldResolver,
} from './resolvers';
import { TimeTrackingService } from './time-tracking.service';

@Module({
  imports: [DatabaseModule, MembershipModule, TaskModule, UserModule],
  providers: [
    TimeTrackingService,
    TimeSessionMapper,
    TimeRecordMapper,
    TimeTrackingMutationResolver,
    TimeSessionFieldResolver,
  ],
  exports: [TimeTrackingService],
})
export class TimeTrackingModule {}

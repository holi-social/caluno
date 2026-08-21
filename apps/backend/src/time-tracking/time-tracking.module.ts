import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { MembershipModule } from '../membership/membership.module';
import { OrganizationModule } from '../organization/organization.module';
import { OrganizationUnitDataModule } from '../organization/organization-unit-data.module';
import { ShiftModule } from '../shift/shift.module';
import { UserModule } from '../user/user.module';
import { TimeEntryMapper } from './mappers/time-entry.mapper';
import {
  TimeEntryFieldResolver,
  TimeTrackingMutationResolver,
  TimeTrackingQueryResolver,
} from './resolvers';
import { TimeEntryLoader } from './resolvers/time-entry.loader';
import { TimeTrackingService } from './time-tracking.service';

@Module({
  imports: [
    DatabaseModule,
    MembershipModule,
    OrganizationModule,
    OrganizationUnitDataModule,
    ShiftModule,
    UserModule,
  ],
  providers: [
    TimeTrackingService,
    TimeEntryMapper,
    TimeEntryFieldResolver,
    TimeEntryLoader,
    TimeTrackingMutationResolver,
    TimeTrackingQueryResolver,
  ],
  exports: [TimeTrackingService],
})
export class TimeTrackingModule {}

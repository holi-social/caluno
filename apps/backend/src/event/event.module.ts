import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { MembershipModule } from '../membership/membership.module';
import { ShiftModule } from '../shift/shift.module';
import { StorageModule } from '../storage/storage.module';
import { UserModule } from '../user/user.module';
import { EventService } from './event.service';
import { EventMapper } from './mappers/event.mapper';
import { EventFieldResolver } from './resolvers/event-field.resolver';
import { EventMutationResolver } from './resolvers/event-mutation.resolver';
import { EventQueryResolver } from './resolvers/event-query.resolver';
import { EventShiftsLoader } from './resolvers/loader';
import { ShiftEventLoader } from './resolvers/shift-event.loader';
import { ShiftEventFieldResolver } from './resolvers/shift-event-field.resolver';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    UserModule,
    MembershipModule,
    ShiftModule,
    StorageModule,
  ],
  providers: [
    EventService,
    EventMapper,
    EventQueryResolver,
    EventMutationResolver,
    EventFieldResolver,
    EventShiftsLoader,
    ShiftEventLoader,
    ShiftEventFieldResolver,
  ],
  exports: [EventMapper, EventService],
})
export class EventModule {}

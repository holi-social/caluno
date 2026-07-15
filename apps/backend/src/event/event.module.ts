import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { MembershipModule } from '../membership/membership.module';
import { ShiftModule } from '../shift/shift.module';
import { UserModule } from '../user/user.module';
import { EventService } from './event.service';
import { EventMapper } from './mappers/event.mapper';
import { EventFieldResolver } from './resolvers/event-field.resolver';
import { EventMutationResolver } from './resolvers/event-mutation.resolver';
import { EventQueryResolver } from './resolvers/event-query.resolver';
import { EventShiftsLoader } from './resolvers/loader';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    UserModule,
    MembershipModule,
    forwardRef(() => ShiftModule),
  ],
  providers: [
    EventService,
    EventMapper,
    EventQueryResolver,
    EventMutationResolver,
    EventFieldResolver,
    EventShiftsLoader,
  ],
  exports: [EventMapper, EventService],
})
export class EventModule {}

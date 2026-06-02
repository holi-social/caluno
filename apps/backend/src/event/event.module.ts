import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { MembershipModule } from '../membership/membership.module';
import { NotificationModule } from '../notification/notification.module';
import { UserModule } from '../user/user.module';
import { EventService } from './event.service';
import { EventMapper } from './mappers/event.mapper';
import { EventInviteMapper } from './mappers/event-invite.mapper';
import { EventFieldResolver } from './resolvers/event-field.resolver';
import { EventInviteFieldResolver } from './resolvers/event-invite-field.resolver';
import { EventMutationResolver } from './resolvers/event-mutation.resolver';
import { EventQueryResolver } from './resolvers/event-query.resolver';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    UserModule,
    forwardRef(() => MembershipModule),
    NotificationModule,
  ],
  providers: [
    EventService,
    EventMapper,
    EventInviteMapper,
    EventQueryResolver,
    EventMutationResolver,
    EventFieldResolver,
    EventInviteFieldResolver,
  ],
  exports: [EventMapper, EventInviteMapper, EventService],
})
export class EventModule {}

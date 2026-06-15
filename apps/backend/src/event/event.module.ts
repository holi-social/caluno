import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { MembershipModule } from '../membership/membership.module';
import { UserModule } from '../user/user.module';
import { EventService } from './event.service';
import { EventMapper } from './mappers/event.mapper';
import { EventFieldResolver } from './resolvers/event-field.resolver';
import { EventMutationResolver } from './resolvers/event-mutation.resolver';
import { EventQueryResolver } from './resolvers/event-query.resolver';

@Module({
  imports: [DatabaseModule, AuthModule, UserModule, MembershipModule],
  providers: [
    EventService,
    EventMapper,
    EventQueryResolver,
    EventMutationResolver,
    EventFieldResolver,
  ],
  exports: [EventMapper, EventService],
})
export class EventModule {}

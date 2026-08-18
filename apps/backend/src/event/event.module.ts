import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { MembershipModule } from '../membership/membership.module';
import { OrganizationModule } from '../organization/organization.module';
import { OrganizationUnitDataModule } from '../organization/organization-unit-data.module';
import { RequirementProfileModule } from '../requirement-profile/requirement-profile.module';
import { ShiftModule } from '../shift/shift.module';
import { StorageModule } from '../storage/storage.module';
import { UserModule } from '../user/user.module';
import { EventService } from './event.service';
import { EventMapper } from './mappers/event.mapper';
import { EventInviteMapper } from './mappers/event-invite.mapper';
import { EventFieldResolver } from './resolvers/event-field.resolver';
import { EventInviteLoader } from './resolvers/event-invite.loader';
import { EventInviteCountLoader } from './resolvers/event-invite-count.loader';
import { EventInviteFieldResolver } from './resolvers/event-invite-field.resolver';
import { EventInviteUsersLoader } from './resolvers/event-invite-users.loader';
import { EventMutationResolver } from './resolvers/event-mutation.resolver';
import { EventOrganizationUnitLoader } from './resolvers/event-organization-unit.loader';
import { EventOrganizationUnitFieldResolver } from './resolvers/event-organization-unit-field.resolver';
import { EventOrganizerLoader } from './resolvers/event-organizer.loader';
import { EventQueryResolver } from './resolvers/event-query.resolver';
import { EventRequiredFormsLoader } from './resolvers/event-required-forms.loader';
import { EventShiftsLoader } from './resolvers/loader';
import { ShiftEventLoader } from './resolvers/shift-event.loader';
import { ShiftEventFieldResolver } from './resolvers/shift-event-field.resolver';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    UserModule,
    MembershipModule,
    OrganizationModule,
    ShiftModule,
    StorageModule,
    OrganizationUnitDataModule,
    RequirementProfileModule,
  ],
  providers: [
    EventService,
    EventMapper,
    EventInviteMapper,
    EventQueryResolver,
    EventMutationResolver,
    EventFieldResolver,
    EventShiftsLoader,
    EventRequiredFormsLoader,
    EventInviteCountLoader,
    ShiftEventLoader,
    ShiftEventFieldResolver,
    EventOrganizationUnitLoader,
    EventOrganizationUnitFieldResolver,
    EventOrganizerLoader,
    EventInviteLoader,
    EventInviteFieldResolver,
    EventInviteUsersLoader,
  ],
  exports: [EventMapper, EventService],
})
export class EventModule {}

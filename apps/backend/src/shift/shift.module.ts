import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { MembershipModule } from '../membership/membership.module';
import { NotificationModule } from '../notification/notification.module';
import { OrganizationModule } from '../organization/organization.module';
import { OrganizationUnitDataModule } from '../organization/organization-unit-data.module';
import { RequirementProfileModule } from '../requirement-profile/requirement-profile.module';
import { StorageModule } from '../storage/storage.module';
import { UserModule } from '../user/user.module';
import { ShiftMapper } from './mappers/shift.mapper';
import { ShiftInstanceMapper } from './mappers/shift-instance.mapper';
import { ShiftInstanceInviteMapper } from './mappers/shift-instance-invite.mapper';
import { ShiftInviteMapper } from './mappers/shift-invite.mapper';
import { ShiftInstanceInvitesLoader } from './resolvers/loader';
import { ShiftLoader } from './resolvers/shift.loader';
import { ShiftFieldResolver } from './resolvers/shift-field.resolver';
import { ShiftInstanceLoader } from './resolvers/shift-instance.loader';
import { ShiftInstanceFieldResolver } from './resolvers/shift-instance-field.resolver';
import { ShiftInstanceInviteFieldResolver } from './resolvers/shift-instance-invite-field.resolver';
import { ShiftInstanceInviteUsersLoader } from './resolvers/shift-instance-invite-users.loader';
import { ShiftMutationResolver } from './resolvers/shift-mutation.resolver';
import { ShiftQueryResolver } from './resolvers/shift-query.resolver';
import { ShiftRequiredFormsLoader } from './resolvers/shift-required-forms.loader';
import { ShiftService } from './shift.service';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    UserModule,
    MembershipModule,
    NotificationModule,
    OrganizationModule,
    OrganizationUnitDataModule,
    StorageModule,
    RequirementProfileModule,
  ],
  providers: [
    ShiftService,
    ShiftQueryResolver,
    ShiftMapper,
    ShiftInstanceInviteMapper,
    ShiftInviteMapper,
    ShiftInstanceMapper,
    ShiftMutationResolver,
    ShiftFieldResolver,
    ShiftInstanceFieldResolver,
    ShiftInstanceInviteFieldResolver,
    ShiftInstanceInvitesLoader,
    ShiftInstanceInviteUsersLoader,
    ShiftLoader,
    ShiftInstanceLoader,
    ShiftRequiredFormsLoader,
  ],
  exports: [ShiftMapper, ShiftInstanceMapper, ShiftService],
})
export class ShiftModule {}

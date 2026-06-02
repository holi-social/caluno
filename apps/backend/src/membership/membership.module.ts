import { forwardRef, Module } from '@nestjs/common';
import { RoleMapper } from '../auth/mappers/role.mapper';
import { DatabaseModule } from '../database/database.module';
import { EventModule } from '../event/event.module';
import { NotificationModule } from '../notification/notification.module';
import { OrganizationUnitMapper } from '../organization/mappers/organization-unit.mapper';
import { RequirementProfileModule } from '../requirement-profile/requirement-profile.module';
import { ShiftModule } from '../shift/shift.module';
import { UserModule } from '../user/user.module';
import { MembershipMapper } from './mappers/membership.mepper';
import { MembershipRequestMapper } from './mappers/membership-request.mepper';
import { MembershipService } from './membership.service';
import {
  MembershipFieldResolver,
  MembershipMutationResolver,
  MembershipQueryResolver,
  MembershipRequestMutationResolver,
  MembershipRequestQueryResolver,
} from './resolvers';

@Module({
  imports: [
    DatabaseModule,
    UserModule,
    NotificationModule,
    RequirementProfileModule,
    forwardRef(() => ShiftModule),
    forwardRef(() => EventModule),
  ],
  providers: [
    MembershipService,
    MembershipMapper,
    MembershipRequestMapper,
    MembershipFieldResolver,
    MembershipQueryResolver,
    MembershipRequestMutationResolver,
    MembershipRequestQueryResolver,
    MembershipMutationResolver,
    OrganizationUnitMapper,
    RoleMapper,
  ],
  exports: [MembershipService],
})
export class MembershipModule {}

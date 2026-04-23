import { forwardRef, Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { NotificationModule } from '../notification/notification.module';
import { RequirementProfileModule } from '../requirement-profile/requirement-profile.module';
import { ShiftModule } from '../shift/shift.module';
import { UserModule } from '../user/user.module';
import { MembershipMapper } from './mappers/membership.mepper';
import { MembershipRequestMapper } from './mappers/membership-request.mepper';
import { MembershipService } from './membership.service';
import {
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
  ],
  providers: [
    MembershipService,
    MembershipMapper,
    MembershipRequestMapper,
    MembershipQueryResolver,
    MembershipRequestMutationResolver,
    MembershipRequestQueryResolver,
    MembershipMutationResolver,
  ],
  exports: [MembershipService],
})
export class MembershipModule {}

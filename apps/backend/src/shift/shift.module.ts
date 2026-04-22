import { forwardRef, Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { MembershipModule } from '../membership/membership.module';
import { NotificationModule } from '../notification/notification.module';
import { RequirementProfileModule } from '../requirement-profile/requirement-profile.module';
import { UserModule } from '../user/user.module';
import { ShiftMapper } from './mappers/shift.mapper';
import { ShiftInstanceMapper } from './mappers/shift-instance.mapper';
import { ShiftFieldResolver } from './resolvers/shift-field.resolver';
import { ShiftInstanceFieldResolver } from './resolvers/shift-instance-field.resolver';
import { ShiftMutationResolver } from './resolvers/shift-mutation.resolver';
import { ShiftQueryResolver } from './resolvers/shift-query.resolver';
import { ShiftService } from './shift.service';

@Module({
  imports: [
    DatabaseModule,
    UserModule,
    forwardRef(() => MembershipModule),
    RequirementProfileModule,
    NotificationModule,
  ],
  providers: [
    ShiftService,
    ShiftQueryResolver,
    ShiftMapper,
    ShiftInstanceMapper,
    ShiftMutationResolver,
    ShiftFieldResolver,
    ShiftInstanceFieldResolver,
  ],
  exports: [ShiftMapper, ShiftInstanceMapper, ShiftService],
})
export class ShiftModule {}

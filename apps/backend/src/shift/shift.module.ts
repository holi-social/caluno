import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { EventModule } from '../event/event.module';
import { MembershipModule } from '../membership/membership.module';
import { NotificationModule } from '../notification/notification.module';
import { OrganizationMapper } from '../organization/mappers/organization.mapper';
import { OrganizationUnitMapper } from '../organization/mappers/organization-unit.mapper';
import { OrganizationUnitService } from '../organization/organization-unit.service';
import { UserModule } from '../user/user.module';
import { ShiftMapper } from './mappers/shift.mapper';
import { ShiftInstanceMapper } from './mappers/shift-instance.mapper';
import { ShiftLoader } from './resolvers/shift.loader';
import { ShiftFieldResolver } from './resolvers/shift-field.resolver';
import { ShiftInstanceLoader } from './resolvers/shift-instance.loader';
import { ShiftInstanceFieldResolver } from './resolvers/shift-instance-field.resolver';
import { ShiftMutationResolver } from './resolvers/shift-mutation.resolver';
import { ShiftQueryResolver } from './resolvers/shift-query.resolver';
import { ShiftService } from './shift.service';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    UserModule,
    MembershipModule,
    NotificationModule,
    forwardRef(() => EventModule),
  ],
  providers: [
    ShiftService,
    ShiftQueryResolver,
    ShiftMapper,
    ShiftInstanceMapper,
    ShiftMutationResolver,
    ShiftFieldResolver,
    ShiftInstanceFieldResolver,
    ShiftLoader,
    ShiftInstanceLoader,
    OrganizationUnitService,
    OrganizationMapper,
    OrganizationUnitMapper,
  ],
  exports: [ShiftMapper, ShiftInstanceMapper, ShiftService],
})
export class ShiftModule {}

import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { MembershipModule } from '../membership/membership.module';
import { ProjectModule } from '../project/project.module';
import { UserModule } from '../user/user.module';
import { ShiftMapper } from './mappers/shift.mapper';
import { ShiftFieldResolver } from './resolvers/shift-field.resolver';
import { ShiftMutationResolver } from './resolvers/shift-mutation.resolver';
import { ShiftQueryResolver } from './resolvers/shift-query.resolver';
import { ShiftService } from './shift.service';

@Module({
  imports: [DatabaseModule, UserModule, MembershipModule, ProjectModule],
  providers: [
    ShiftService,
    ShiftQueryResolver,
    ShiftMapper,
    ShiftMutationResolver,
    ShiftFieldResolver,
  ],
  exports: [ShiftMapper, ShiftService],
})
export class ShiftModule {}

import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { UserModule } from '../user/user.module';
import { MembershipMapper } from './mappers/membership.mepper';
import { MembershipRequestMapper } from './mappers/membership-request.mepper';
import { MembershipService } from './membership.service';
import {
  MembershipQueryResolver,
  MembershipRequestQueryResolver,
} from './resolvers';

@Module({
  imports: [DatabaseModule, UserModule],
  providers: [
    MembershipService,
    MembershipMapper,
    MembershipRequestMapper,
    MembershipQueryResolver,
    MembershipRequestQueryResolver,
  ],
  exports: [MembershipService],
})
export class MembershipModule {}

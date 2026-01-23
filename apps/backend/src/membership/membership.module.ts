import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { UserMapper } from '../user/mappers/user.mapper';
import { UserModule } from '../user/user.module';
import { MembershipService } from './membership.service';

@Module({
  imports: [DatabaseModule, UserModule],
  providers: [MembershipService, UserMapper],
  exports: [MembershipService],
})
export class MembershipModule {}

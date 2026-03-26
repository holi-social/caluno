import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { MembershipModule } from '../membership/membership.module';
import { UserModule } from '../user/user.module';
import {
  OrganizationMapper,
  OrganizationPublicInfoMapper,
} from './mappers/organization.mapper';
import { OrganizationService } from './organization.service';
import {
  OrganizationFieldResolver,
  OrganizationMutationResolver,
  OrganizationQueryResolver,
} from './resolvers';

@Module({
  imports: [DatabaseModule, UserModule, MembershipModule, AuthModule],
  providers: [
    OrganizationService,
    OrganizationQueryResolver,
    OrganizationMutationResolver,
    OrganizationFieldResolver,
    OrganizationMapper,
    OrganizationPublicInfoMapper,
  ],
})
export class OrganizationModule {}

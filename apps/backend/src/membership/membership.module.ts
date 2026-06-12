import { Module } from '@nestjs/common';
import { RoleMapper } from '../auth/mappers/role.mapper';
import { DatabaseModule } from '../database/database.module';
import { OrganizationUnitMapper } from '../organization/mappers/organization-unit.mapper';
import { RequirementProfileModule } from '../requirement-profile/requirement-profile.module';
import { UserModule } from '../user/user.module';
import { MembershipMapper } from './mappers/membership.mepper';
import { MembershipRequestMapper } from './mappers/membership-request.mepper';
import { MembershipService } from './membership.service';
import {
  MembershipFieldResolver,
  MembershipMutationResolver,
  MembershipQueryResolver,
  MembershipRequestQueryResolver,
} from './resolvers';

@Module({
  imports: [DatabaseModule, UserModule, RequirementProfileModule],
  providers: [
    MembershipService,
    MembershipMapper,
    MembershipRequestMapper,
    MembershipFieldResolver,
    MembershipQueryResolver,
    MembershipRequestQueryResolver,
    MembershipMutationResolver,
    OrganizationUnitMapper,
    RoleMapper,
  ],
  exports: [MembershipService],
})
export class MembershipModule {}

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { MembershipModule } from '../membership/membership.module';
import { RequirementProfileModule } from '../requirement-profile/requirement-profile.module';
import { UserModule } from '../user/user.module';
import { OrganizationMapper } from './mappers/organization.mapper';
import { OrganizationUnitMapper } from './mappers/organization-unit.mapper';
import { OrganizationUnitTypeMapper } from './mappers/organization-unit-type.mapper';
import { OrganizationService } from './organization.service';
import { OrganizationUnitService } from './organization-unit.service';
import {
  OrganizationFieldResolver,
  OrganizationMutationResolver,
  OrganizationQueryResolver,
  OrganizationUnitFieldResolver,
  OrganizationUnitMutationResolver,
  OrganizationUnitQueryResolver,
} from './resolvers';

@Module({
  imports: [
    DatabaseModule,
    UserModule,
    MembershipModule,
    AuthModule,
    RequirementProfileModule,
  ],
  providers: [
    OrganizationService,
    OrganizationUnitService,
    OrganizationQueryResolver,
    OrganizationMutationResolver,
    OrganizationFieldResolver,
    OrganizationUnitQueryResolver,
    OrganizationUnitMutationResolver,
    OrganizationUnitFieldResolver,
    OrganizationMapper,
    OrganizationUnitMapper,
    OrganizationUnitTypeMapper,
  ],
})
export class OrganizationModule {}

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { MembershipModule } from '../membership/membership.module';
import { ProjectModule } from '../project/project.module';
import { UserModule } from '../user/user.module';
import { OrganizationMapper } from './mappers/organization.mapper';
import { OrganizationService } from './organization.service';
import {
  OrganizationFieldResolver,
  OrganizationMutationResolver,
  OrganizationQueryResolver,
} from './resolvers';

@Module({
  imports: [
    DatabaseModule,
    UserModule,
    MembershipModule,
    ProjectModule,
    AuthModule,
  ],
  providers: [
    OrganizationService,
    OrganizationQueryResolver,
    OrganizationMutationResolver,
    OrganizationFieldResolver,
    OrganizationMapper,
  ],
})
export class OrganizationModule {}

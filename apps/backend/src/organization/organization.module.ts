import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { MembershipModule } from '../membership/membership.module';
import { OpportunityModule } from '../opportunity/opportunity.module';
import { UserModule } from '../user/user.module';
import { OrganizationMapper } from './mappers/organization.mapper';
import { OrganizationService } from './organization.service';
import {
  OrganizationFieldResolver,
  OrganizationMutationResolver,
  OrganizationQueryResolver,
} from './resolvers';

@Module({
  imports: [DatabaseModule, UserModule, MembershipModule, OpportunityModule],
  providers: [
    OrganizationService,
    OrganizationQueryResolver,
    OrganizationMutationResolver,
    OrganizationFieldResolver,
    OrganizationMapper,
  ],
})
export class OrganizationModule {}

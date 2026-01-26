import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { MembershipModule } from '../membership/membership.module';
import { TaskModule } from '../task/task.module';
import { UserModule } from '../user/user.module';
import { OpportunityMapper } from './mappers/opportunity.mapper';
import { OpportunityService } from './opportunity.service';
import {
  OpportunityFieldResolver,
  OpportunityMutationResolver,
  OpportunityQueryResolver,
} from './resolvers';

@Module({
  imports: [DatabaseModule, UserModule, TaskModule, MembershipModule],
  providers: [
    OpportunityService,
    OpportunityMapper,
    OpportunityQueryResolver,
    OpportunityMutationResolver,
    OpportunityFieldResolver,
  ],
  exports: [OpportunityService],
})
export class OpportunityModule {}

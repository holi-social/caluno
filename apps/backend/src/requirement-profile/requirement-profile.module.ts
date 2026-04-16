import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { MembershipMapper } from '../membership/mappers/membership.mepper';
import { MembershipRequestMapper } from '../membership/mappers/membership-request.mepper';
import { UserModule } from '../user/user.module';
import { OrganizationUserProfileMapper } from './mappers/organization-user-profile.mapper';
import { RequirementMapper } from './mappers/requirement.mapper';
import { RequirementFulfillmentMapper } from './mappers/requirement-fulfillment.mapper';
import { RequirementProfileMapper } from './mappers/requirement-profile.mapper';
import { RequirementProfileSubmissionMapper } from './mappers/requirement-profile-submission.mapper';
import {
  RequirementFulfillmentFieldResolver,
  RequirementFulfillmentMutationResolver,
  RequirementFulfillmentQueryResolver,
  RequirementMutationResolver,
  RequirementProfileFieldResolver,
  RequirementProfileMutationResolver,
  RequirementProfileQueryResolver,
  RequirementProfileSubmissionFieldResolver,
  RequirementProfileSubmissionMutationResolver,
  RequirementProfileSubmissionQueryResolver,
  RequirementQueryResolver,
} from './resolvers';
import {
  RequirementProfileService,
  RequirementProfileSubmissionService,
  RequirementService,
} from './services';

@Module({
  imports: [DatabaseModule, UserModule],
  providers: [
    RequirementService,
    RequirementProfileService,
    RequirementProfileSubmissionService,
    RequirementProfileMapper,
    RequirementMapper,
    RequirementProfileSubmissionMapper,
    RequirementFulfillmentMapper,
    MembershipMapper,
    MembershipRequestMapper,
    OrganizationUserProfileMapper,
    RequirementProfileQueryResolver,
    RequirementProfileMutationResolver,
    RequirementProfileFieldResolver,
    RequirementQueryResolver,
    RequirementMutationResolver,
    RequirementProfileSubmissionQueryResolver,
    RequirementProfileSubmissionMutationResolver,
    RequirementProfileSubmissionFieldResolver,
    RequirementFulfillmentQueryResolver,
    RequirementFulfillmentMutationResolver,
    RequirementFulfillmentFieldResolver,
  ],
  exports: [
    RequirementService,
    RequirementProfileService,
    RequirementProfileSubmissionService,
  ],
})
export class RequirementProfileModule {}

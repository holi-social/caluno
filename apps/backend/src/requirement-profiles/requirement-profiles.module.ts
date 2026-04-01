import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { MembershipMapper } from '../membership/mappers/membership.mepper';
import { MembershipRequestMapper } from '../membership/mappers/membership-request.mepper';
import { UserModule } from '../user/user.module';
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
  RequirementFulfillmentService,
  RequirementProfileService,
  RequirementProfileSubmissionService,
  RequirementService,
} from './services';
import { OrganizationUserProfileMapper } from './mappers/organization-user-profile.mapper';
import { DocumentMapper } from './mappers/document.mapper';

@Module({
  imports: [DatabaseModule, UserModule],
  providers: [
    RequirementService,
    RequirementProfileService,
    RequirementProfileSubmissionService,
    RequirementFulfillmentService,
    RequirementProfileMapper,
    RequirementMapper,
    RequirementProfileSubmissionMapper,
    RequirementFulfillmentMapper,
    MembershipMapper,
    MembershipRequestMapper,
    OrganizationUserProfileMapper,
    DocumentMapper,
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
    RequirementFulfillmentService,
  ],
})
export class RequirementProfilesModule {}

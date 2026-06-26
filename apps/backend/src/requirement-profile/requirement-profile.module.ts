import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { MembershipMapper } from '../membership/mappers/membership.mepper';
import { MembershipRequestMapper } from '../membership/mappers/membership-request.mepper';
import { SharedModule } from '../shared/shared.module';
import { UserModule } from '../user/user.module';
import { FormBlockMapper } from './mappers/form-block.mapper';
import { FormBlockFieldMapper } from './mappers/form-block-field.mapper';
import { FormSubmissionMapper } from './mappers/form-submission.mapper';
import { FormSubmissionValueMapper } from './mappers/form-submission-value.mapper';
import { OrganizationUserProfileMapper } from './mappers/organization-user-profile.mapper';
import { RequirementMapper } from './mappers/requirement.mapper';
import { RequirementFormMapper } from './mappers/requirement-form.mapper';
import { RequirementFormBlockRefMapper } from './mappers/requirement-form-block-ref.mapper';
import { RequirementFulfillmentMapper } from './mappers/requirement-fulfillment.mapper';
import { RequirementProfileMapper } from './mappers/requirement-profile.mapper';
import { RequirementProfileSubmissionMapper } from './mappers/requirement-profile-submission.mapper';
import { UserProfileMapper } from './mappers/user-profile.mapper';
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
import { DocumentUploadMutationResolver } from './resolvers/document-upload-mutation.resolver';
import { FormBlockFieldResolver } from './resolvers/form-block-field.resolver';
import { FormBlockMutationResolver } from './resolvers/form-block-mutation.resolver';
import { FormBlockQueryResolver } from './resolvers/form-block-query.resolver';
import { FormSubmissionFieldResolver } from './resolvers/form-submission-field.resolver';
import { FormSubmissionQueryResolver } from './resolvers/form-submission-query.resolver';
import { RequirementFormBlockRefFieldResolver } from './resolvers/requirement-form-block-ref-field.resolver';
import { RequirementFormFieldResolver } from './resolvers/requirement-form-field.resolver';
import { RequirementFormMutationResolver } from './resolvers/requirement-form-mutation.resolver';
import { RequirementFormQueryResolver } from './resolvers/requirement-form-query.resolver';
import { UserProfileMutationResolver } from './resolvers/user-profile-mutation.resolver';
import { UserProfileQueryResolver } from './resolvers/user-profile-query.resolver';
import {
  DocumentUploadService,
  FormBlockService,
  FormSubmissionService,
  RequirementFormService,
  RequirementProfileService,
  RequirementProfileSubmissionService,
  RequirementService,
  UserProfileService,
} from './services';

@Module({
  imports: [DatabaseModule, SharedModule, UserModule],
  providers: [
    RequirementService,
    RequirementProfileService,
    RequirementProfileSubmissionService,
    FormBlockService,
    RequirementFormService,
    FormSubmissionService,
    UserProfileService,
    DocumentUploadService,
    RequirementProfileMapper,
    RequirementMapper,
    RequirementProfileSubmissionMapper,
    RequirementFulfillmentMapper,
    MembershipMapper,
    MembershipRequestMapper,
    OrganizationUserProfileMapper,
    FormBlockMapper,
    FormBlockFieldMapper,
    RequirementFormMapper,
    RequirementFormBlockRefMapper,
    FormSubmissionMapper,
    FormSubmissionValueMapper,
    UserProfileMapper,
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
    FormBlockQueryResolver,
    FormBlockMutationResolver,
    FormBlockFieldResolver,
    RequirementFormQueryResolver,
    RequirementFormMutationResolver,
    RequirementFormFieldResolver,
    RequirementFormBlockRefFieldResolver,
    FormSubmissionQueryResolver,
    FormSubmissionFieldResolver,
    UserProfileQueryResolver,
    UserProfileMutationResolver,
    DocumentUploadMutationResolver,
  ],
  exports: [
    RequirementService,
    RequirementProfileService,
    RequirementProfileSubmissionService,
    FormBlockService,
    RequirementFormService,
    FormSubmissionService,
    UserProfileService,
    DocumentUploadService,
  ],
})
export class RequirementProfileModule {}

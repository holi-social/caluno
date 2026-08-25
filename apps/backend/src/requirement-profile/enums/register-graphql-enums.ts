import { registerEnumType } from '@nestjs/graphql';
import {
  FieldType,
  FormSubmissionStatus,
  OrganizationUserProfileStatus,
  RequiredFormTargetType,
  RequirementFulfillmentStatus,
  RequirementProfileSubmissionStatus,
  RequirementType,
} from './index';

registerEnumType(OrganizationUserProfileStatus, {
  name: 'OrganizationUserProfileStatus',
});

registerEnumType(RequirementType, {
  name: 'RequirementType',
});

registerEnumType(RequirementProfileSubmissionStatus, {
  name: 'RequirementProfileSubmissionStatus',
});

registerEnumType(RequirementFulfillmentStatus, {
  name: 'RequirementFulfillmentStatus',
});

registerEnumType(FieldType, {
  name: 'FieldType',
});

registerEnumType(FormSubmissionStatus, {
  name: 'FormSubmissionStatus',
});

registerEnumType(RequiredFormTargetType, {
  name: 'RequiredFormTargetType',
});

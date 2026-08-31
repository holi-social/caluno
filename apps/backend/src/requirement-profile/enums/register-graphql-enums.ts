import { registerEnumType } from '@nestjs/graphql';
import {
  FieldType,
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

registerEnumType(RequiredFormTargetType, {
  name: 'RequiredFormTargetType',
});

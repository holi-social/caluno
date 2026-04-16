import { registerEnumType } from '@nestjs/graphql';

export enum RequirementType {
  DOCUMENT = 'DOCUMENT',
  CHECK = 'CHECK',
  DATE = 'DATE',
  TEXT = 'TEXT',
}

export enum RequirementProfileSubmissionStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum RequirementFulfillmentStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum OrganizationUserProfileStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  BLACKLISTED = 'BLACKLISTED',
  INACTIVE = 'INACTIVE',
}

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

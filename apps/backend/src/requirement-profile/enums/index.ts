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

export enum FieldType {
  TEXT = 'TEXT',
  TEXTAREA = 'TEXTAREA',
  NUMBERS = 'NUMBERS',
  DATE = 'DATE',
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  MULTI_CHOICE = 'MULTI_CHOICE',
  DOCUMENT_ACKNOWLEDGEMENT = 'DOCUMENT_ACKNOWLEDGEMENT',
  STATIC_TEXT = 'STATIC_TEXT',
  CHECKBOX = 'CHECKBOX',
  NAME = 'NAME',
  LASTNAME = 'LASTNAME',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  ZIP = 'ZIP',
  IBAN = 'IBAN',
}

export enum FormSubmissionStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
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

registerEnumType(FieldType, {
  name: 'FieldType',
});

registerEnumType(FormSubmissionStatus, {
  name: 'FormSubmissionStatus',
});

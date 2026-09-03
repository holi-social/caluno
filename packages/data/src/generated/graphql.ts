import { GraphQLClient, RequestOptions } from 'graphql-request';
import { gql } from 'graphql-request';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
type GraphQLClientRequestHeaders = RequestOptions['requestHeaders'];
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** A date-time string at UTC, such as 2019-12-03T09:54:33Z, compliant with the date-time format. */
  DateTime: { input: string; output: string; }
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: { input: Record<string, unknown>; output: Record<string, unknown>; }
};

export type AddTimeEntryInput = {
  endedAt?: InputMaybe<Scalars['DateTime']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  shiftInstanceId?: InputMaybe<Scalars['String']['input']>;
  startedAt: Scalars['DateTime']['input'];
  volunteerId: Scalars['String']['input'];
};

export type BundleDownloadStatus = {
  __typename?: 'BundleDownloadStatus';
  downloadedAt: Scalars['DateTime']['output'];
  downloadedByUser?: Maybe<User>;
  reimbursementType: ReimbursementType;
  volunteer: User;
};

export type CheckInContext = {
  __typename?: 'CheckInContext';
  eligibleOrganizationUnits: Array<OrganizationUnit>;
  openTimeEntries: Array<TimeEntry>;
  volunteer: User;
};

export type CheckInReadiness = {
  __typename?: 'CheckInReadiness';
  hasOpenTimeEntry: Scalars['Boolean']['output'];
  isMember: Scalars['Boolean']['output'];
  isParticipating: Scalars['Boolean']['output'];
  openMembershipRequestId?: Maybe<Scalars['ID']['output']>;
  shiftInviteStatus?: Maybe<ShiftInviteStatus>;
};

export type CloseTimeEntryInput = {
  endedAt: Scalars['DateTime']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
};

export type Contract = {
  __typename?: 'Contract';
  contractStatus: ContractStatus;
  createdAt: Scalars['DateTime']['output'];
  declineReason?: Maybe<Scalars['String']['output']>;
  declinedAt?: Maybe<Scalars['DateTime']['output']>;
  declinedAtSigneeType?: Maybe<SigneeType>;
  declinedByUser?: Maybe<User>;
  documentTemplate: DocumentTemplate;
  downloadUrl?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isNonCompliant: Scalars['Boolean']['output'];
  missingOrgProfileFields: Array<Scalars['String']['output']>;
  missingProfileFields: Array<Scalars['String']['output']>;
  periodEnd: Scalars['DateTime']['output'];
  periodStart: Scalars['DateTime']['output'];
  reimbursementType: ReimbursementType;
  renewDate?: Maybe<Scalars['DateTime']['output']>;
  resolvedBody: Scalars['JSON']['output'];
  signatures: Array<ContractSignature>;
  statusChanges: Array<ContractStatusChange>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  volunteer: User;
};

export type ContractFilterInput = {
  periodEnd?: InputMaybe<Scalars['DateTime']['input']>;
  periodStart?: InputMaybe<Scalars['DateTime']['input']>;
  reimbursementTypeId?: InputMaybe<Scalars['ID']['input']>;
  status?: InputMaybe<ContractStatus>;
  volunteerId?: InputMaybe<Scalars['ID']['input']>;
};

export type ContractSignature = {
  __typename?: 'ContractSignature';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  order: Scalars['Int']['output'];
  requiredPermission?: Maybe<Permission>;
  signedAt?: Maybe<Scalars['DateTime']['output']>;
  signedByUser?: Maybe<User>;
  signeeType: SigneeType;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export enum ContractStatus {
  Active = 'ACTIVE',
  AwaitingNgoSignature = 'AWAITING_NGO_SIGNATURE',
  AwaitingVolunteerSignature = 'AWAITING_VOLUNTEER_SIGNATURE',
  Declined = 'DECLINED',
  Expired = 'EXPIRED'
}

export type ContractStatusChange = {
  __typename?: 'ContractStatusChange';
  actorUser?: Maybe<User>;
  id: Scalars['ID']['output'];
  occurredAt: Scalars['DateTime']['output'];
  type: DocumentStatusChange;
};

export type CreateContractInput = {
  organizationUnitId?: InputMaybe<Scalars['ID']['input']>;
  periodEnd: Scalars['DateTime']['input'];
  periodStart: Scalars['DateTime']['input'];
  reimbursementTypeId: Scalars['ID']['input'];
  volunteerId: Scalars['ID']['input'];
};

export type CreateDocumentTemplateInput = {
  body: Scalars['JSON']['input'];
  invoiceNumberFormat?: InputMaybe<Scalars['String']['input']>;
  kind: DocumentKind;
  organizationUnitId?: InputMaybe<Scalars['ID']['input']>;
  reimbursementTypeId: Scalars['ID']['input'];
  renewalCadence?: InputMaybe<RenewalCadence>;
  signees: Array<CreateTemplateSigneeInput>;
};

export type CreateEventInput = {
  coverFileId?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  endsAt: Scalars['DateTime']['input'];
  invitedMemberIds?: InputMaybe<Array<Scalars['String']['input']>>;
  location?: InputMaybe<Scalars['String']['input']>;
  logoFileId?: InputMaybe<Scalars['String']['input']>;
  requiredFormIds?: InputMaybe<Array<Scalars['String']['input']>>;
  startsAt: Scalars['DateTime']['input'];
  title: Scalars['String']['input'];
};

export type CreateFormBlockFieldInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  documentFileId?: InputMaybe<Scalars['String']['input']>;
  documentLabel?: InputMaybe<Scalars['String']['input']>;
  fieldOrder?: InputMaybe<Scalars['Float']['input']>;
  label: Scalars['String']['input'];
  lockType?: InputMaybe<Scalars['Boolean']['input']>;
  minAge?: InputMaybe<Scalars['Float']['input']>;
  options?: InputMaybe<Array<SelectOptionInput>>;
  placeholder?: InputMaybe<Scalars['String']['input']>;
  required?: InputMaybe<Scalars['Boolean']['input']>;
  systemKey?: InputMaybe<Scalars['String']['input']>;
  type: FieldType;
};

export type CreateFormBlockInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  fields?: InputMaybe<Array<CreateFormBlockFieldInput>>;
  icon?: InputMaybe<Scalars['String']['input']>;
  organizationId: Scalars['String']['input'];
  required?: InputMaybe<Scalars['Boolean']['input']>;
  title: Scalars['String']['input'];
};

export type CreateInvoiceInput = {
  organizationUnitId?: InputMaybe<Scalars['ID']['input']>;
  periodEnd: Scalars['DateTime']['input'];
  periodStart: Scalars['DateTime']['input'];
  reimbursementTypeId: Scalars['ID']['input'];
  timeEntryIds: Array<Scalars['ID']['input']>;
  volunteerId: Scalars['ID']['input'];
};

export type CreateOrganizationInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  city?: InputMaybe<Scalars['String']['input']>;
  contactEmail?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  logoFileId?: InputMaybe<Scalars['String']['input']>;
  logoUrl?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  parentId?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  websiteUrl?: InputMaybe<Scalars['String']['input']>;
  zipCode?: InputMaybe<Scalars['String']['input']>;
};

export type CreateOrganizationUnitInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  city?: InputMaybe<Scalars['String']['input']>;
  contactEmail?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  legalRep?: InputMaybe<Scalars['String']['input']>;
  logoFileId?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  organizationId: Scalars['String']['input'];
  parentId: Scalars['String']['input'];
  phone?: InputMaybe<Scalars['String']['input']>;
  typeId: Scalars['String']['input'];
  websiteUrl?: InputMaybe<Scalars['String']['input']>;
  zipCode?: InputMaybe<Scalars['String']['input']>;
};

export type CreateRequirementFormInput = {
  blockRefs?: InputMaybe<Array<FormBlockRefInput>>;
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  organizationId: Scalars['String']['input'];
  settings?: InputMaybe<FormSettingsInput>;
};

export type CreateRequirementInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  mandatory?: Scalars['Boolean']['input'];
  name: Scalars['String']['input'];
  organizationId: Scalars['String']['input'];
  type: RequirementType;
};

export type CreateRequirementProfileInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  organizationId: Scalars['String']['input'];
  requirementIds?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type CreateRequirementProfileSubmissionInput = {
  fulfillments?: InputMaybe<Array<CreateRequirementSubmissionFulfillmentInput>>;
  membershipId?: InputMaybe<Scalars['String']['input']>;
  membershipRequestId?: InputMaybe<Scalars['String']['input']>;
  profileId: Scalars['String']['input'];
};

export type CreateRequirementSubmissionFulfillmentInput = {
  checked?: InputMaybe<Scalars['Boolean']['input']>;
  date?: InputMaybe<Scalars['DateTime']['input']>;
  fileId?: InputMaybe<Scalars['String']['input']>;
  requirementId: Scalars['String']['input'];
  text?: InputMaybe<Scalars['String']['input']>;
};

export type CreateRoleInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  permissionIds: Array<Scalars['String']['input']>;
};

export type CreateShiftInput = {
  endsAt: Scalars['DateTime']['input'];
  eventId?: InputMaybe<Scalars['ID']['input']>;
  imageFileId?: InputMaybe<Scalars['String']['input']>;
  instructions?: InputMaybe<Scalars['String']['input']>;
  invitedMemberIds?: InputMaybe<Array<Scalars['String']['input']>>;
  location?: InputMaybe<Scalars['String']['input']>;
  maxVolunteers?: InputMaybe<Scalars['Int']['input']>;
  minVolunteers?: InputMaybe<Scalars['Int']['input']>;
  reimbursementTypeId?: InputMaybe<Scalars['ID']['input']>;
  requiredFormIds?: InputMaybe<Array<Scalars['String']['input']>>;
  rrule?: InputMaybe<Scalars['String']['input']>;
  startsAt: Scalars['DateTime']['input'];
  title: Scalars['String']['input'];
  visibility: ShiftVisibility;
};

export type CreateTemplateSigneeInput = {
  order: Scalars['Int']['input'];
  requiredPermissionId?: InputMaybe<Scalars['ID']['input']>;
  signeeType: SigneeType;
};

export enum DocumentKind {
  Contract = 'CONTRACT',
  Invoice = 'INVOICE'
}

export enum DocumentStatusChange {
  Activated = 'ACTIVATED',
  Countersigned = 'COUNTERSIGNED',
  Created = 'CREATED',
  Declined = 'DECLINED',
  Expired = 'EXPIRED',
  Signed = 'SIGNED'
}

export type DocumentTemplate = {
  __typename?: 'DocumentTemplate';
  body: Scalars['JSON']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  invoiceNumberFormat?: Maybe<Scalars['String']['output']>;
  isDeleted: Scalars['Boolean']['output'];
  kind: DocumentKind;
  lastEditedAt?: Maybe<Scalars['DateTime']['output']>;
  lastEditedByUser?: Maybe<User>;
  organization: Organization;
  organizationUnit?: Maybe<OrganizationUnit>;
  reimbursementType: ReimbursementType;
  renewalCadence?: Maybe<RenewalCadence>;
  signees: Array<TemplateSignee>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type EffectiveRate = {
  __typename?: 'EffectiveRate';
  hourlyRateCents: Scalars['Int']['output'];
  isOverride: Scalars['Boolean']['output'];
  organizationUnitId?: Maybe<Scalars['ID']['output']>;
  reimbursementType: ReimbursementType;
};

export type Event = {
  __typename?: 'Event';
  coverImageUrl?: Maybe<Scalars['String']['output']>;
  coverUrl?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  endsAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  isDeleted: Scalars['Boolean']['output'];
  location?: Maybe<Scalars['String']['output']>;
  logoUrl?: Maybe<Scalars['String']['output']>;
  myInvitedAt?: Maybe<Scalars['DateTime']['output']>;
  myJoinStatus: JoinStatus;
  organizationUnit?: Maybe<EventOrganizationUnit>;
  organizationUnitId: Scalars['ID']['output'];
  organizer?: Maybe<User>;
  requiredForms: Array<RequiredFormRef>;
  requiredFormsCount: Scalars['Int']['output'];
  shifts: Array<Shift>;
  shiftsCount: Scalars['Int']['output'];
  signedUpCount: Scalars['Int']['output'];
  slug: Scalars['String']['output'];
  startsAt: Scalars['DateTime']['output'];
  title: Scalars['String']['output'];
};

export type EventInvite = {
  __typename?: 'EventInvite';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  status: EventInviteStatus;
  updatedAt: Scalars['DateTime']['output'];
  user: User;
  userId: Scalars['String']['output'];
};

export enum EventInviteStatus {
  Accepted = 'ACCEPTED',
  AdminRejected = 'ADMIN_REJECTED',
  Cancelled = 'CANCELLED',
  Invited = 'INVITED',
  SelfJoined = 'SELF_JOINED',
  VolunteerRejected = 'VOLUNTEER_REJECTED'
}

export type EventOrganizationUnit = {
  __typename?: 'EventOrganizationUnit';
  id: Scalars['ID']['output'];
  logoUrl?: Maybe<Scalars['String']['output']>;
  myMembershipState: JoinStatus;
  name: Scalars['String']['output'];
  requiredForms: Array<RequiredFormRef>;
  slug: Scalars['String']['output'];
};

export type EventPaginatedResponse = {
  __typename?: 'EventPaginatedResponse';
  items: Array<Event>;
  pagination: PaginationInfo;
};

export enum FieldType {
  Checkbox = 'CHECKBOX',
  Date = 'DATE',
  DocumentAcknowledgement = 'DOCUMENT_ACKNOWLEDGEMENT',
  Email = 'EMAIL',
  Iban = 'IBAN',
  Lastname = 'LASTNAME',
  MultiChoice = 'MULTI_CHOICE',
  Name = 'NAME',
  Numbers = 'NUMBERS',
  Phone = 'PHONE',
  SingleChoice = 'SINGLE_CHOICE',
  StaticText = 'STATIC_TEXT',
  Text = 'TEXT',
  Textarea = 'TEXTAREA',
  Zip = 'ZIP'
}

export type FormBlock = {
  __typename?: 'FormBlock';
  createdAt: Scalars['DateTime']['output'];
  createdBy: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  fields?: Maybe<Array<FormBlockField>>;
  icon?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isEditable: Scalars['Boolean']['output'];
  organizationId: Scalars['String']['output'];
  required: Scalars['Boolean']['output'];
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  updatedBy: Scalars['String']['output'];
};

export type FormBlockField = {
  __typename?: 'FormBlockField';
  blockId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  documentDownloadUrl?: Maybe<Scalars['String']['output']>;
  documentFileId?: Maybe<Scalars['String']['output']>;
  documentFilename?: Maybe<Scalars['String']['output']>;
  documentLabel?: Maybe<Scalars['String']['output']>;
  fieldOrder: Scalars['Float']['output'];
  id: Scalars['ID']['output'];
  label: Scalars['String']['output'];
  lockType: Scalars['Boolean']['output'];
  minAge?: Maybe<Scalars['Float']['output']>;
  options?: Maybe<Array<SelectOption>>;
  placeholder?: Maybe<Scalars['String']['output']>;
  required: Scalars['Boolean']['output'];
  systemKey?: Maybe<Scalars['String']['output']>;
  type: FieldType;
  updatedAt: Scalars['DateTime']['output'];
};

export type FormBlockPaginatedResponse = {
  __typename?: 'FormBlockPaginatedResponse';
  items: Array<FormBlock>;
  pagination: PaginationInfo;
};

export type FormBlockRefInput = {
  blockId: Scalars['String']['input'];
  order?: InputMaybe<Scalars['Float']['input']>;
  required?: InputMaybe<Scalars['Boolean']['input']>;
};

export type FormFieldValueInput = {
  blockId: Scalars['String']['input'];
  fieldId: Scalars['String']['input'];
  value: Scalars['String']['input'];
};

export type FormSettings = {
  __typename?: 'FormSettings';
  allowEmbed?: Maybe<Scalars['Boolean']['output']>;
  submitButtonLabel?: Maybe<Scalars['String']['output']>;
  successMessage?: Maybe<Scalars['String']['output']>;
  successTitle?: Maybe<Scalars['String']['output']>;
};

export type FormSettingsInput = {
  allowEmbed?: InputMaybe<Scalars['Boolean']['input']>;
  submitButtonLabel?: InputMaybe<Scalars['String']['input']>;
  successMessage?: InputMaybe<Scalars['String']['input']>;
  successTitle?: InputMaybe<Scalars['String']['input']>;
};

export type FormSubmission = {
  __typename?: 'FormSubmission';
  createdAt: Scalars['DateTime']['output'];
  form?: Maybe<RequirementForm>;
  formId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  submittedAt: Scalars['DateTime']['output'];
  updatedAt: Scalars['DateTime']['output'];
  user?: Maybe<User>;
  userId: Scalars['String']['output'];
  values?: Maybe<Array<FormSubmissionValue>>;
};

export type FormSubmissionPaginatedResponse = {
  __typename?: 'FormSubmissionPaginatedResponse';
  items: Array<FormSubmission>;
  pagination: PaginationInfo;
};

export type FormSubmissionValue = {
  __typename?: 'FormSubmissionValue';
  blockId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  fieldId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  submissionId: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  value: Scalars['String']['output'];
};

export type Invoice = {
  __typename?: 'Invoice';
  createdAt: Scalars['DateTime']['output'];
  declineReason?: Maybe<Scalars['String']['output']>;
  declinedAt?: Maybe<Scalars['DateTime']['output']>;
  declinedAtSigneeType?: Maybe<SigneeType>;
  declinedByUser?: Maybe<User>;
  documentTemplate: DocumentTemplate;
  downloadUrl?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  invoiceStatus: InvoiceStatus;
  invoiceTimeEntries: Array<InvoiceTimeEntry>;
  isNonCompliant: Scalars['Boolean']['output'];
  missingOrgProfileFields: Array<Scalars['String']['output']>;
  missingProfileFields: Array<Scalars['String']['output']>;
  paidAt?: Maybe<Scalars['DateTime']['output']>;
  paidByUser?: Maybe<User>;
  periodEnd: Scalars['DateTime']['output'];
  periodStart: Scalars['DateTime']['output'];
  reimbursementType: ReimbursementType;
  resolvedBody: Scalars['JSON']['output'];
  signatures: Array<InvoiceSignature>;
  statusChanges: Array<InvoiceStatusChange>;
  totalAmountCents: Scalars['Int']['output'];
  totalHours: Scalars['Float']['output'];
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  volunteer: User;
};

export type InvoiceFilterInput = {
  periodEnd?: InputMaybe<Scalars['DateTime']['input']>;
  periodStart?: InputMaybe<Scalars['DateTime']['input']>;
  reimbursementTypeId?: InputMaybe<Scalars['ID']['input']>;
  status?: InputMaybe<InvoiceStatus>;
  volunteerId?: InputMaybe<Scalars['ID']['input']>;
};

export type InvoiceSignature = {
  __typename?: 'InvoiceSignature';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  order: Scalars['Int']['output'];
  requiredPermission?: Maybe<Permission>;
  signedAt?: Maybe<Scalars['DateTime']['output']>;
  signedByUser?: Maybe<User>;
  signeeType: SigneeType;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export enum InvoiceStatus {
  AwaitingSupervisorSignature = 'AWAITING_SUPERVISOR_SIGNATURE',
  AwaitingVolunteerSignature = 'AWAITING_VOLUNTEER_SIGNATURE',
  Declined = 'DECLINED',
  Ready = 'READY'
}

export type InvoiceStatusChange = {
  __typename?: 'InvoiceStatusChange';
  actorUser?: Maybe<User>;
  id: Scalars['ID']['output'];
  occurredAt: Scalars['DateTime']['output'];
  type: DocumentStatusChange;
};

export type InvoiceTimeEntry = {
  __typename?: 'InvoiceTimeEntry';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  timeEntry: TimeEntry;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type JoinEventResult = {
  __typename?: 'JoinEventResult';
  event: Event;
  membershipRequestId?: Maybe<Scalars['ID']['output']>;
  requiredForms?: Maybe<Array<RequiredFormWithStatus>>;
  requirementProfile?: Maybe<RequirementProfile>;
  requirementStatuses?: Maybe<Array<UserRequirementStatus>>;
  status: JoinStatus;
};

export type JoinOrganizationResult = {
  __typename?: 'JoinOrganizationResult';
  membershipRequestId?: Maybe<Scalars['ID']['output']>;
  requiredForms?: Maybe<Array<RequiredFormWithStatus>>;
  requirementProfile?: Maybe<RequirementProfile>;
  requirementStatuses?: Maybe<Array<UserRequirementStatus>>;
  status: JoinStatus;
};

export type JoinShiftInstanceResult = {
  __typename?: 'JoinShiftInstanceResult';
  membershipRequestId?: Maybe<Scalars['ID']['output']>;
  requiredForms?: Maybe<Array<RequiredFormWithStatus>>;
  requirementProfile?: Maybe<RequirementProfile>;
  requirementStatuses?: Maybe<Array<UserRequirementStatus>>;
  shiftInstance: ShiftInstance;
  status: JoinStatus;
};

export enum JoinStatus {
  Joined = 'JOINED',
  None = 'NONE',
  Pending = 'PENDING',
  Rejected = 'REJECTED',
  RequirementsNeeded = 'REQUIREMENTS_NEEDED'
}

export type ManualBaseline = {
  __typename?: 'ManualBaseline';
  amountCents: Scalars['Int']['output'];
  reimbursementType: ReimbursementType;
  updatedAt: Scalars['DateTime']['output'];
  updatedByUser?: Maybe<User>;
  volunteer: User;
  year: Scalars['Int']['output'];
};

export type Membership = {
  __typename?: 'Membership';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  organizationUnit: OrganizationUnit;
  roles: Array<Role>;
  user: User;
};

export type MembershipRequest = {
  __typename?: 'MembershipRequest';
  contact?: Maybe<User>;
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  organizationUnit: OrganizationUnit;
  rejectionReason?: Maybe<Scalars['String']['output']>;
  reviewedAt?: Maybe<Scalars['DateTime']['output']>;
  reviewedBy?: Maybe<User>;
  status: MembershipRequestStatus;
  updatedAt: Scalars['DateTime']['output'];
  user: User;
};

export type MembershipRequestPaginatedResponse = {
  __typename?: 'MembershipRequestPaginatedResponse';
  items: Array<MembershipRequest>;
  pagination: PaginationInfo;
};

export enum MembershipRequestStatus {
  Accepted = 'ACCEPTED',
  Cancelled = 'CANCELLED',
  Pending = 'PENDING',
  Rejected = 'REJECTED'
}

export type Mutation = {
  __typename?: 'Mutation';
  addTimeEntry: TimeEntry;
  approveMembershipRequest: MembershipRequest;
  cancelMembershipRequest: MembershipRequest;
  checkIn: TimeEntry;
  checkInApproveMembershipRequest: MembershipRequest;
  checkInInviteToOrganization: Scalars['Boolean']['output'];
  checkInInviteToShiftInstance: ShiftInstance;
  checkInVolunteer: TimeEntry;
  checkOut: TimeEntry;
  checkOutVolunteer: TimeEntry;
  closeTimeEntry: TimeEntry;
  createContract: Contract;
  createDocumentTemplate: DocumentTemplate;
  createEvent: Event;
  createFormBlock: FormBlock;
  createFormBlockField: FormBlock;
  createInvoice: Invoice;
  createOrganization: Organization;
  createOrganizationUnit: OrganizationUnit;
  createRequirement: Requirement;
  createRequirementForm: RequirementForm;
  createRequirementProfile: RequirementProfile;
  createRequirementProfileSubmission: RequirementProfileSubmission;
  createRole: Role;
  createShift: Shift;
  declineContract: Contract;
  declineInvoice: Invoice;
  deleteDocumentTemplate: Scalars['Boolean']['output'];
  deleteEvent: Event;
  deleteFormBlock: FormBlock;
  deleteFormBlockField: FormBlock;
  deleteOrganizationUnit: OrganizationUnit;
  deleteRequirement: Requirement;
  deleteRequirementForm: RequirementForm;
  deleteRequirementFulfillment: RequirementFulfillment;
  deleteRequirementProfile: RequirementProfile;
  deleteRequirementProfileSubmission: RequirementProfileSubmission;
  deleteRole: Role;
  deleteShift: Shift;
  deleteShiftInstance: ShiftInstance;
  deleteTimeEntry: TimeEntry;
  inviteMembersToEvent: Event;
  joinEvent: JoinEventResult;
  joinOrganization: JoinOrganizationResult;
  joinShiftInstance: JoinShiftInstanceResult;
  leaveMembership: Membership;
  recordBundleDownload: BundleDownloadStatus;
  regenerateFormShareToken: RequirementForm;
  rejectMembershipRequest: MembershipRequest;
  removeMembership: Membership;
  removeMembershipRequest: MembershipRequest;
  setEventRequiredForms: Array<RequiredFormRef>;
  setManualBaseline: ManualBaseline;
  setReimbursementRate: ReimbursementRate;
  setRequiredForms: Array<RequiredFormRef>;
  setShiftInstanceRequiredForms: Array<RequiredFormRef>;
  setShiftRequiredForms: Array<RequiredFormRef>;
  signContract: Contract;
  signInvoice: Invoice;
  submitForm: FormSubmission;
  submitRequiredForm: FormSubmission;
  updateDocumentTemplate: DocumentTemplate;
  updateEvent: Event;
  updateEventInviteStatus: EventInvite;
  updateFormBlock: FormBlock;
  updateFormBlockField: FormBlock;
  updateMembersForShiftInstance: ShiftInstance;
  updateMembershipRoles: Membership;
  updateMyImage: User;
  updateMyLocale: User;
  updateMyUserProfile: UserProfile;
  updateOrganization: Organization;
  updateOrganizationUnit: OrganizationUnit;
  updateRequirement: Requirement;
  updateRequirementForm: RequirementForm;
  updateRequirementFulfillment: RequirementFulfillment;
  updateRequirementProfile: RequirementProfile;
  updateRequirementProfileSubmission: RequirementProfileSubmission;
  updateRole: Role;
  updateShift: Shift;
  updateShiftInstance: ShiftInstance;
  updateShiftInstanceInviteStatus: ShiftInstanceInvite;
  updateShiftInviteStatus: ShiftInvite;
  updateTimeEntry: TimeEntry;
};


export type MutationAddTimeEntryArgs = {
  input: AddTimeEntryInput;
};


export type MutationApproveMembershipRequestArgs = {
  id: Scalars['ID']['input'];
  organizationUnitId: Scalars['ID']['input'];
};


export type MutationCancelMembershipRequestArgs = {
  id: Scalars['ID']['input'];
  organizationUnitId: Scalars['ID']['input'];
};


export type MutationCheckInArgs = {
  shiftInstanceId: Scalars['ID']['input'];
};


export type MutationCheckInApproveMembershipRequestArgs = {
  requestId: Scalars['ID']['input'];
};


export type MutationCheckInInviteToOrganizationArgs = {
  volunteerId: Scalars['ID']['input'];
};


export type MutationCheckInInviteToShiftInstanceArgs = {
  shiftInstanceId: Scalars['ID']['input'];
  volunteerId: Scalars['ID']['input'];
};


export type MutationCheckInVolunteerArgs = {
  shiftInstanceId?: InputMaybe<Scalars['ID']['input']>;
  volunteerId: Scalars['ID']['input'];
};


export type MutationCheckOutArgs = {
  shiftInstanceId: Scalars['ID']['input'];
};


export type MutationCheckOutVolunteerArgs = {
  timeEntryId: Scalars['ID']['input'];
};


export type MutationCloseTimeEntryArgs = {
  id: Scalars['ID']['input'];
  input: CloseTimeEntryInput;
};


export type MutationCreateContractArgs = {
  input: CreateContractInput;
};


export type MutationCreateDocumentTemplateArgs = {
  input: CreateDocumentTemplateInput;
};


export type MutationCreateEventArgs = {
  input: CreateEventInput;
};


export type MutationCreateFormBlockArgs = {
  input: CreateFormBlockInput;
};


export type MutationCreateFormBlockFieldArgs = {
  blockId: Scalars['String']['input'];
  input: CreateFormBlockFieldInput;
};


export type MutationCreateInvoiceArgs = {
  input: CreateInvoiceInput;
};


export type MutationCreateOrganizationArgs = {
  input: CreateOrganizationInput;
};


export type MutationCreateOrganizationUnitArgs = {
  input: CreateOrganizationUnitInput;
};


export type MutationCreateRequirementArgs = {
  input: CreateRequirementInput;
};


export type MutationCreateRequirementFormArgs = {
  input: CreateRequirementFormInput;
};


export type MutationCreateRequirementProfileArgs = {
  input: CreateRequirementProfileInput;
};


export type MutationCreateRequirementProfileSubmissionArgs = {
  input: CreateRequirementProfileSubmissionInput;
};


export type MutationCreateRoleArgs = {
  input: CreateRoleInput;
};


export type MutationCreateShiftArgs = {
  input: CreateShiftInput;
};


export type MutationDeclineContractArgs = {
  contractId: Scalars['ID']['input'];
  reason: Scalars['String']['input'];
};


export type MutationDeclineInvoiceArgs = {
  invoiceId: Scalars['ID']['input'];
  reason: Scalars['String']['input'];
};


export type MutationDeleteDocumentTemplateArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteEventArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteFormBlockArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteFormBlockFieldArgs = {
  fieldId: Scalars['String']['input'];
};


export type MutationDeleteOrganizationUnitArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteRequirementArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteRequirementFormArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteRequirementFulfillmentArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteRequirementProfileArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteRequirementProfileSubmissionArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteRoleArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteShiftArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteShiftInstanceArgs = {
  applyToAllFuture?: InputMaybe<Scalars['Boolean']['input']>;
  id: Scalars['String']['input'];
};


export type MutationDeleteTimeEntryArgs = {
  id: Scalars['ID']['input'];
};


export type MutationInviteMembersToEventArgs = {
  eventId: Scalars['ID']['input'];
  memberIds: Array<Scalars['String']['input']>;
};


export type MutationJoinEventArgs = {
  eventId: Scalars['ID']['input'];
};


export type MutationJoinOrganizationArgs = {
  organizationUnitId: Scalars['ID']['input'];
};


export type MutationJoinShiftInstanceArgs = {
  instanceId: Scalars['String']['input'];
};


export type MutationLeaveMembershipArgs = {
  id: Scalars['ID']['input'];
};


export type MutationRecordBundleDownloadArgs = {
  invoiceIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  reimbursementTypeId: Scalars['ID']['input'];
  volunteerId: Scalars['ID']['input'];
};


export type MutationRegenerateFormShareTokenArgs = {
  id: Scalars['String']['input'];
};


export type MutationRejectMembershipRequestArgs = {
  id: Scalars['ID']['input'];
  organizationUnitId: Scalars['ID']['input'];
  rejectionReason: Scalars['String']['input'];
};


export type MutationRemoveMembershipArgs = {
  id: Scalars['ID']['input'];
};


export type MutationRemoveMembershipRequestArgs = {
  id: Scalars['ID']['input'];
};


export type MutationSetEventRequiredFormsArgs = {
  eventId: Scalars['ID']['input'];
  formIds: Array<Scalars['String']['input']>;
};


export type MutationSetManualBaselineArgs = {
  amountCents: Scalars['Int']['input'];
  reimbursementTypeId: Scalars['ID']['input'];
  volunteerId: Scalars['ID']['input'];
  year: Scalars['Int']['input'];
};


export type MutationSetReimbursementRateArgs = {
  hourlyRateCents: Scalars['Int']['input'];
  organizationUnitId?: InputMaybe<Scalars['ID']['input']>;
  reimbursementTypeId: Scalars['ID']['input'];
};


export type MutationSetRequiredFormsArgs = {
  formIds: Array<Scalars['String']['input']>;
  organizationUnitId: Scalars['String']['input'];
};


export type MutationSetShiftInstanceRequiredFormsArgs = {
  formIds: Array<Scalars['String']['input']>;
  instanceId: Scalars['ID']['input'];
};


export type MutationSetShiftRequiredFormsArgs = {
  formIds: Array<Scalars['String']['input']>;
  shiftId: Scalars['ID']['input'];
};


export type MutationSignContractArgs = {
  contractId: Scalars['ID']['input'];
};


export type MutationSignInvoiceArgs = {
  invoiceId: Scalars['ID']['input'];
};


export type MutationSubmitFormArgs = {
  input: SubmitFormInput;
  organizationUnitId: Scalars['ID']['input'];
  token: Scalars['String']['input'];
};


export type MutationSubmitRequiredFormArgs = {
  formId: Scalars['String']['input'];
  input: SubmitFormInput;
  targetId: Scalars['String']['input'];
  targetType: RequiredFormTargetType;
};


export type MutationUpdateDocumentTemplateArgs = {
  id: Scalars['ID']['input'];
  input: UpdateDocumentTemplateInput;
};


export type MutationUpdateEventArgs = {
  id: Scalars['ID']['input'];
  input: UpdateEventInput;
};


export type MutationUpdateEventInviteStatusArgs = {
  eventId: Scalars['ID']['input'];
  status: EventInviteStatus;
  userId?: InputMaybe<Scalars['String']['input']>;
};


export type MutationUpdateFormBlockArgs = {
  id: Scalars['String']['input'];
  input: UpdateFormBlockInput;
};


export type MutationUpdateFormBlockFieldArgs = {
  fieldId: Scalars['String']['input'];
  input: UpdateFormBlockFieldInput;
};


export type MutationUpdateMembersForShiftInstanceArgs = {
  instanceId: Scalars['String']['input'];
  inviteToAllInstances?: InputMaybe<Scalars['Boolean']['input']>;
  memberIds: Array<Scalars['String']['input']>;
};


export type MutationUpdateMembershipRolesArgs = {
  membershipId: Scalars['ID']['input'];
  roleIds: Array<Scalars['ID']['input']>;
};


export type MutationUpdateMyImageArgs = {
  input: UpdateMyImageInput;
};


export type MutationUpdateMyLocaleArgs = {
  locale: Scalars['String']['input'];
};


export type MutationUpdateMyUserProfileArgs = {
  input: UpdateUserProfileInput;
};


export type MutationUpdateOrganizationArgs = {
  id: Scalars['ID']['input'];
  input: UpdateOrganizationInput;
};


export type MutationUpdateOrganizationUnitArgs = {
  id: Scalars['String']['input'];
  input: UpdateOrganizationUnitInput;
};


export type MutationUpdateRequirementArgs = {
  id: Scalars['String']['input'];
  input: UpdateRequirementInput;
};


export type MutationUpdateRequirementFormArgs = {
  id: Scalars['String']['input'];
  input: UpdateRequirementFormInput;
};


export type MutationUpdateRequirementFulfillmentArgs = {
  id: Scalars['String']['input'];
  input: UpdateRequirementFulfillmentInput;
};


export type MutationUpdateRequirementProfileArgs = {
  id: Scalars['String']['input'];
  input: UpdateRequirementProfileInput;
};


export type MutationUpdateRequirementProfileSubmissionArgs = {
  id: Scalars['String']['input'];
  input: UpdateRequirementProfileSubmissionInput;
};


export type MutationUpdateRoleArgs = {
  id: Scalars['ID']['input'];
  input: CreateRoleInput;
};


export type MutationUpdateShiftArgs = {
  id: Scalars['String']['input'];
  input: UpdateShiftInput;
};


export type MutationUpdateShiftInstanceArgs = {
  applyToAllFuture?: InputMaybe<Scalars['Boolean']['input']>;
  input: UpdateShiftInstanceInput;
  instanceId: Scalars['String']['input'];
};


export type MutationUpdateShiftInstanceInviteStatusArgs = {
  instanceId: Scalars['String']['input'];
  status: ShiftInviteStatus;
  userId?: InputMaybe<Scalars['String']['input']>;
};


export type MutationUpdateShiftInviteStatusArgs = {
  shiftId: Scalars['String']['input'];
  status: ShiftInviteStatus;
};


export type MutationUpdateTimeEntryArgs = {
  id: Scalars['ID']['input'];
  input: UpdateTimeEntryInput;
};

export type MyDocumentSummary = {
  __typename?: 'MyDocumentSummary';
  pending: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type MyDocumentsGroup = {
  __typename?: 'MyDocumentsGroup';
  contracts: Array<Contract>;
  invoices: Array<Invoice>;
  logoUrl?: Maybe<Scalars['String']['output']>;
  membershipId: Scalars['ID']['output'];
  organizationName: Scalars['String']['output'];
  organizationUnitId: Scalars['ID']['output'];
  organizationUnitName: Scalars['String']['output'];
};

export type Organization = {
  __typename?: 'Organization';
  accountingEnabled: Scalars['Boolean']['output'];
  address?: Maybe<Scalars['String']['output']>;
  city?: Maybe<Scalars['String']['output']>;
  contactEmail?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  logoUrl?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  phone?: Maybe<Scalars['String']['output']>;
  root: OrganizationUnit;
  slug: Scalars['String']['output'];
  units: Array<OrganizationUnit>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  websiteUrl?: Maybe<Scalars['String']['output']>;
  zipCode?: Maybe<Scalars['String']['output']>;
};

export type OrganizationPaginatedResponse = {
  __typename?: 'OrganizationPaginatedResponse';
  items: Array<Organization>;
  pagination: PaginationInfo;
};

export type OrganizationTree = {
  __typename?: 'OrganizationTree';
  root: Scalars['JSON']['output'];
};

export type OrganizationUnit = {
  __typename?: 'OrganizationUnit';
  address?: Maybe<Scalars['String']['output']>;
  children: Array<OrganizationUnit>;
  city?: Maybe<Scalars['String']['output']>;
  contactEmail?: Maybe<Scalars['String']['output']>;
  coverUrl?: Maybe<Scalars['String']['output']>;
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  legalRep?: Maybe<Scalars['String']['output']>;
  logoUrl?: Maybe<Scalars['String']['output']>;
  memberCount: Scalars['Int']['output'];
  myMembershipState: JoinStatus;
  name: Scalars['String']['output'];
  openShiftsCount: Scalars['Int']['output'];
  organization: Organization;
  organizationId: Scalars['String']['output'];
  parent?: Maybe<OrganizationUnit>;
  phone?: Maybe<Scalars['String']['output']>;
  requiredForms: Array<RequiredFormRef>;
  requiredMembershipRequirementProfile?: Maybe<RequirementProfile>;
  slug: Scalars['String']['output'];
  type: OrganizationUnitType;
  websiteUrl?: Maybe<Scalars['String']['output']>;
  zipCode?: Maybe<Scalars['String']['output']>;
};

export type OrganizationUnitPaginatedResponse = {
  __typename?: 'OrganizationUnitPaginatedResponse';
  items: Array<OrganizationUnit>;
  pagination: PaginationInfo;
};

export type OrganizationUnitType = {
  __typename?: 'OrganizationUnitType';
  description?: Maybe<Scalars['String']['output']>;
  icon: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type OrganizationUserProfile = {
  __typename?: 'OrganizationUserProfile';
  id: Scalars['ID']['output'];
  note?: Maybe<Scalars['String']['output']>;
  status: OrganizationUserProfileStatus;
  userProfileAccessApproved: Scalars['Boolean']['output'];
};

export enum OrganizationUserProfileStatus {
  Active = 'ACTIVE',
  Blacklisted = 'BLACKLISTED',
  Inactive = 'INACTIVE',
  Pending = 'PENDING'
}

export type PaginationInfo = {
  __typename?: 'PaginationInfo';
  hasMore: Scalars['Boolean']['output'];
  limit: Scalars['Int']['output'];
  offset: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type PendingSignee = {
  __typename?: 'PendingSignee';
  eligibleUserIds?: Maybe<Array<Scalars['String']['output']>>;
  permissionKey?: Maybe<Scalars['String']['output']>;
  signeeType: SigneeType;
  userId?: Maybe<Scalars['String']['output']>;
};

export type Permission = {
  __typename?: 'Permission';
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  key: PermissionKey;
};

export type PermissionGroup = {
  __typename?: 'PermissionGroup';
  items: Array<PermissionGroupItem>;
  key: Scalars['String']['output'];
  label: Scalars['String']['output'];
};

export type PermissionGroupItem = {
  __typename?: 'PermissionGroupItem';
  label: Scalars['String']['output'];
  permission: Permission;
};

export enum PermissionKey {
  AccountingManage = 'ACCOUNTING_MANAGE',
  CheckInManage = 'CHECK_IN_MANAGE',
  OrgEdit = 'ORG_EDIT',
  OrgView = 'ORG_VIEW',
  RequirementProfileEdit = 'REQUIREMENT_PROFILE_EDIT',
  RequirementProfileView = 'REQUIREMENT_PROFILE_VIEW',
  ShiftEdit = 'SHIFT_EDIT',
  ShiftView = 'SHIFT_VIEW',
  VolunteerEdit = 'VOLUNTEER_EDIT',
  VolunteerView = 'VOLUNTEER_VIEW'
}

export type Query = {
  __typename?: 'Query';
  activeDocumentTemplate: DocumentTemplate;
  activeShiftInstances: Array<ShiftInstance>;
  adminUserProfile?: Maybe<UserProfile>;
  adminVolunteerSubmission?: Maybe<FormSubmission>;
  availableEvents: EventPaginatedResponse;
  availableShiftInstances: ShiftInstancePaginatedResponse;
  bundleDownloadStatus?: Maybe<BundleDownloadStatus>;
  checkInContext?: Maybe<CheckInContext>;
  checkInReadiness: CheckInReadiness;
  checkInShiftInstances: Array<ShiftInstance>;
  checkInShifts: Array<Shift>;
  checkInVolunteerRequiredForms: Array<RequiredFormWithStatus>;
  contract: Contract;
  contracts: Array<Contract>;
  documentTemplate: DocumentTemplate;
  documentTemplates: Array<DocumentTemplate>;
  effectiveRates: Array<EffectiveRate>;
  eligibleTimeEntriesForInvoice: Array<TimeEntry>;
  event: Event;
  eventInvites: Array<EventInvite>;
  eventShifts: ShiftPaginatedResponse;
  events: EventPaginatedResponse;
  formBlock?: Maybe<FormBlock>;
  formBlocks: FormBlockPaginatedResponse;
  formSubmission?: Maybe<FormSubmission>;
  formSubmissionsByForm: FormSubmissionPaginatedResponse;
  formSubmissionsByMembershipRequest: Array<FormSubmission>;
  formSubmissionsForVolunteer: Array<FormSubmission>;
  invoice: Invoice;
  invoices: Array<Invoice>;
  isMemberOfUnitOrAncestor: Scalars['Boolean']['output'];
  manualBaseline?: Maybe<ManualBaseline>;
  me: User;
  members: Array<User>;
  membership?: Maybe<Membership>;
  membershipRequestCount: Scalars['Int']['output'];
  membershipRequests: MembershipRequestPaginatedResponse;
  memberships: Array<Membership>;
  myAdminstableOrganizationUnits: Array<OrganizationUnit>;
  myCheckInAdministrableOrganizationUnits: Array<OrganizationUnit>;
  myContracts: Array<Contract>;
  myDocumentSummary: MyDocumentSummary;
  myDocuments: Array<MyDocumentsGroup>;
  myEvents: EventPaginatedResponse;
  myFormSubmission?: Maybe<FormSubmission>;
  myFormSubmissionByToken?: Maybe<FormSubmission>;
  myFormSubmissions: Array<FormSubmission>;
  myInvoices: Array<Invoice>;
  myMembership?: Maybe<Membership>;
  myMembershipRequests: MembershipRequestPaginatedResponse;
  myMembershipStatus: Scalars['Boolean']['output'];
  myMemberships: Array<Membership>;
  myOrganizationUnits: Array<OrganizationUnit>;
  myRequiredOrgUnitForms: Array<RequirementForm>;
  myShiftInstances: ShiftInstancePaginatedResponse;
  myTime: TimeEntryPaginatedResponse;
  myUserProfile?: Maybe<UserProfile>;
  organization?: Maybe<Organization>;
  organizationBySlug: Organization;
  organizationTree?: Maybe<OrganizationTree>;
  organizationUnit?: Maybe<OrganizationUnit>;
  organizationUnitBySlug?: Maybe<OrganizationUnit>;
  organizationUnitTypes: Array<OrganizationUnitType>;
  organizationUnits: OrganizationUnitPaginatedResponse;
  organizations: OrganizationPaginatedResponse;
  pendingContractSignee?: Maybe<PendingSignee>;
  pendingInvoiceSignee?: Maybe<PendingSignee>;
  permissionGroups: Array<PermissionGroup>;
  permissions: Array<Permission>;
  publicEvent: Event;
  publicEventsByOrganizationUnit: Array<Event>;
  publicOrganizationUnit: OrganizationUnit;
  publicShiftInstance: ShiftInstance;
  publicShiftInstances: Array<ShiftInstance>;
  publicShiftsByOrganizationUnit: Array<Shift>;
  reimbursementTypes: Array<ReimbursementType>;
  requirement?: Maybe<Requirement>;
  requirementForm?: Maybe<RequirementForm>;
  requirementFormByShareToken?: Maybe<RequirementForm>;
  requirementForms: RequirementFormPaginatedResponse;
  requirementFulfillment?: Maybe<RequirementFulfillment>;
  requirementFulfillments: RequirementFulfillmentPaginatedResponse;
  requirementProfile?: Maybe<RequirementProfile>;
  requirementProfileSubmission?: Maybe<RequirementProfileSubmission>;
  requirementProfileSubmissions: RequirementProfileSubmissionPaginatedResponse;
  requirementProfiles: RequirementProfilePaginatedResponse;
  requirements: RequirementPaginatedResponse;
  role: Role;
  roles: Array<Role>;
  rosterYearlyUsage: Array<VolunteerYearlyUsage>;
  shift: Shift;
  shiftInstance: ShiftInstance;
  shiftInstances: Array<ShiftInstance>;
  shiftInstancesByMasterIds: Array<ShiftInstancesByMaster>;
  shiftVolunteers: Array<User>;
  shifts: ShiftPaginatedResponse;
  timeEntries: TimeEntryPaginatedResponse;
  timeEntriesByUser: TimeEntryPaginatedResponse;
  timeEntry: TimeEntry;
  user?: Maybe<User>;
  userByCheckInId?: Maybe<User>;
  volunteersNeedingTimesheets: Array<VolunteerNeedsTimesheet>;
  weeklyShifts: Array<ShiftInstance>;
  yearlyUsage: YearlyUsage;
};


export type QueryActiveDocumentTemplateArgs = {
  kind: DocumentKind;
  organizationUnitId?: InputMaybe<Scalars['ID']['input']>;
  reimbursementTypeId: Scalars['ID']['input'];
};


export type QueryAdminUserProfileArgs = {
  userId: Scalars['String']['input'];
};


export type QueryAdminVolunteerSubmissionArgs = {
  id: Scalars['String']['input'];
};


export type QueryAvailableEventsArgs = {
  endsBefore?: InputMaybe<Scalars['DateTime']['input']>;
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
  organizationUnitIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  startsAfter?: InputMaybe<Scalars['DateTime']['input']>;
};


export type QueryAvailableShiftInstancesArgs = {
  endsBefore?: InputMaybe<Scalars['DateTime']['input']>;
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
  organizationUnitIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  startsAfter?: InputMaybe<Scalars['DateTime']['input']>;
};


export type QueryBundleDownloadStatusArgs = {
  reimbursementTypeId: Scalars['ID']['input'];
  volunteerId: Scalars['ID']['input'];
};


export type QueryCheckInContextArgs = {
  checkInId: Scalars['String']['input'];
};


export type QueryCheckInReadinessArgs = {
  shiftInstanceId: Scalars['ID']['input'];
  volunteerId: Scalars['ID']['input'];
};


export type QueryCheckInShiftInstancesArgs = {
  endsBefore?: InputMaybe<Scalars['DateTime']['input']>;
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
  startsAfter?: InputMaybe<Scalars['DateTime']['input']>;
};


export type QueryCheckInShiftsArgs = {
  search?: InputMaybe<Scalars['String']['input']>;
};


export type QueryCheckInVolunteerRequiredFormsArgs = {
  volunteerId: Scalars['ID']['input'];
};


export type QueryContractArgs = {
  id: Scalars['ID']['input'];
};


export type QueryContractsArgs = {
  filter?: InputMaybe<ContractFilterInput>;
};


export type QueryDocumentTemplateArgs = {
  id: Scalars['ID']['input'];
};


export type QueryEffectiveRatesArgs = {
  organizationUnitId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryEligibleTimeEntriesForInvoiceArgs = {
  periodEnd?: InputMaybe<Scalars['DateTime']['input']>;
  periodStart?: InputMaybe<Scalars['DateTime']['input']>;
  reimbursementTypeId: Scalars['ID']['input'];
  volunteerId: Scalars['ID']['input'];
};


export type QueryEventArgs = {
  id: Scalars['ID']['input'];
};


export type QueryEventInvitesArgs = {
  eventId: Scalars['ID']['input'];
};


export type QueryEventShiftsArgs = {
  eventId: Scalars['ID']['input'];
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
};


export type QueryEventsArgs = {
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
};


export type QueryFormBlockArgs = {
  id: Scalars['String']['input'];
};


export type QueryFormBlocksArgs = {
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
  organizationId: Scalars['String']['input'];
};


export type QueryFormSubmissionArgs = {
  id: Scalars['String']['input'];
};


export type QueryFormSubmissionsByFormArgs = {
  formId: Scalars['String']['input'];
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
};


export type QueryFormSubmissionsByMembershipRequestArgs = {
  membershipRequestId: Scalars['String']['input'];
};


export type QueryFormSubmissionsForVolunteerArgs = {
  userId: Scalars['String']['input'];
};


export type QueryInvoiceArgs = {
  id: Scalars['ID']['input'];
};


export type QueryInvoicesArgs = {
  filter?: InputMaybe<InvoiceFilterInput>;
};


export type QueryIsMemberOfUnitOrAncestorArgs = {
  organizationUnitId: Scalars['ID']['input'];
  userId: Scalars['String']['input'];
};


export type QueryManualBaselineArgs = {
  reimbursementTypeId: Scalars['ID']['input'];
  volunteerId: Scalars['ID']['input'];
  year: Scalars['Int']['input'];
};


export type QueryMembersArgs = {
  organizationUnitId: Scalars['ID']['input'];
};


export type QueryMembershipArgs = {
  organizationUnitId: Scalars['ID']['input'];
};


export type QueryMembershipRequestCountArgs = {
  status?: InputMaybe<MembershipRequestStatus>;
};


export type QueryMembershipRequestsArgs = {
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
  status?: InputMaybe<MembershipRequestStatus>;
};


export type QueryMyContractsArgs = {
  filter?: InputMaybe<ContractFilterInput>;
};


export type QueryMyEventsArgs = {
  endsBefore?: InputMaybe<Scalars['DateTime']['input']>;
  includePast?: Scalars['Boolean']['input'];
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
  order?: SortOrder;
  startsAfter?: InputMaybe<Scalars['DateTime']['input']>;
  statuses?: InputMaybe<Array<EventInviteStatus>>;
};


export type QueryMyFormSubmissionArgs = {
  id: Scalars['ID']['input'];
};


export type QueryMyFormSubmissionByTokenArgs = {
  token: Scalars['String']['input'];
};


export type QueryMyFormSubmissionsArgs = {
  organizationUnitId: Scalars['ID']['input'];
};


export type QueryMyInvoicesArgs = {
  filter?: InputMaybe<InvoiceFilterInput>;
};


export type QueryMyMembershipArgs = {
  id: Scalars['ID']['input'];
};


export type QueryMyMembershipRequestsArgs = {
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
};


export type QueryMyMembershipStatusArgs = {
  organizationUnitId: Scalars['ID']['input'];
};


export type QueryMyRequiredOrgUnitFormsArgs = {
  organizationUnitId: Scalars['ID']['input'];
};


export type QueryMyShiftInstancesArgs = {
  endsBefore?: InputMaybe<Scalars['DateTime']['input']>;
  includeIntended?: InputMaybe<Scalars['Boolean']['input']>;
  includePast?: Scalars['Boolean']['input'];
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
  order?: SortOrder;
  startsAfter?: InputMaybe<Scalars['DateTime']['input']>;
  statuses?: InputMaybe<Array<ShiftInviteStatus>>;
};


export type QueryMyTimeArgs = {
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
};


export type QueryOrganizationArgs = {
  id: Scalars['String']['input'];
};


export type QueryOrganizationBySlugArgs = {
  slug: Scalars['String']['input'];
};


export type QueryOrganizationUnitArgs = {
  id: Scalars['String']['input'];
};


export type QueryOrganizationUnitBySlugArgs = {
  slug: Scalars['String']['input'];
};


export type QueryOrganizationUnitsArgs = {
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
  organizationId: Scalars['String']['input'];
};


export type QueryOrganizationsArgs = {
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
};


export type QueryPendingContractSigneeArgs = {
  contractId: Scalars['ID']['input'];
};


export type QueryPendingInvoiceSigneeArgs = {
  invoiceId: Scalars['ID']['input'];
};


export type QueryPublicEventArgs = {
  id: Scalars['ID']['input'];
};


export type QueryPublicEventsByOrganizationUnitArgs = {
  organizationUnitId: Scalars['ID']['input'];
};


export type QueryPublicOrganizationUnitArgs = {
  id: Scalars['ID']['input'];
};


export type QueryPublicShiftInstanceArgs = {
  id: Scalars['ID']['input'];
};


export type QueryPublicShiftInstancesArgs = {
  shiftId: Scalars['ID']['input'];
};


export type QueryPublicShiftsByOrganizationUnitArgs = {
  organizationUnitId: Scalars['ID']['input'];
};


export type QueryRequirementArgs = {
  id: Scalars['String']['input'];
};


export type QueryRequirementFormArgs = {
  id: Scalars['String']['input'];
};


export type QueryRequirementFormByShareTokenArgs = {
  token: Scalars['String']['input'];
};


export type QueryRequirementFormsArgs = {
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
  organizationId: Scalars['String']['input'];
};


export type QueryRequirementFulfillmentArgs = {
  id: Scalars['String']['input'];
};


export type QueryRequirementFulfillmentsArgs = {
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
};


export type QueryRequirementProfileArgs = {
  id: Scalars['String']['input'];
};


export type QueryRequirementProfileSubmissionArgs = {
  id: Scalars['String']['input'];
};


export type QueryRequirementProfileSubmissionsArgs = {
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
};


export type QueryRequirementProfilesArgs = {
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
};


export type QueryRequirementsArgs = {
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
};


export type QueryRoleArgs = {
  id: Scalars['String']['input'];
};


export type QueryRosterYearlyUsageArgs = {
  organizationUnitId: Scalars['ID']['input'];
  year: Scalars['Int']['input'];
};


export type QueryShiftArgs = {
  id: Scalars['String']['input'];
};


export type QueryShiftInstanceArgs = {
  id: Scalars['ID']['input'];
};


export type QueryShiftInstancesArgs = {
  shiftId: Scalars['ID']['input'];
};


export type QueryShiftInstancesByMasterIdsArgs = {
  masterIds: Array<Scalars['ID']['input']>;
};


export type QueryShiftVolunteersArgs = {
  instanceId: Scalars['ID']['input'];
  statuses?: InputMaybe<Array<ShiftInviteStatus>>;
};


export type QueryShiftsArgs = {
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
};


export type QueryTimeEntriesArgs = {
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
};


export type QueryTimeEntriesByUserArgs = {
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
  userId: Scalars['String']['input'];
};


export type QueryTimeEntryArgs = {
  id: Scalars['String']['input'];
};


export type QueryUserArgs = {
  id: Scalars['String']['input'];
};


export type QueryUserByCheckInIdArgs = {
  checkInId: Scalars['String']['input'];
};


export type QueryVolunteersNeedingTimesheetsArgs = {
  periodEnd?: InputMaybe<Scalars['DateTime']['input']>;
  periodStart?: InputMaybe<Scalars['DateTime']['input']>;
};


export type QueryWeeklyShiftsArgs = {
  endsBefore?: InputMaybe<Scalars['DateTime']['input']>;
  eventId?: InputMaybe<Scalars['ID']['input']>;
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
  startsAfter?: InputMaybe<Scalars['DateTime']['input']>;
};


export type QueryYearlyUsageArgs = {
  reimbursementTypeId: Scalars['ID']['input'];
  year: Scalars['Int']['input'];
};

export type ReimbursementRate = {
  __typename?: 'ReimbursementRate';
  createdAt: Scalars['DateTime']['output'];
  hourlyRateCents: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  organization: Organization;
  reimbursementType: ReimbursementType;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type ReimbursementType = {
  __typename?: 'ReimbursementType';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  key: ReimbursementTypeKey;
  legalReference: Scalars['String']['output'];
  platformDefaultRateCents: Scalars['Int']['output'];
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  yearlyLimitCents: Scalars['Int']['output'];
};

export enum ReimbursementTypeKey {
  Ehrenamt = 'EHRENAMT',
  Uebungsleiter = 'UEBUNGSLEITER'
}

export type ReimbursementTypeUsage = {
  __typename?: 'ReimbursementTypeUsage';
  limitCents: Scalars['Int']['output'];
  reimbursementType: ReimbursementType;
  remainingCents: Scalars['Int']['output'];
  usedCents: Scalars['Int']['output'];
};

export enum RenewalCadence {
  Monthly = 'MONTHLY',
  Yearly = 'YEARLY'
}

export type RequiredFormRef = {
  __typename?: 'RequiredFormRef';
  form: RequirementForm;
  order: Scalars['Int']['output'];
};

export enum RequiredFormTargetType {
  Event = 'EVENT',
  OrganizationUnit = 'ORGANIZATION_UNIT',
  Shift = 'SHIFT',
  ShiftInstance = 'SHIFT_INSTANCE'
}

export type RequiredFormWithStatus = {
  __typename?: 'RequiredFormWithStatus';
  form: RequirementForm;
  order: Scalars['Int']['output'];
  submissionId?: Maybe<Scalars['ID']['output']>;
  submitted: Scalars['Boolean']['output'];
  targetId: Scalars['ID']['output'];
  targetType: RequiredFormTargetType;
};

export type Requirement = {
  __typename?: 'Requirement';
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  mandatory: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  organizationId: Scalars['String']['output'];
  type: RequirementType;
};

export type RequirementForm = {
  __typename?: 'RequirementForm';
  blockRefs?: Maybe<Array<RequirementFormBlockRef>>;
  createdAt: Scalars['DateTime']['output'];
  createdBy: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  organizationId: Scalars['String']['output'];
  organizationUnitId?: Maybe<Scalars['String']['output']>;
  settings: FormSettings;
  shareToken: Scalars['String']['output'];
  slug: Scalars['String']['output'];
  submissionCount: Scalars['Float']['output'];
  updatedAt: Scalars['DateTime']['output'];
  updatedBy: Scalars['String']['output'];
};

export type RequirementFormBlockRef = {
  __typename?: 'RequirementFormBlockRef';
  block?: Maybe<FormBlock>;
  blockId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  fieldOrder: Scalars['Float']['output'];
  formId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  required?: Maybe<Scalars['Boolean']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

export type RequirementFormPaginatedResponse = {
  __typename?: 'RequirementFormPaginatedResponse';
  items: Array<RequirementForm>;
  pagination: PaginationInfo;
};

export type RequirementFulfillment = {
  id: Scalars['ID']['output'];
  organizationUserProfile?: Maybe<OrganizationUserProfile>;
  requirement: Requirement;
  reviewedAt?: Maybe<Scalars['DateTime']['output']>;
  reviewedBy?: Maybe<User>;
  reviewer?: Maybe<User>;
  status: RequirementFulfillmentStatus;
  submission: RequirementProfileSubmission;
  submittedAt?: Maybe<Scalars['DateTime']['output']>;
  type: RequirementType;
};

export type RequirementFulfillmentCheck = RequirementFulfillment & {
  __typename?: 'RequirementFulfillmentCheck';
  checked?: Maybe<Scalars['Boolean']['output']>;
  id: Scalars['ID']['output'];
  organizationUserProfile?: Maybe<OrganizationUserProfile>;
  requirement: Requirement;
  reviewedAt?: Maybe<Scalars['DateTime']['output']>;
  reviewedBy?: Maybe<User>;
  reviewer?: Maybe<User>;
  status: RequirementFulfillmentStatus;
  submission: RequirementProfileSubmission;
  submittedAt?: Maybe<Scalars['DateTime']['output']>;
  type: RequirementType;
};

export type RequirementFulfillmentDate = RequirementFulfillment & {
  __typename?: 'RequirementFulfillmentDate';
  date?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  organizationUserProfile?: Maybe<OrganizationUserProfile>;
  requirement: Requirement;
  reviewedAt?: Maybe<Scalars['DateTime']['output']>;
  reviewedBy?: Maybe<User>;
  reviewer?: Maybe<User>;
  status: RequirementFulfillmentStatus;
  submission: RequirementProfileSubmission;
  submittedAt?: Maybe<Scalars['DateTime']['output']>;
  type: RequirementType;
};

export type RequirementFulfillmentPaginatedResponse = {
  __typename?: 'RequirementFulfillmentPaginatedResponse';
  items: Array<RequirementFulfillment>;
  pagination: PaginationInfo;
};

export enum RequirementFulfillmentStatus {
  Approved = 'APPROVED',
  Draft = 'DRAFT',
  Rejected = 'REJECTED',
  Submitted = 'SUBMITTED'
}

export type RequirementFulfillmentText = RequirementFulfillment & {
  __typename?: 'RequirementFulfillmentText';
  id: Scalars['ID']['output'];
  organizationUserProfile?: Maybe<OrganizationUserProfile>;
  requirement: Requirement;
  reviewedAt?: Maybe<Scalars['DateTime']['output']>;
  reviewedBy?: Maybe<User>;
  reviewer?: Maybe<User>;
  status: RequirementFulfillmentStatus;
  submission: RequirementProfileSubmission;
  submittedAt?: Maybe<Scalars['DateTime']['output']>;
  text?: Maybe<Scalars['String']['output']>;
  type: RequirementType;
};

export type RequirementFulfillmentUpload = RequirementFulfillment & {
  __typename?: 'RequirementFulfillmentUpload';
  downloadUrl?: Maybe<Scalars['String']['output']>;
  fileId?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  organizationUserProfile?: Maybe<OrganizationUserProfile>;
  requirement: Requirement;
  reviewedAt?: Maybe<Scalars['DateTime']['output']>;
  reviewedBy?: Maybe<User>;
  reviewer?: Maybe<User>;
  status: RequirementFulfillmentStatus;
  submission: RequirementProfileSubmission;
  submittedAt?: Maybe<Scalars['DateTime']['output']>;
  type: RequirementType;
};

export type RequirementPaginatedResponse = {
  __typename?: 'RequirementPaginatedResponse';
  items: Array<Requirement>;
  pagination: PaginationInfo;
};

export type RequirementProfile = {
  __typename?: 'RequirementProfile';
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  organizationId: Scalars['String']['output'];
  requirements?: Maybe<Array<Requirement>>;
};

export type RequirementProfilePaginatedResponse = {
  __typename?: 'RequirementProfilePaginatedResponse';
  items: Array<RequirementProfile>;
  pagination: PaginationInfo;
};

export type RequirementProfileSubmission = {
  __typename?: 'RequirementProfileSubmission';
  fulfillments?: Maybe<Array<RequirementFulfillment>>;
  id: Scalars['ID']['output'];
  membership?: Maybe<Membership>;
  membershipRequest?: Maybe<MembershipRequest>;
  requirementProfile: RequirementProfile;
  reviewedAt?: Maybe<Scalars['DateTime']['output']>;
  reviewedBy?: Maybe<User>;
  reviewer?: Maybe<User>;
  status: RequirementProfileSubmissionStatus;
  submittedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type RequirementProfileSubmissionPaginatedResponse = {
  __typename?: 'RequirementProfileSubmissionPaginatedResponse';
  items: Array<RequirementProfileSubmission>;
  pagination: PaginationInfo;
};

export enum RequirementProfileSubmissionStatus {
  Approved = 'APPROVED',
  Draft = 'DRAFT',
  Rejected = 'REJECTED',
  Submitted = 'SUBMITTED'
}

export enum RequirementType {
  Check = 'CHECK',
  Date = 'DATE',
  Document = 'DOCUMENT',
  Text = 'TEXT'
}

export type Role = {
  __typename?: 'Role';
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isInternal: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  organization: Organization;
  permissions: Array<Permission>;
};

export type SelectOption = {
  __typename?: 'SelectOption';
  label: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export type SelectOptionInput = {
  label: Scalars['String']['input'];
  value: Scalars['String']['input'];
};

export type Shift = {
  __typename?: 'Shift';
  createdAt: Scalars['DateTime']['output'];
  createdBy?: Maybe<User>;
  durationMinutes: Scalars['Int']['output'];
  event?: Maybe<Event>;
  id: Scalars['ID']['output'];
  imageUrl?: Maybe<Scalars['String']['output']>;
  instances: Array<ShiftInstance>;
  instructions?: Maybe<Scalars['String']['output']>;
  isDeleted: Scalars['Boolean']['output'];
  location?: Maybe<Scalars['String']['output']>;
  maxVolunteers?: Maybe<Scalars['Int']['output']>;
  minVolunteers?: Maybe<Scalars['Int']['output']>;
  organization: Organization;
  organizationUnit: OrganizationUnit;
  organizationUnitId: Scalars['ID']['output'];
  originalStartsAt: Scalars['DateTime']['output'];
  reimbursementTypeId?: Maybe<Scalars['ID']['output']>;
  requiredForms: Array<RequiredFormRef>;
  requiredFormsCount: Scalars['Int']['output'];
  rrule?: Maybe<Scalars['String']['output']>;
  slug: Scalars['String']['output'];
  title: Scalars['String']['output'];
  visibility: ShiftVisibility;
};

export type ShiftInstance = {
  __typename?: 'ShiftInstance';
  actualEndsAt: Scalars['DateTime']['output'];
  actualStartsAt: Scalars['DateTime']['output'];
  filledCount: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  invite?: Maybe<ShiftInstanceInvite>;
  invites?: Maybe<Array<ShiftInstanceInvite>>;
  isCancelled: Scalars['Boolean']['output'];
  isCheckedIn: Scalars['Boolean']['output'];
  isException: Scalars['Boolean']['output'];
  isIntendingToJoin: Scalars['Boolean']['output'];
  master: Shift;
  masterId: Scalars['ID']['output'];
  myInviteStatus?: Maybe<ShiftInviteStatus>;
  myInvitedAt?: Maybe<Scalars['DateTime']['output']>;
  occurrenceIndex: Scalars['Int']['output'];
  overrideInstructions?: Maybe<Scalars['String']['output']>;
  overrideLocation?: Maybe<Scalars['String']['output']>;
  overrideMaxVolunteers?: Maybe<Scalars['Int']['output']>;
  overrideMinVolunteers?: Maybe<Scalars['Int']['output']>;
  overrideReimbursementTypeId?: Maybe<Scalars['ID']['output']>;
  overrideTitle?: Maybe<Scalars['String']['output']>;
  requiredForms: Array<RequiredFormRef>;
  requiredFormsCount: Scalars['Int']['output'];
  spotsLeft?: Maybe<Scalars['Int']['output']>;
  volunteers?: Maybe<Array<User>>;
};


export type ShiftInstanceInviteArgs = {
  userId: Scalars['String']['input'];
};


export type ShiftInstanceInvitesArgs = {
  statuses?: InputMaybe<Array<ShiftInviteStatus>>;
};

export type ShiftInstanceInvite = {
  __typename?: 'ShiftInstanceInvite';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  status: ShiftInviteStatus;
  updatedAt: Scalars['DateTime']['output'];
  user: User;
  userId: Scalars['String']['output'];
};

export type ShiftInstancePaginatedResponse = {
  __typename?: 'ShiftInstancePaginatedResponse';
  items: Array<ShiftInstance>;
  pagination: PaginationInfo;
};

export type ShiftInstancesByMaster = {
  __typename?: 'ShiftInstancesByMaster';
  instances: Array<ShiftInstance>;
  masterId: Scalars['ID']['output'];
};

export type ShiftInvite = {
  __typename?: 'ShiftInvite';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  status: ShiftInviteStatus;
  updatedAt: Scalars['DateTime']['output'];
  userId: Scalars['String']['output'];
};

export enum ShiftInviteStatus {
  Accepted = 'ACCEPTED',
  AdminRejected = 'ADMIN_REJECTED',
  Cancelled = 'CANCELLED',
  Invited = 'INVITED',
  SelfJoined = 'SELF_JOINED',
  VolunteerRejected = 'VOLUNTEER_REJECTED'
}

export type ShiftPaginatedResponse = {
  __typename?: 'ShiftPaginatedResponse';
  items: Array<Shift>;
  pagination: PaginationInfo;
};

export enum ShiftVisibility {
  AllMembers = 'ALL_MEMBERS',
  InvitedMembers = 'INVITED_MEMBERS'
}

export enum SigneeType {
  PermissionHolder = 'PERMISSION_HOLDER',
  Volunteer = 'VOLUNTEER'
}

export enum SortOrder {
  Asc = 'ASC',
  Desc = 'DESC'
}

export type SubmitFormInput = {
  values: Array<FormFieldValueInput>;
};

export type TemplateSignee = {
  __typename?: 'TemplateSignee';
  id: Scalars['ID']['output'];
  order: Scalars['Int']['output'];
  requiredPermission?: Maybe<Permission>;
  signeeType: SigneeType;
};

export type TimeEntry = {
  __typename?: 'TimeEntry';
  createdAt: Scalars['DateTime']['output'];
  endedAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  isPaid: Scalars['Boolean']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  organizationUnit: OrganizationUnit;
  reimbursementType?: Maybe<ReimbursementType>;
  shiftInstance?: Maybe<ShiftInstance>;
  startedAt: Scalars['DateTime']['output'];
  volunteer: User;
};

export type TimeEntryPaginatedResponse = {
  __typename?: 'TimeEntryPaginatedResponse';
  items: Array<TimeEntry>;
  pagination: PaginationInfo;
};

export type UpdateDocumentTemplateInput = {
  body?: InputMaybe<Scalars['JSON']['input']>;
  invoiceNumberFormat?: InputMaybe<Scalars['String']['input']>;
  renewalCadence?: InputMaybe<RenewalCadence>;
  signees?: InputMaybe<Array<CreateTemplateSigneeInput>>;
};

export type UpdateEventInput = {
  coverFileId?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  endsAt?: InputMaybe<Scalars['DateTime']['input']>;
  invitedMemberIds?: InputMaybe<Array<Scalars['String']['input']>>;
  location?: InputMaybe<Scalars['String']['input']>;
  logoFileId?: InputMaybe<Scalars['String']['input']>;
  requiredFormIds?: InputMaybe<Array<Scalars['String']['input']>>;
  startsAt?: InputMaybe<Scalars['DateTime']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateFormBlockFieldInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  documentFileId?: InputMaybe<Scalars['String']['input']>;
  documentLabel?: InputMaybe<Scalars['String']['input']>;
  fieldOrder?: InputMaybe<Scalars['Float']['input']>;
  label?: InputMaybe<Scalars['String']['input']>;
  lockType?: InputMaybe<Scalars['Boolean']['input']>;
  minAge?: InputMaybe<Scalars['Float']['input']>;
  options?: InputMaybe<Array<SelectOptionInput>>;
  placeholder?: InputMaybe<Scalars['String']['input']>;
  required?: InputMaybe<Scalars['Boolean']['input']>;
  systemKey?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<FieldType>;
};

export type UpdateFormBlockInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  icon?: InputMaybe<Scalars['String']['input']>;
  required?: InputMaybe<Scalars['Boolean']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateMyImageInput = {
  imageFileId?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateOrganizationInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  city?: InputMaybe<Scalars['String']['input']>;
  contactEmail?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  logoFileId?: InputMaybe<Scalars['String']['input']>;
  logoUrl?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  websiteUrl?: InputMaybe<Scalars['String']['input']>;
  zipCode?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateOrganizationUnitInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  city?: InputMaybe<Scalars['String']['input']>;
  contactEmail?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  legalRep?: InputMaybe<Scalars['String']['input']>;
  logoFileId?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  organizationId: Scalars['String']['input'];
  parentId?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  requiredMembershipRequirementProfileId?: InputMaybe<Scalars['String']['input']>;
  typeId?: InputMaybe<Scalars['String']['input']>;
  websiteUrl?: InputMaybe<Scalars['String']['input']>;
  zipCode?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateRequirementFormInput = {
  blockRefs?: InputMaybe<Array<FormBlockRefInput>>;
  description?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  settings?: InputMaybe<FormSettingsInput>;
};

export type UpdateRequirementFulfillmentInput = {
  checked?: InputMaybe<Scalars['Boolean']['input']>;
  date?: InputMaybe<Scalars['DateTime']['input']>;
  fileId?: InputMaybe<Scalars['String']['input']>;
  text?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateRequirementInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  mandatory?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<RequirementType>;
};

export type UpdateRequirementProfileInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  requirementIds?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type UpdateRequirementProfileSubmissionInput = {
  fulfillments?: InputMaybe<Array<CreateRequirementSubmissionFulfillmentInput>>;
  membershipId?: InputMaybe<Scalars['String']['input']>;
  membershipRequestId?: InputMaybe<Scalars['String']['input']>;
  profileId?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateShiftInput = {
  endsAt?: InputMaybe<Scalars['DateTime']['input']>;
  eventId?: InputMaybe<Scalars['ID']['input']>;
  imageFileId?: InputMaybe<Scalars['String']['input']>;
  instructions?: InputMaybe<Scalars['String']['input']>;
  invitedMemberIds?: InputMaybe<Array<Scalars['String']['input']>>;
  location?: InputMaybe<Scalars['String']['input']>;
  maxVolunteers?: InputMaybe<Scalars['Int']['input']>;
  minVolunteers?: InputMaybe<Scalars['Int']['input']>;
  reimbursementTypeId?: InputMaybe<Scalars['ID']['input']>;
  requiredFormIds?: InputMaybe<Array<Scalars['String']['input']>>;
  rrule?: InputMaybe<Scalars['String']['input']>;
  startsAt?: InputMaybe<Scalars['DateTime']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  visibility?: InputMaybe<ShiftVisibility>;
};

export type UpdateShiftInstanceInput = {
  endsAt: Scalars['DateTime']['input'];
  imageFileId?: InputMaybe<Scalars['String']['input']>;
  instructions?: InputMaybe<Scalars['String']['input']>;
  location?: InputMaybe<Scalars['String']['input']>;
  maxVolunteers?: InputMaybe<Scalars['Int']['input']>;
  minVolunteers?: InputMaybe<Scalars['Int']['input']>;
  reimbursementTypeId?: InputMaybe<Scalars['ID']['input']>;
  requiredFormIds?: InputMaybe<Array<Scalars['String']['input']>>;
  rrule?: InputMaybe<Scalars['String']['input']>;
  startsAt: Scalars['DateTime']['input'];
  title: Scalars['String']['input'];
  visibility?: InputMaybe<ShiftVisibility>;
};

export type UpdateTimeEntryInput = {
  endedAt?: InputMaybe<Scalars['DateTime']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  shiftInstanceId?: InputMaybe<Scalars['String']['input']>;
  startedAt: Scalars['DateTime']['input'];
};

export type UpdateUserProfileInput = {
  data: Scalars['String']['input'];
};

export type User = {
  __typename?: 'User';
  checkInId: Scalars['ID']['output'];
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  image?: Maybe<Scalars['String']['output']>;
  locale?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  permissions?: Maybe<Array<Permission>>;
};

export type UserProfile = {
  __typename?: 'UserProfile';
  createdAt: Scalars['DateTime']['output'];
  data: Scalars['JSON']['output'];
  id: Scalars['ID']['output'];
  updatedAt: Scalars['DateTime']['output'];
  userId: Scalars['String']['output'];
};

export type UserRequirementStatus = {
  __typename?: 'UserRequirementStatus';
  name: Scalars['String']['output'];
  requirementId: Scalars['ID']['output'];
  status: RequirementFulfillmentStatus;
};

export type VolunteerNeedsTimesheet = {
  __typename?: 'VolunteerNeedsTimesheet';
  eligibleHours: Scalars['Float']['output'];
  reimbursementType: ReimbursementType;
  volunteer: User;
};

export type VolunteerYearlyUsage = {
  __typename?: 'VolunteerYearlyUsage';
  usageByType: Array<ReimbursementTypeUsage>;
  volunteer: User;
};

export type YearlyUsage = {
  __typename?: 'YearlyUsage';
  limitCents: Scalars['Int']['output'];
  remainingCents: Scalars['Int']['output'];
  usedCents: Scalars['Int']['output'];
};

export type GetReimbursementTypesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetReimbursementTypesQuery = { __typename?: 'Query', reimbursementTypes: Array<{ __typename?: 'ReimbursementType', id: string, key: ReimbursementTypeKey, legalReference: string, yearlyLimitCents: number, platformDefaultRateCents: number }> };

export type GetEffectiveRatesQueryVariables = Exact<{
  organizationUnitId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type GetEffectiveRatesQuery = { __typename?: 'Query', effectiveRates: Array<{ __typename?: 'EffectiveRate', hourlyRateCents: number, isOverride: boolean, organizationUnitId?: string | null, reimbursementType: { __typename?: 'ReimbursementType', id: string, key: ReimbursementTypeKey, legalReference: string, yearlyLimitCents: number, platformDefaultRateCents: number } }> };

export type SetReimbursementRateMutationVariables = Exact<{
  reimbursementTypeId: Scalars['ID']['input'];
  hourlyRateCents: Scalars['Int']['input'];
  organizationUnitId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type SetReimbursementRateMutation = { __typename?: 'Mutation', setReimbursementRate: { __typename?: 'ReimbursementRate', id: string, hourlyRateCents: number } };

export type GetYearlyUsageQueryVariables = Exact<{
  reimbursementTypeId: Scalars['ID']['input'];
  year: Scalars['Int']['input'];
}>;


export type GetYearlyUsageQuery = { __typename?: 'Query', yearlyUsage: { __typename?: 'YearlyUsage', usedCents: number, limitCents: number, remainingCents: number } };

export type GetRosterYearlyUsageQueryVariables = Exact<{
  organizationUnitId: Scalars['ID']['input'];
  year: Scalars['Int']['input'];
}>;


export type GetRosterYearlyUsageQuery = { __typename?: 'Query', rosterYearlyUsage: Array<{ __typename?: 'VolunteerYearlyUsage', volunteer: { __typename?: 'User', id: string, name: string, image?: string | null }, usageByType: Array<{ __typename?: 'ReimbursementTypeUsage', usedCents: number, limitCents: number, remainingCents: number, reimbursementType: { __typename?: 'ReimbursementType', id: string, key: ReimbursementTypeKey } }> }> };

export type ContractSummaryFieldsFragment = { __typename?: 'Contract', id: string, contractStatus: ContractStatus, periodStart: string, periodEnd: string, isNonCompliant: boolean, declineReason?: string | null, declinedAt?: string | null, declinedAtSigneeType?: SigneeType | null, renewDate?: string | null, downloadUrl?: string | null, missingProfileFields: Array<string>, missingOrgProfileFields: Array<string>, createdAt: string, updatedAt?: string | null, declinedByUser?: { __typename?: 'User', id: string, name: string } | null, volunteer: { __typename?: 'User', id: string, name: string, image?: string | null }, reimbursementType: { __typename?: 'ReimbursementType', id: string, key: ReimbursementTypeKey }, documentTemplate: { __typename?: 'DocumentTemplate', id: string, kind: DocumentKind }, signatures: Array<{ __typename?: 'ContractSignature', id: string, order: number, signeeType: SigneeType, signedAt?: string | null, signedByUser?: { __typename?: 'User', id: string, name: string } | null, requiredPermission?: { __typename?: 'Permission', id: string, key: PermissionKey } | null }>, statusChanges: Array<{ __typename?: 'ContractStatusChange', id: string, type: DocumentStatusChange, occurredAt: string, actorUser?: { __typename?: 'User', id: string, name: string } | null }> };

export type GetContractsQueryVariables = Exact<{
  filter?: InputMaybe<ContractFilterInput>;
}>;


export type GetContractsQuery = { __typename?: 'Query', contracts: Array<{ __typename?: 'Contract', id: string, contractStatus: ContractStatus, periodStart: string, periodEnd: string, isNonCompliant: boolean, declineReason?: string | null, declinedAt?: string | null, declinedAtSigneeType?: SigneeType | null, renewDate?: string | null, downloadUrl?: string | null, missingProfileFields: Array<string>, missingOrgProfileFields: Array<string>, createdAt: string, updatedAt?: string | null, declinedByUser?: { __typename?: 'User', id: string, name: string } | null, volunteer: { __typename?: 'User', id: string, name: string, image?: string | null }, reimbursementType: { __typename?: 'ReimbursementType', id: string, key: ReimbursementTypeKey }, documentTemplate: { __typename?: 'DocumentTemplate', id: string, kind: DocumentKind }, signatures: Array<{ __typename?: 'ContractSignature', id: string, order: number, signeeType: SigneeType, signedAt?: string | null, signedByUser?: { __typename?: 'User', id: string, name: string } | null, requiredPermission?: { __typename?: 'Permission', id: string, key: PermissionKey } | null }>, statusChanges: Array<{ __typename?: 'ContractStatusChange', id: string, type: DocumentStatusChange, occurredAt: string, actorUser?: { __typename?: 'User', id: string, name: string } | null }> }> };

export type GetMyContractsQueryVariables = Exact<{
  filter?: InputMaybe<ContractFilterInput>;
}>;


export type GetMyContractsQuery = { __typename?: 'Query', myContracts: Array<{ __typename?: 'Contract', id: string, contractStatus: ContractStatus, periodStart: string, periodEnd: string, isNonCompliant: boolean, declineReason?: string | null, declinedAt?: string | null, declinedAtSigneeType?: SigneeType | null, renewDate?: string | null, downloadUrl?: string | null, missingProfileFields: Array<string>, missingOrgProfileFields: Array<string>, createdAt: string, updatedAt?: string | null, declinedByUser?: { __typename?: 'User', id: string, name: string } | null, volunteer: { __typename?: 'User', id: string, name: string, image?: string | null }, reimbursementType: { __typename?: 'ReimbursementType', id: string, key: ReimbursementTypeKey }, documentTemplate: { __typename?: 'DocumentTemplate', id: string, kind: DocumentKind }, signatures: Array<{ __typename?: 'ContractSignature', id: string, order: number, signeeType: SigneeType, signedAt?: string | null, signedByUser?: { __typename?: 'User', id: string, name: string } | null, requiredPermission?: { __typename?: 'Permission', id: string, key: PermissionKey } | null }>, statusChanges: Array<{ __typename?: 'ContractStatusChange', id: string, type: DocumentStatusChange, occurredAt: string, actorUser?: { __typename?: 'User', id: string, name: string } | null }> }> };

export type GetContractQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetContractQuery = { __typename?: 'Query', contract: { __typename?: 'Contract', resolvedBody: Record<string, unknown>, id: string, contractStatus: ContractStatus, periodStart: string, periodEnd: string, isNonCompliant: boolean, declineReason?: string | null, declinedAt?: string | null, declinedAtSigneeType?: SigneeType | null, renewDate?: string | null, downloadUrl?: string | null, missingProfileFields: Array<string>, missingOrgProfileFields: Array<string>, createdAt: string, updatedAt?: string | null, declinedByUser?: { __typename?: 'User', id: string, name: string } | null, volunteer: { __typename?: 'User', id: string, name: string, image?: string | null }, reimbursementType: { __typename?: 'ReimbursementType', id: string, key: ReimbursementTypeKey }, documentTemplate: { __typename?: 'DocumentTemplate', id: string, kind: DocumentKind }, signatures: Array<{ __typename?: 'ContractSignature', id: string, order: number, signeeType: SigneeType, signedAt?: string | null, signedByUser?: { __typename?: 'User', id: string, name: string } | null, requiredPermission?: { __typename?: 'Permission', id: string, key: PermissionKey } | null }>, statusChanges: Array<{ __typename?: 'ContractStatusChange', id: string, type: DocumentStatusChange, occurredAt: string, actorUser?: { __typename?: 'User', id: string, name: string } | null }> } };

export type GetPendingContractSigneeQueryVariables = Exact<{
  contractId: Scalars['ID']['input'];
}>;


export type GetPendingContractSigneeQuery = { __typename?: 'Query', pendingContractSignee?: { __typename?: 'PendingSignee', signeeType: SigneeType, userId?: string | null, permissionKey?: string | null, eligibleUserIds?: Array<string> | null } | null };

export type CreateContractMutationVariables = Exact<{
  input: CreateContractInput;
}>;


export type CreateContractMutation = { __typename?: 'Mutation', createContract: { __typename?: 'Contract', id: string, contractStatus: ContractStatus, periodStart: string, periodEnd: string, isNonCompliant: boolean, declineReason?: string | null, declinedAt?: string | null, declinedAtSigneeType?: SigneeType | null, renewDate?: string | null, downloadUrl?: string | null, missingProfileFields: Array<string>, missingOrgProfileFields: Array<string>, createdAt: string, updatedAt?: string | null, declinedByUser?: { __typename?: 'User', id: string, name: string } | null, volunteer: { __typename?: 'User', id: string, name: string, image?: string | null }, reimbursementType: { __typename?: 'ReimbursementType', id: string, key: ReimbursementTypeKey }, documentTemplate: { __typename?: 'DocumentTemplate', id: string, kind: DocumentKind }, signatures: Array<{ __typename?: 'ContractSignature', id: string, order: number, signeeType: SigneeType, signedAt?: string | null, signedByUser?: { __typename?: 'User', id: string, name: string } | null, requiredPermission?: { __typename?: 'Permission', id: string, key: PermissionKey } | null }>, statusChanges: Array<{ __typename?: 'ContractStatusChange', id: string, type: DocumentStatusChange, occurredAt: string, actorUser?: { __typename?: 'User', id: string, name: string } | null }> } };

export type SignContractMutationVariables = Exact<{
  contractId: Scalars['ID']['input'];
}>;


export type SignContractMutation = { __typename?: 'Mutation', signContract: { __typename?: 'Contract', id: string, contractStatus: ContractStatus, periodStart: string, periodEnd: string, isNonCompliant: boolean, declineReason?: string | null, declinedAt?: string | null, declinedAtSigneeType?: SigneeType | null, renewDate?: string | null, downloadUrl?: string | null, missingProfileFields: Array<string>, missingOrgProfileFields: Array<string>, createdAt: string, updatedAt?: string | null, declinedByUser?: { __typename?: 'User', id: string, name: string } | null, volunteer: { __typename?: 'User', id: string, name: string, image?: string | null }, reimbursementType: { __typename?: 'ReimbursementType', id: string, key: ReimbursementTypeKey }, documentTemplate: { __typename?: 'DocumentTemplate', id: string, kind: DocumentKind }, signatures: Array<{ __typename?: 'ContractSignature', id: string, order: number, signeeType: SigneeType, signedAt?: string | null, signedByUser?: { __typename?: 'User', id: string, name: string } | null, requiredPermission?: { __typename?: 'Permission', id: string, key: PermissionKey } | null }>, statusChanges: Array<{ __typename?: 'ContractStatusChange', id: string, type: DocumentStatusChange, occurredAt: string, actorUser?: { __typename?: 'User', id: string, name: string } | null }> } };

export type DeclineContractMutationVariables = Exact<{
  contractId: Scalars['ID']['input'];
  reason: Scalars['String']['input'];
}>;


export type DeclineContractMutation = { __typename?: 'Mutation', declineContract: { __typename?: 'Contract', id: string, contractStatus: ContractStatus, periodStart: string, periodEnd: string, isNonCompliant: boolean, declineReason?: string | null, declinedAt?: string | null, declinedAtSigneeType?: SigneeType | null, renewDate?: string | null, downloadUrl?: string | null, missingProfileFields: Array<string>, missingOrgProfileFields: Array<string>, createdAt: string, updatedAt?: string | null, declinedByUser?: { __typename?: 'User', id: string, name: string } | null, volunteer: { __typename?: 'User', id: string, name: string, image?: string | null }, reimbursementType: { __typename?: 'ReimbursementType', id: string, key: ReimbursementTypeKey }, documentTemplate: { __typename?: 'DocumentTemplate', id: string, kind: DocumentKind }, signatures: Array<{ __typename?: 'ContractSignature', id: string, order: number, signeeType: SigneeType, signedAt?: string | null, signedByUser?: { __typename?: 'User', id: string, name: string } | null, requiredPermission?: { __typename?: 'Permission', id: string, key: PermissionKey } | null }>, statusChanges: Array<{ __typename?: 'ContractStatusChange', id: string, type: DocumentStatusChange, occurredAt: string, actorUser?: { __typename?: 'User', id: string, name: string } | null }> } };

export type InvoiceSummaryFieldsFragment = { __typename?: 'Invoice', id: string, invoiceStatus: InvoiceStatus, periodStart: string, periodEnd: string, totalAmountCents: number, totalHours: number, isNonCompliant: boolean, declineReason?: string | null, declinedAt?: string | null, declinedAtSigneeType?: SigneeType | null, downloadUrl?: string | null, missingProfileFields: Array<string>, missingOrgProfileFields: Array<string>, createdAt: string, updatedAt?: string | null, declinedByUser?: { __typename?: 'User', id: string, name: string } | null, volunteer: { __typename?: 'User', id: string, name: string, image?: string | null }, reimbursementType: { __typename?: 'ReimbursementType', id: string, key: ReimbursementTypeKey }, documentTemplate: { __typename?: 'DocumentTemplate', id: string, kind: DocumentKind }, invoiceTimeEntries: Array<{ __typename?: 'InvoiceTimeEntry', id: string }>, signatures: Array<{ __typename?: 'InvoiceSignature', id: string, order: number, signeeType: SigneeType, signedAt?: string | null, signedByUser?: { __typename?: 'User', id: string, name: string } | null, requiredPermission?: { __typename?: 'Permission', id: string, key: PermissionKey } | null }>, statusChanges: Array<{ __typename?: 'InvoiceStatusChange', id: string, type: DocumentStatusChange, occurredAt: string, actorUser?: { __typename?: 'User', id: string, name: string } | null }> };

export type GetInvoicesQueryVariables = Exact<{
  filter?: InputMaybe<InvoiceFilterInput>;
}>;


export type GetInvoicesQuery = { __typename?: 'Query', invoices: Array<{ __typename?: 'Invoice', id: string, invoiceStatus: InvoiceStatus, periodStart: string, periodEnd: string, totalAmountCents: number, totalHours: number, isNonCompliant: boolean, declineReason?: string | null, declinedAt?: string | null, declinedAtSigneeType?: SigneeType | null, downloadUrl?: string | null, missingProfileFields: Array<string>, missingOrgProfileFields: Array<string>, createdAt: string, updatedAt?: string | null, declinedByUser?: { __typename?: 'User', id: string, name: string } | null, volunteer: { __typename?: 'User', id: string, name: string, image?: string | null }, reimbursementType: { __typename?: 'ReimbursementType', id: string, key: ReimbursementTypeKey }, documentTemplate: { __typename?: 'DocumentTemplate', id: string, kind: DocumentKind }, invoiceTimeEntries: Array<{ __typename?: 'InvoiceTimeEntry', id: string }>, signatures: Array<{ __typename?: 'InvoiceSignature', id: string, order: number, signeeType: SigneeType, signedAt?: string | null, signedByUser?: { __typename?: 'User', id: string, name: string } | null, requiredPermission?: { __typename?: 'Permission', id: string, key: PermissionKey } | null }>, statusChanges: Array<{ __typename?: 'InvoiceStatusChange', id: string, type: DocumentStatusChange, occurredAt: string, actorUser?: { __typename?: 'User', id: string, name: string } | null }> }> };

export type GetMyInvoicesQueryVariables = Exact<{
  filter?: InputMaybe<InvoiceFilterInput>;
}>;


export type GetMyInvoicesQuery = { __typename?: 'Query', myInvoices: Array<{ __typename?: 'Invoice', id: string, invoiceStatus: InvoiceStatus, periodStart: string, periodEnd: string, totalAmountCents: number, totalHours: number, isNonCompliant: boolean, declineReason?: string | null, declinedAt?: string | null, declinedAtSigneeType?: SigneeType | null, downloadUrl?: string | null, missingProfileFields: Array<string>, missingOrgProfileFields: Array<string>, createdAt: string, updatedAt?: string | null, declinedByUser?: { __typename?: 'User', id: string, name: string } | null, volunteer: { __typename?: 'User', id: string, name: string, image?: string | null }, reimbursementType: { __typename?: 'ReimbursementType', id: string, key: ReimbursementTypeKey }, documentTemplate: { __typename?: 'DocumentTemplate', id: string, kind: DocumentKind }, invoiceTimeEntries: Array<{ __typename?: 'InvoiceTimeEntry', id: string }>, signatures: Array<{ __typename?: 'InvoiceSignature', id: string, order: number, signeeType: SigneeType, signedAt?: string | null, signedByUser?: { __typename?: 'User', id: string, name: string } | null, requiredPermission?: { __typename?: 'Permission', id: string, key: PermissionKey } | null }>, statusChanges: Array<{ __typename?: 'InvoiceStatusChange', id: string, type: DocumentStatusChange, occurredAt: string, actorUser?: { __typename?: 'User', id: string, name: string } | null }> }> };

export type GetInvoiceQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetInvoiceQuery = { __typename?: 'Query', invoice: { __typename?: 'Invoice', resolvedBody: Record<string, unknown>, id: string, invoiceStatus: InvoiceStatus, periodStart: string, periodEnd: string, totalAmountCents: number, totalHours: number, isNonCompliant: boolean, declineReason?: string | null, declinedAt?: string | null, declinedAtSigneeType?: SigneeType | null, downloadUrl?: string | null, missingProfileFields: Array<string>, missingOrgProfileFields: Array<string>, createdAt: string, updatedAt?: string | null, invoiceTimeEntries: Array<{ __typename?: 'InvoiceTimeEntry', id: string, timeEntry: { __typename?: 'TimeEntry', id: string, startedAt: string, endedAt?: string | null, notes?: string | null, shiftInstance?: { __typename?: 'ShiftInstance', id: string, master: { __typename?: 'Shift', title: string } } | null } }>, declinedByUser?: { __typename?: 'User', id: string, name: string } | null, volunteer: { __typename?: 'User', id: string, name: string, image?: string | null }, reimbursementType: { __typename?: 'ReimbursementType', id: string, key: ReimbursementTypeKey }, documentTemplate: { __typename?: 'DocumentTemplate', id: string, kind: DocumentKind }, signatures: Array<{ __typename?: 'InvoiceSignature', id: string, order: number, signeeType: SigneeType, signedAt?: string | null, signedByUser?: { __typename?: 'User', id: string, name: string } | null, requiredPermission?: { __typename?: 'Permission', id: string, key: PermissionKey } | null }>, statusChanges: Array<{ __typename?: 'InvoiceStatusChange', id: string, type: DocumentStatusChange, occurredAt: string, actorUser?: { __typename?: 'User', id: string, name: string } | null }> } };

export type GetPendingInvoiceSigneeQueryVariables = Exact<{
  invoiceId: Scalars['ID']['input'];
}>;


export type GetPendingInvoiceSigneeQuery = { __typename?: 'Query', pendingInvoiceSignee?: { __typename?: 'PendingSignee', signeeType: SigneeType, userId?: string | null, permissionKey?: string | null, eligibleUserIds?: Array<string> | null } | null };

export type GetVolunteersNeedingTimesheetsQueryVariables = Exact<{
  periodStart?: InputMaybe<Scalars['DateTime']['input']>;
  periodEnd?: InputMaybe<Scalars['DateTime']['input']>;
}>;


export type GetVolunteersNeedingTimesheetsQuery = { __typename?: 'Query', volunteersNeedingTimesheets: Array<{ __typename?: 'VolunteerNeedsTimesheet', eligibleHours: number, volunteer: { __typename?: 'User', id: string, name: string }, reimbursementType: { __typename?: 'ReimbursementType', id: string, key: ReimbursementTypeKey } }> };

export type GetEligibleTimeEntriesForInvoiceQueryVariables = Exact<{
  volunteerId: Scalars['ID']['input'];
  reimbursementTypeId: Scalars['ID']['input'];
  periodStart?: InputMaybe<Scalars['DateTime']['input']>;
  periodEnd?: InputMaybe<Scalars['DateTime']['input']>;
}>;


export type GetEligibleTimeEntriesForInvoiceQuery = { __typename?: 'Query', eligibleTimeEntriesForInvoice: Array<{ __typename?: 'TimeEntry', id: string, startedAt: string, endedAt?: string | null, notes?: string | null, shiftInstance?: { __typename?: 'ShiftInstance', id: string, master: { __typename?: 'Shift', title: string } } | null }> };

export type CreateInvoiceMutationVariables = Exact<{
  input: CreateInvoiceInput;
}>;


export type CreateInvoiceMutation = { __typename?: 'Mutation', createInvoice: { __typename?: 'Invoice', id: string, invoiceStatus: InvoiceStatus, periodStart: string, periodEnd: string, totalAmountCents: number, totalHours: number, isNonCompliant: boolean, declineReason?: string | null, declinedAt?: string | null, declinedAtSigneeType?: SigneeType | null, downloadUrl?: string | null, missingProfileFields: Array<string>, missingOrgProfileFields: Array<string>, createdAt: string, updatedAt?: string | null, declinedByUser?: { __typename?: 'User', id: string, name: string } | null, volunteer: { __typename?: 'User', id: string, name: string, image?: string | null }, reimbursementType: { __typename?: 'ReimbursementType', id: string, key: ReimbursementTypeKey }, documentTemplate: { __typename?: 'DocumentTemplate', id: string, kind: DocumentKind }, invoiceTimeEntries: Array<{ __typename?: 'InvoiceTimeEntry', id: string }>, signatures: Array<{ __typename?: 'InvoiceSignature', id: string, order: number, signeeType: SigneeType, signedAt?: string | null, signedByUser?: { __typename?: 'User', id: string, name: string } | null, requiredPermission?: { __typename?: 'Permission', id: string, key: PermissionKey } | null }>, statusChanges: Array<{ __typename?: 'InvoiceStatusChange', id: string, type: DocumentStatusChange, occurredAt: string, actorUser?: { __typename?: 'User', id: string, name: string } | null }> } };

export type SignInvoiceMutationVariables = Exact<{
  invoiceId: Scalars['ID']['input'];
}>;


export type SignInvoiceMutation = { __typename?: 'Mutation', signInvoice: { __typename?: 'Invoice', id: string, invoiceStatus: InvoiceStatus, periodStart: string, periodEnd: string, totalAmountCents: number, totalHours: number, isNonCompliant: boolean, declineReason?: string | null, declinedAt?: string | null, declinedAtSigneeType?: SigneeType | null, downloadUrl?: string | null, missingProfileFields: Array<string>, missingOrgProfileFields: Array<string>, createdAt: string, updatedAt?: string | null, declinedByUser?: { __typename?: 'User', id: string, name: string } | null, volunteer: { __typename?: 'User', id: string, name: string, image?: string | null }, reimbursementType: { __typename?: 'ReimbursementType', id: string, key: ReimbursementTypeKey }, documentTemplate: { __typename?: 'DocumentTemplate', id: string, kind: DocumentKind }, invoiceTimeEntries: Array<{ __typename?: 'InvoiceTimeEntry', id: string }>, signatures: Array<{ __typename?: 'InvoiceSignature', id: string, order: number, signeeType: SigneeType, signedAt?: string | null, signedByUser?: { __typename?: 'User', id: string, name: string } | null, requiredPermission?: { __typename?: 'Permission', id: string, key: PermissionKey } | null }>, statusChanges: Array<{ __typename?: 'InvoiceStatusChange', id: string, type: DocumentStatusChange, occurredAt: string, actorUser?: { __typename?: 'User', id: string, name: string } | null }> } };

export type DeclineInvoiceMutationVariables = Exact<{
  invoiceId: Scalars['ID']['input'];
  reason: Scalars['String']['input'];
}>;


export type DeclineInvoiceMutation = { __typename?: 'Mutation', declineInvoice: { __typename?: 'Invoice', id: string, invoiceStatus: InvoiceStatus, periodStart: string, periodEnd: string, totalAmountCents: number, totalHours: number, isNonCompliant: boolean, declineReason?: string | null, declinedAt?: string | null, declinedAtSigneeType?: SigneeType | null, downloadUrl?: string | null, missingProfileFields: Array<string>, missingOrgProfileFields: Array<string>, createdAt: string, updatedAt?: string | null, declinedByUser?: { __typename?: 'User', id: string, name: string } | null, volunteer: { __typename?: 'User', id: string, name: string, image?: string | null }, reimbursementType: { __typename?: 'ReimbursementType', id: string, key: ReimbursementTypeKey }, documentTemplate: { __typename?: 'DocumentTemplate', id: string, kind: DocumentKind }, invoiceTimeEntries: Array<{ __typename?: 'InvoiceTimeEntry', id: string }>, signatures: Array<{ __typename?: 'InvoiceSignature', id: string, order: number, signeeType: SigneeType, signedAt?: string | null, signedByUser?: { __typename?: 'User', id: string, name: string } | null, requiredPermission?: { __typename?: 'Permission', id: string, key: PermissionKey } | null }>, statusChanges: Array<{ __typename?: 'InvoiceStatusChange', id: string, type: DocumentStatusChange, occurredAt: string, actorUser?: { __typename?: 'User', id: string, name: string } | null }> } };

export type DocumentTemplateSummaryFieldsFragment = { __typename?: 'DocumentTemplate', id: string, kind: DocumentKind, invoiceNumberFormat?: string | null, renewalCadence?: RenewalCadence | null, isDeleted: boolean, lastEditedAt?: string | null, lastEditedByUser?: { __typename?: 'User', id: string, name: string } | null, reimbursementType: { __typename?: 'ReimbursementType', id: string, key: ReimbursementTypeKey }, organizationUnit?: { __typename?: 'OrganizationUnit', id: string, name: string } | null, signees: Array<{ __typename?: 'TemplateSignee', id: string, order: number, signeeType: SigneeType, requiredPermission?: { __typename?: 'Permission', id: string, key: PermissionKey } | null }> };

export type GetDocumentTemplatesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetDocumentTemplatesQuery = { __typename?: 'Query', documentTemplates: Array<{ __typename?: 'DocumentTemplate', id: string, kind: DocumentKind, invoiceNumberFormat?: string | null, renewalCadence?: RenewalCadence | null, isDeleted: boolean, lastEditedAt?: string | null, lastEditedByUser?: { __typename?: 'User', id: string, name: string } | null, reimbursementType: { __typename?: 'ReimbursementType', id: string, key: ReimbursementTypeKey }, organizationUnit?: { __typename?: 'OrganizationUnit', id: string, name: string } | null, signees: Array<{ __typename?: 'TemplateSignee', id: string, order: number, signeeType: SigneeType, requiredPermission?: { __typename?: 'Permission', id: string, key: PermissionKey } | null }> }> };

export type GetDocumentTemplateQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetDocumentTemplateQuery = { __typename?: 'Query', documentTemplate: { __typename?: 'DocumentTemplate', body: Record<string, unknown>, id: string, kind: DocumentKind, invoiceNumberFormat?: string | null, renewalCadence?: RenewalCadence | null, isDeleted: boolean, lastEditedAt?: string | null, lastEditedByUser?: { __typename?: 'User', id: string, name: string } | null, reimbursementType: { __typename?: 'ReimbursementType', id: string, key: ReimbursementTypeKey }, organizationUnit?: { __typename?: 'OrganizationUnit', id: string, name: string } | null, signees: Array<{ __typename?: 'TemplateSignee', id: string, order: number, signeeType: SigneeType, requiredPermission?: { __typename?: 'Permission', id: string, key: PermissionKey } | null }> } };

export type GetActiveDocumentTemplateQueryVariables = Exact<{
  kind: DocumentKind;
  reimbursementTypeId: Scalars['ID']['input'];
  organizationUnitId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type GetActiveDocumentTemplateQuery = { __typename?: 'Query', activeDocumentTemplate: { __typename?: 'DocumentTemplate', body: Record<string, unknown>, id: string, kind: DocumentKind, invoiceNumberFormat?: string | null, renewalCadence?: RenewalCadence | null, isDeleted: boolean, lastEditedAt?: string | null, lastEditedByUser?: { __typename?: 'User', id: string, name: string } | null, reimbursementType: { __typename?: 'ReimbursementType', id: string, key: ReimbursementTypeKey }, organizationUnit?: { __typename?: 'OrganizationUnit', id: string, name: string } | null, signees: Array<{ __typename?: 'TemplateSignee', id: string, order: number, signeeType: SigneeType, requiredPermission?: { __typename?: 'Permission', id: string, key: PermissionKey } | null }> } };

export type CreateDocumentTemplateMutationVariables = Exact<{
  input: CreateDocumentTemplateInput;
}>;


export type CreateDocumentTemplateMutation = { __typename?: 'Mutation', createDocumentTemplate: { __typename?: 'DocumentTemplate', id: string, kind: DocumentKind, invoiceNumberFormat?: string | null, renewalCadence?: RenewalCadence | null, isDeleted: boolean, lastEditedAt?: string | null, lastEditedByUser?: { __typename?: 'User', id: string, name: string } | null, reimbursementType: { __typename?: 'ReimbursementType', id: string, key: ReimbursementTypeKey }, organizationUnit?: { __typename?: 'OrganizationUnit', id: string, name: string } | null, signees: Array<{ __typename?: 'TemplateSignee', id: string, order: number, signeeType: SigneeType, requiredPermission?: { __typename?: 'Permission', id: string, key: PermissionKey } | null }> } };

export type UpdateDocumentTemplateMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateDocumentTemplateInput;
}>;


export type UpdateDocumentTemplateMutation = { __typename?: 'Mutation', updateDocumentTemplate: { __typename?: 'DocumentTemplate', id: string, kind: DocumentKind, invoiceNumberFormat?: string | null, renewalCadence?: RenewalCadence | null, isDeleted: boolean, lastEditedAt?: string | null, lastEditedByUser?: { __typename?: 'User', id: string, name: string } | null, reimbursementType: { __typename?: 'ReimbursementType', id: string, key: ReimbursementTypeKey }, organizationUnit?: { __typename?: 'OrganizationUnit', id: string, name: string } | null, signees: Array<{ __typename?: 'TemplateSignee', id: string, order: number, signeeType: SigneeType, requiredPermission?: { __typename?: 'Permission', id: string, key: PermissionKey } | null }> } };

export type DeleteDocumentTemplateMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteDocumentTemplateMutation = { __typename?: 'Mutation', deleteDocumentTemplate: boolean };

export type GetBundleDownloadStatusQueryVariables = Exact<{
  volunteerId: Scalars['ID']['input'];
  reimbursementTypeId: Scalars['ID']['input'];
}>;


export type GetBundleDownloadStatusQuery = { __typename?: 'Query', bundleDownloadStatus?: { __typename?: 'BundleDownloadStatus', downloadedAt: string, volunteer: { __typename?: 'User', id: string, name: string }, reimbursementType: { __typename?: 'ReimbursementType', id: string, key: ReimbursementTypeKey }, downloadedByUser?: { __typename?: 'User', id: string, name: string } | null } | null };

export type RecordBundleDownloadMutationVariables = Exact<{
  volunteerId: Scalars['ID']['input'];
  reimbursementTypeId: Scalars['ID']['input'];
  invoiceIds?: InputMaybe<Array<Scalars['ID']['input']> | Scalars['ID']['input']>;
}>;


export type RecordBundleDownloadMutation = { __typename?: 'Mutation', recordBundleDownload: { __typename?: 'BundleDownloadStatus', downloadedAt: string, volunteer: { __typename?: 'User', id: string, name: string }, reimbursementType: { __typename?: 'ReimbursementType', id: string, key: ReimbursementTypeKey }, downloadedByUser?: { __typename?: 'User', id: string, name: string } | null } };

export type GetManualBaselineQueryVariables = Exact<{
  volunteerId: Scalars['ID']['input'];
  reimbursementTypeId: Scalars['ID']['input'];
  year: Scalars['Int']['input'];
}>;


export type GetManualBaselineQuery = { __typename?: 'Query', manualBaseline?: { __typename?: 'ManualBaseline', year: number, amountCents: number, updatedAt: string, volunteer: { __typename?: 'User', id: string, name: string }, reimbursementType: { __typename?: 'ReimbursementType', id: string, key: ReimbursementTypeKey }, updatedByUser?: { __typename?: 'User', id: string, name: string } | null } | null };

export type SetManualBaselineMutationVariables = Exact<{
  volunteerId: Scalars['ID']['input'];
  reimbursementTypeId: Scalars['ID']['input'];
  year: Scalars['Int']['input'];
  amountCents: Scalars['Int']['input'];
}>;


export type SetManualBaselineMutation = { __typename?: 'Mutation', setManualBaseline: { __typename?: 'ManualBaseline', year: number, amountCents: number, updatedAt: string, volunteer: { __typename?: 'User', id: string, name: string }, reimbursementType: { __typename?: 'ReimbursementType', id: string, key: ReimbursementTypeKey }, updatedByUser?: { __typename?: 'User', id: string, name: string } | null } };

export type MyDocumentsQueryVariables = Exact<{ [key: string]: never; }>;


export type MyDocumentsQuery = { __typename?: 'Query', myDocuments: Array<{ __typename?: 'MyDocumentsGroup', membershipId: string, organizationUnitId: string, organizationUnitName: string, organizationName: string, logoUrl?: string | null, contracts: Array<{ __typename?: 'Contract', id: string, contractStatus: ContractStatus, periodStart: string, periodEnd: string, isNonCompliant: boolean, declineReason?: string | null, declinedAt?: string | null, declinedAtSigneeType?: SigneeType | null, renewDate?: string | null, downloadUrl?: string | null, missingProfileFields: Array<string>, missingOrgProfileFields: Array<string>, createdAt: string, updatedAt?: string | null, declinedByUser?: { __typename?: 'User', id: string, name: string } | null, volunteer: { __typename?: 'User', id: string, name: string, image?: string | null }, reimbursementType: { __typename?: 'ReimbursementType', id: string, key: ReimbursementTypeKey }, documentTemplate: { __typename?: 'DocumentTemplate', id: string, kind: DocumentKind }, signatures: Array<{ __typename?: 'ContractSignature', id: string, order: number, signeeType: SigneeType, signedAt?: string | null, signedByUser?: { __typename?: 'User', id: string, name: string } | null, requiredPermission?: { __typename?: 'Permission', id: string, key: PermissionKey } | null }>, statusChanges: Array<{ __typename?: 'ContractStatusChange', id: string, type: DocumentStatusChange, occurredAt: string, actorUser?: { __typename?: 'User', id: string, name: string } | null }> }>, invoices: Array<{ __typename?: 'Invoice', id: string, invoiceStatus: InvoiceStatus, periodStart: string, periodEnd: string, totalAmountCents: number, totalHours: number, isNonCompliant: boolean, declineReason?: string | null, declinedAt?: string | null, declinedAtSigneeType?: SigneeType | null, downloadUrl?: string | null, missingProfileFields: Array<string>, missingOrgProfileFields: Array<string>, createdAt: string, updatedAt?: string | null, declinedByUser?: { __typename?: 'User', id: string, name: string } | null, volunteer: { __typename?: 'User', id: string, name: string, image?: string | null }, reimbursementType: { __typename?: 'ReimbursementType', id: string, key: ReimbursementTypeKey }, documentTemplate: { __typename?: 'DocumentTemplate', id: string, kind: DocumentKind }, invoiceTimeEntries: Array<{ __typename?: 'InvoiceTimeEntry', id: string }>, signatures: Array<{ __typename?: 'InvoiceSignature', id: string, order: number, signeeType: SigneeType, signedAt?: string | null, signedByUser?: { __typename?: 'User', id: string, name: string } | null, requiredPermission?: { __typename?: 'Permission', id: string, key: PermissionKey } | null }>, statusChanges: Array<{ __typename?: 'InvoiceStatusChange', id: string, type: DocumentStatusChange, occurredAt: string, actorUser?: { __typename?: 'User', id: string, name: string } | null }> }> }> };

export type MyDocumentSummaryQueryVariables = Exact<{ [key: string]: never; }>;


export type MyDocumentSummaryQuery = { __typename?: 'Query', myDocumentSummary: { __typename?: 'MyDocumentSummary', total: number, pending: number } };

export type EventListFieldsFragment = { __typename?: 'Event', id: string, title: string, slug: string, startsAt: string, endsAt: string, shiftsCount: number, requiredFormsCount: number, coverUrl?: string | null, signedUpCount: number };

export type RequiredFormFieldsFragment = { __typename?: 'RequirementForm', id: string, name: string, description?: string | null, settings: { __typename?: 'FormSettings', submitButtonLabel?: string | null, successTitle?: string | null, successMessage?: string | null }, blockRefs?: Array<{ __typename?: 'RequirementFormBlockRef', id: string, formId: string, blockId: string, fieldOrder: number, required?: boolean | null, block?: { __typename?: 'FormBlock', id: string, organizationId: string, title: string, description?: string | null, icon?: string | null, required: boolean, isEditable: boolean, fields?: Array<{ __typename?: 'FormBlockField', id: string, blockId: string, type: FieldType, label: string, placeholder?: string | null, description?: string | null, required: boolean, lockType: boolean, systemKey?: string | null, documentFileId?: string | null, documentDownloadUrl?: string | null, documentFilename?: string | null, documentLabel?: string | null, minAge?: number | null, fieldOrder: number, options?: Array<{ __typename?: 'SelectOption', label: string, value: string }> | null }> | null } | null }> | null };

export type RequiredFormRefFieldsFragment = { __typename?: 'RequiredFormRef', order: number, form: { __typename?: 'RequirementForm', id: string, name: string, description?: string | null, settings: { __typename?: 'FormSettings', submitButtonLabel?: string | null, successTitle?: string | null, successMessage?: string | null }, blockRefs?: Array<{ __typename?: 'RequirementFormBlockRef', id: string, formId: string, blockId: string, fieldOrder: number, required?: boolean | null, block?: { __typename?: 'FormBlock', id: string, organizationId: string, title: string, description?: string | null, icon?: string | null, required: boolean, isEditable: boolean, fields?: Array<{ __typename?: 'FormBlockField', id: string, blockId: string, type: FieldType, label: string, placeholder?: string | null, description?: string | null, required: boolean, lockType: boolean, systemKey?: string | null, documentFileId?: string | null, documentDownloadUrl?: string | null, documentFilename?: string | null, documentLabel?: string | null, minAge?: number | null, fieldOrder: number, options?: Array<{ __typename?: 'SelectOption', label: string, value: string }> | null }> | null } | null }> | null } };

export type RequiredFormWithStatusFieldsFragment = { __typename?: 'RequiredFormWithStatus', order: number, submitted: boolean, submissionId?: string | null, targetType: RequiredFormTargetType, targetId: string, form: { __typename?: 'RequirementForm', id: string, name: string, description?: string | null, settings: { __typename?: 'FormSettings', submitButtonLabel?: string | null, successTitle?: string | null, successMessage?: string | null }, blockRefs?: Array<{ __typename?: 'RequirementFormBlockRef', id: string, formId: string, blockId: string, fieldOrder: number, required?: boolean | null, block?: { __typename?: 'FormBlock', id: string, organizationId: string, title: string, description?: string | null, icon?: string | null, required: boolean, isEditable: boolean, fields?: Array<{ __typename?: 'FormBlockField', id: string, blockId: string, type: FieldType, label: string, placeholder?: string | null, description?: string | null, required: boolean, lockType: boolean, systemKey?: string | null, documentFileId?: string | null, documentDownloadUrl?: string | null, documentFilename?: string | null, documentLabel?: string | null, minAge?: number | null, fieldOrder: number, options?: Array<{ __typename?: 'SelectOption', label: string, value: string }> | null }> | null } | null }> | null } };

export type EventDetailFieldsFragment = { __typename?: 'Event', createdAt: string, location?: string | null, coverUrl?: string | null, logoUrl?: string | null, id: string, title: string, slug: string, startsAt: string, endsAt: string, shiftsCount: number, requiredFormsCount: number, signedUpCount: number, organizer?: { __typename?: 'User', id: string, name: string, image?: string | null } | null, requiredForms: Array<{ __typename?: 'RequiredFormRef', order: number, form: { __typename?: 'RequirementForm', id: string, name: string, description?: string | null, settings: { __typename?: 'FormSettings', submitButtonLabel?: string | null, successTitle?: string | null, successMessage?: string | null }, blockRefs?: Array<{ __typename?: 'RequirementFormBlockRef', id: string, formId: string, blockId: string, fieldOrder: number, required?: boolean | null, block?: { __typename?: 'FormBlock', id: string, organizationId: string, title: string, description?: string | null, icon?: string | null, required: boolean, isEditable: boolean, fields?: Array<{ __typename?: 'FormBlockField', id: string, blockId: string, type: FieldType, label: string, placeholder?: string | null, description?: string | null, required: boolean, lockType: boolean, systemKey?: string | null, documentFileId?: string | null, documentDownloadUrl?: string | null, documentFilename?: string | null, documentLabel?: string | null, minAge?: number | null, fieldOrder: number, options?: Array<{ __typename?: 'SelectOption', label: string, value: string }> | null }> | null } | null }> | null } }> };

export type GetEventsQueryVariables = Exact<{
  limit: Scalars['Int']['input'];
  offset: Scalars['Int']['input'];
}>;


export type GetEventsQuery = { __typename?: 'Query', events: { __typename?: 'EventPaginatedResponse', items: Array<{ __typename?: 'Event', id: string, title: string, slug: string, startsAt: string, endsAt: string, shiftsCount: number, requiredFormsCount: number, coverUrl?: string | null, signedUpCount: number }>, pagination: { __typename?: 'PaginationInfo', total: number, limit: number, offset: number, hasMore: boolean } } };

export type MyEventFieldsFragment = { __typename?: 'Event', id: string, title: string, startsAt: string, endsAt: string, location?: string | null, myInvitedAt?: string | null, shiftsCount: number, coverUrl?: string | null, organizationUnit?: { __typename?: 'EventOrganizationUnit', id: string, name: string, logoUrl?: string | null } | null };

export type GetMyEventsQueryVariables = Exact<{
  includePast?: InputMaybe<Scalars['Boolean']['input']>;
  startsAfter?: InputMaybe<Scalars['DateTime']['input']>;
  endsBefore?: InputMaybe<Scalars['DateTime']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<SortOrder>;
  statuses?: InputMaybe<Array<EventInviteStatus> | EventInviteStatus>;
}>;


export type GetMyEventsQuery = { __typename?: 'Query', myEvents: { __typename?: 'EventPaginatedResponse', items: Array<{ __typename?: 'Event', id: string, title: string, startsAt: string, endsAt: string, location?: string | null, myInvitedAt?: string | null, shiftsCount: number, coverUrl?: string | null, organizationUnit?: { __typename?: 'EventOrganizationUnit', id: string, name: string, logoUrl?: string | null } | null }>, pagination: { __typename?: 'PaginationInfo', total: number, limit: number, offset: number, hasMore: boolean } } };

export type DiscoverEventFieldsFragment = { __typename?: 'Event', id: string, title: string, startsAt: string, endsAt: string, shiftsCount: number, coverUrl?: string | null, organizationUnit?: { __typename?: 'EventOrganizationUnit', id: string, name: string, logoUrl?: string | null } | null };

export type GetAvailableEventsQueryVariables = Exact<{
  startsAfter?: InputMaybe<Scalars['DateTime']['input']>;
  endsBefore?: InputMaybe<Scalars['DateTime']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  organizationUnitIds?: InputMaybe<Array<Scalars['ID']['input']> | Scalars['ID']['input']>;
}>;


export type GetAvailableEventsQuery = { __typename?: 'Query', availableEvents: { __typename?: 'EventPaginatedResponse', items: Array<{ __typename?: 'Event', id: string, title: string, startsAt: string, endsAt: string, shiftsCount: number, coverUrl?: string | null, organizationUnit?: { __typename?: 'EventOrganizationUnit', id: string, name: string, logoUrl?: string | null } | null }>, pagination: { __typename?: 'PaginationInfo', total: number, limit: number, offset: number, hasMore: boolean } } };

export type GetEventQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetEventQuery = { __typename?: 'Query', event: { __typename?: 'Event', createdAt: string, location?: string | null, coverUrl?: string | null, logoUrl?: string | null, id: string, title: string, slug: string, startsAt: string, endsAt: string, shiftsCount: number, requiredFormsCount: number, signedUpCount: number, organizer?: { __typename?: 'User', id: string, name: string, image?: string | null } | null, requiredForms: Array<{ __typename?: 'RequiredFormRef', order: number, form: { __typename?: 'RequirementForm', id: string, name: string, description?: string | null, settings: { __typename?: 'FormSettings', submitButtonLabel?: string | null, successTitle?: string | null, successMessage?: string | null }, blockRefs?: Array<{ __typename?: 'RequirementFormBlockRef', id: string, formId: string, blockId: string, fieldOrder: number, required?: boolean | null, block?: { __typename?: 'FormBlock', id: string, organizationId: string, title: string, description?: string | null, icon?: string | null, required: boolean, isEditable: boolean, fields?: Array<{ __typename?: 'FormBlockField', id: string, blockId: string, type: FieldType, label: string, placeholder?: string | null, description?: string | null, required: boolean, lockType: boolean, systemKey?: string | null, documentFileId?: string | null, documentDownloadUrl?: string | null, documentFilename?: string | null, documentLabel?: string | null, minAge?: number | null, fieldOrder: number, options?: Array<{ __typename?: 'SelectOption', label: string, value: string }> | null }> | null } | null }> | null } }> } };

export type GetEventInvitesQueryVariables = Exact<{
  eventId: Scalars['ID']['input'];
}>;


export type GetEventInvitesQuery = { __typename?: 'Query', eventInvites: Array<{ __typename?: 'EventInvite', id: string, status: EventInviteStatus, user: { __typename?: 'User', id: string, name: string, email: string, image?: string | null, checkInId: string } }> };

export type CreateEventMutationVariables = Exact<{
  input: CreateEventInput;
}>;


export type CreateEventMutation = { __typename?: 'Mutation', createEvent: { __typename?: 'Event', createdAt: string, location?: string | null, coverUrl?: string | null, logoUrl?: string | null, id: string, title: string, slug: string, startsAt: string, endsAt: string, shiftsCount: number, requiredFormsCount: number, signedUpCount: number, organizer?: { __typename?: 'User', id: string, name: string, image?: string | null } | null, requiredForms: Array<{ __typename?: 'RequiredFormRef', order: number, form: { __typename?: 'RequirementForm', id: string, name: string, description?: string | null, settings: { __typename?: 'FormSettings', submitButtonLabel?: string | null, successTitle?: string | null, successMessage?: string | null }, blockRefs?: Array<{ __typename?: 'RequirementFormBlockRef', id: string, formId: string, blockId: string, fieldOrder: number, required?: boolean | null, block?: { __typename?: 'FormBlock', id: string, organizationId: string, title: string, description?: string | null, icon?: string | null, required: boolean, isEditable: boolean, fields?: Array<{ __typename?: 'FormBlockField', id: string, blockId: string, type: FieldType, label: string, placeholder?: string | null, description?: string | null, required: boolean, lockType: boolean, systemKey?: string | null, documentFileId?: string | null, documentDownloadUrl?: string | null, documentFilename?: string | null, documentLabel?: string | null, minAge?: number | null, fieldOrder: number, options?: Array<{ __typename?: 'SelectOption', label: string, value: string }> | null }> | null } | null }> | null } }> } };

export type UpdateEventMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateEventInput;
}>;


export type UpdateEventMutation = { __typename?: 'Mutation', updateEvent: { __typename?: 'Event', createdAt: string, location?: string | null, coverUrl?: string | null, logoUrl?: string | null, id: string, title: string, slug: string, startsAt: string, endsAt: string, shiftsCount: number, requiredFormsCount: number, signedUpCount: number, organizer?: { __typename?: 'User', id: string, name: string, image?: string | null } | null, requiredForms: Array<{ __typename?: 'RequiredFormRef', order: number, form: { __typename?: 'RequirementForm', id: string, name: string, description?: string | null, settings: { __typename?: 'FormSettings', submitButtonLabel?: string | null, successTitle?: string | null, successMessage?: string | null }, blockRefs?: Array<{ __typename?: 'RequirementFormBlockRef', id: string, formId: string, blockId: string, fieldOrder: number, required?: boolean | null, block?: { __typename?: 'FormBlock', id: string, organizationId: string, title: string, description?: string | null, icon?: string | null, required: boolean, isEditable: boolean, fields?: Array<{ __typename?: 'FormBlockField', id: string, blockId: string, type: FieldType, label: string, placeholder?: string | null, description?: string | null, required: boolean, lockType: boolean, systemKey?: string | null, documentFileId?: string | null, documentDownloadUrl?: string | null, documentFilename?: string | null, documentLabel?: string | null, minAge?: number | null, fieldOrder: number, options?: Array<{ __typename?: 'SelectOption', label: string, value: string }> | null }> | null } | null }> | null } }> } };

export type DeleteEventMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteEventMutation = { __typename?: 'Mutation', deleteEvent: { __typename?: 'Event', id: string } };

export type InviteMembersToEventMutationVariables = Exact<{
  eventId: Scalars['ID']['input'];
  memberIds: Array<Scalars['String']['input']> | Scalars['String']['input'];
}>;


export type InviteMembersToEventMutation = { __typename?: 'Mutation', inviteMembersToEvent: { __typename?: 'Event', id: string } };

export type UpdateEventInviteStatusMutationVariables = Exact<{
  eventId: Scalars['ID']['input'];
  status: EventInviteStatus;
  userId?: InputMaybe<Scalars['String']['input']>;
}>;


export type UpdateEventInviteStatusMutation = { __typename?: 'Mutation', updateEventInviteStatus: { __typename?: 'EventInvite', id: string, status: EventInviteStatus, userId: string } };

export type PublicEventOrganizationUnitFieldsFragment = { __typename?: 'EventOrganizationUnit', id: string, name: string, slug: string, logoUrl?: string | null, myMembershipState: JoinStatus, requiredForms: Array<{ __typename?: 'RequiredFormRef', order: number, form: { __typename?: 'RequirementForm', id: string, name: string, description?: string | null, settings: { __typename?: 'FormSettings', submitButtonLabel?: string | null, successTitle?: string | null, successMessage?: string | null }, blockRefs?: Array<{ __typename?: 'RequirementFormBlockRef', id: string, formId: string, blockId: string, fieldOrder: number, required?: boolean | null, block?: { __typename?: 'FormBlock', id: string, organizationId: string, title: string, description?: string | null, icon?: string | null, required: boolean, isEditable: boolean, fields?: Array<{ __typename?: 'FormBlockField', id: string, blockId: string, type: FieldType, label: string, placeholder?: string | null, description?: string | null, required: boolean, lockType: boolean, systemKey?: string | null, documentFileId?: string | null, documentDownloadUrl?: string | null, documentFilename?: string | null, documentLabel?: string | null, minAge?: number | null, fieldOrder: number, options?: Array<{ __typename?: 'SelectOption', label: string, value: string }> | null }> | null } | null }> | null } }> };

export type PublicShiftInstanceFieldsFragment = { __typename?: 'ShiftInstance', id: string, actualStartsAt: string, actualEndsAt: string, overrideTitle?: string | null, overrideMaxVolunteers?: number | null, filledCount: number, spotsLeft?: number | null };

export type PublicShiftFieldsFragment = { __typename?: 'Shift', id: string, title: string, maxVolunteers?: number | null, instances: Array<{ __typename?: 'ShiftInstance', id: string, actualStartsAt: string, actualEndsAt: string, overrideTitle?: string | null, overrideMaxVolunteers?: number | null, filledCount: number, spotsLeft?: number | null }> };

export type PublicEventFieldsFragment = { __typename?: 'Event', id: string, title: string, slug: string, description?: string | null, location?: string | null, coverImageUrl?: string | null, startsAt: string, endsAt: string, shiftsCount: number, myJoinStatus: JoinStatus, organizationUnit?: { __typename?: 'EventOrganizationUnit', id: string, name: string, slug: string, logoUrl?: string | null, myMembershipState: JoinStatus, requiredForms: Array<{ __typename?: 'RequiredFormRef', order: number, form: { __typename?: 'RequirementForm', id: string, name: string, description?: string | null, settings: { __typename?: 'FormSettings', submitButtonLabel?: string | null, successTitle?: string | null, successMessage?: string | null }, blockRefs?: Array<{ __typename?: 'RequirementFormBlockRef', id: string, formId: string, blockId: string, fieldOrder: number, required?: boolean | null, block?: { __typename?: 'FormBlock', id: string, organizationId: string, title: string, description?: string | null, icon?: string | null, required: boolean, isEditable: boolean, fields?: Array<{ __typename?: 'FormBlockField', id: string, blockId: string, type: FieldType, label: string, placeholder?: string | null, description?: string | null, required: boolean, lockType: boolean, systemKey?: string | null, documentFileId?: string | null, documentDownloadUrl?: string | null, documentFilename?: string | null, documentLabel?: string | null, minAge?: number | null, fieldOrder: number, options?: Array<{ __typename?: 'SelectOption', label: string, value: string }> | null }> | null } | null }> | null } }> } | null, shifts: Array<{ __typename?: 'Shift', id: string, title: string, maxVolunteers?: number | null, instances: Array<{ __typename?: 'ShiftInstance', id: string, actualStartsAt: string, actualEndsAt: string, overrideTitle?: string | null, overrideMaxVolunteers?: number | null, filledCount: number, spotsLeft?: number | null }> }>, requiredForms: Array<{ __typename?: 'RequiredFormRef', order: number, form: { __typename?: 'RequirementForm', id: string, name: string, description?: string | null, settings: { __typename?: 'FormSettings', submitButtonLabel?: string | null, successTitle?: string | null, successMessage?: string | null }, blockRefs?: Array<{ __typename?: 'RequirementFormBlockRef', id: string, formId: string, blockId: string, fieldOrder: number, required?: boolean | null, block?: { __typename?: 'FormBlock', id: string, organizationId: string, title: string, description?: string | null, icon?: string | null, required: boolean, isEditable: boolean, fields?: Array<{ __typename?: 'FormBlockField', id: string, blockId: string, type: FieldType, label: string, placeholder?: string | null, description?: string | null, required: boolean, lockType: boolean, systemKey?: string | null, documentFileId?: string | null, documentDownloadUrl?: string | null, documentFilename?: string | null, documentLabel?: string | null, minAge?: number | null, fieldOrder: number, options?: Array<{ __typename?: 'SelectOption', label: string, value: string }> | null }> | null } | null }> | null } }> };

export type GetPublicEventQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetPublicEventQuery = { __typename?: 'Query', publicEvent: { __typename?: 'Event', id: string, title: string, slug: string, description?: string | null, location?: string | null, coverImageUrl?: string | null, startsAt: string, endsAt: string, shiftsCount: number, myJoinStatus: JoinStatus, organizationUnit?: { __typename?: 'EventOrganizationUnit', id: string, name: string, slug: string, logoUrl?: string | null, myMembershipState: JoinStatus, requiredForms: Array<{ __typename?: 'RequiredFormRef', order: number, form: { __typename?: 'RequirementForm', id: string, name: string, description?: string | null, settings: { __typename?: 'FormSettings', submitButtonLabel?: string | null, successTitle?: string | null, successMessage?: string | null }, blockRefs?: Array<{ __typename?: 'RequirementFormBlockRef', id: string, formId: string, blockId: string, fieldOrder: number, required?: boolean | null, block?: { __typename?: 'FormBlock', id: string, organizationId: string, title: string, description?: string | null, icon?: string | null, required: boolean, isEditable: boolean, fields?: Array<{ __typename?: 'FormBlockField', id: string, blockId: string, type: FieldType, label: string, placeholder?: string | null, description?: string | null, required: boolean, lockType: boolean, systemKey?: string | null, documentFileId?: string | null, documentDownloadUrl?: string | null, documentFilename?: string | null, documentLabel?: string | null, minAge?: number | null, fieldOrder: number, options?: Array<{ __typename?: 'SelectOption', label: string, value: string }> | null }> | null } | null }> | null } }> } | null, shifts: Array<{ __typename?: 'Shift', id: string, title: string, maxVolunteers?: number | null, instances: Array<{ __typename?: 'ShiftInstance', id: string, actualStartsAt: string, actualEndsAt: string, overrideTitle?: string | null, overrideMaxVolunteers?: number | null, filledCount: number, spotsLeft?: number | null }> }>, requiredForms: Array<{ __typename?: 'RequiredFormRef', order: number, form: { __typename?: 'RequirementForm', id: string, name: string, description?: string | null, settings: { __typename?: 'FormSettings', submitButtonLabel?: string | null, successTitle?: string | null, successMessage?: string | null }, blockRefs?: Array<{ __typename?: 'RequirementFormBlockRef', id: string, formId: string, blockId: string, fieldOrder: number, required?: boolean | null, block?: { __typename?: 'FormBlock', id: string, organizationId: string, title: string, description?: string | null, icon?: string | null, required: boolean, isEditable: boolean, fields?: Array<{ __typename?: 'FormBlockField', id: string, blockId: string, type: FieldType, label: string, placeholder?: string | null, description?: string | null, required: boolean, lockType: boolean, systemKey?: string | null, documentFileId?: string | null, documentDownloadUrl?: string | null, documentFilename?: string | null, documentLabel?: string | null, minAge?: number | null, fieldOrder: number, options?: Array<{ __typename?: 'SelectOption', label: string, value: string }> | null }> | null } | null }> | null } }> } };

export type JoinEventMutationVariables = Exact<{
  eventId: Scalars['ID']['input'];
}>;


export type JoinEventMutation = { __typename?: 'Mutation', joinEvent: { __typename?: 'JoinEventResult', status: JoinStatus, event: { __typename?: 'Event', id: string }, requiredForms?: Array<{ __typename?: 'RequiredFormWithStatus', order: number, submitted: boolean, submissionId?: string | null, targetType: RequiredFormTargetType, targetId: string, form: { __typename?: 'RequirementForm', id: string, name: string, description?: string | null, settings: { __typename?: 'FormSettings', submitButtonLabel?: string | null, successTitle?: string | null, successMessage?: string | null }, blockRefs?: Array<{ __typename?: 'RequirementFormBlockRef', id: string, formId: string, blockId: string, fieldOrder: number, required?: boolean | null, block?: { __typename?: 'FormBlock', id: string, organizationId: string, title: string, description?: string | null, icon?: string | null, required: boolean, isEditable: boolean, fields?: Array<{ __typename?: 'FormBlockField', id: string, blockId: string, type: FieldType, label: string, placeholder?: string | null, description?: string | null, required: boolean, lockType: boolean, systemKey?: string | null, documentFileId?: string | null, documentDownloadUrl?: string | null, documentFilename?: string | null, documentLabel?: string | null, minAge?: number | null, fieldOrder: number, options?: Array<{ __typename?: 'SelectOption', label: string, value: string }> | null }> | null } | null }> | null } }> | null } };

export type SetEventRequiredFormsMutationVariables = Exact<{
  eventId: Scalars['ID']['input'];
  formIds: Array<Scalars['String']['input']> | Scalars['String']['input'];
}>;


export type SetEventRequiredFormsMutation = { __typename?: 'Mutation', setEventRequiredForms: Array<{ __typename?: 'RequiredFormRef', order: number, form: { __typename?: 'RequirementForm', id: string, name: string, description?: string | null, settings: { __typename?: 'FormSettings', submitButtonLabel?: string | null, successTitle?: string | null, successMessage?: string | null }, blockRefs?: Array<{ __typename?: 'RequirementFormBlockRef', id: string, formId: string, blockId: string, fieldOrder: number, required?: boolean | null, block?: { __typename?: 'FormBlock', id: string, organizationId: string, title: string, description?: string | null, icon?: string | null, required: boolean, isEditable: boolean, fields?: Array<{ __typename?: 'FormBlockField', id: string, blockId: string, type: FieldType, label: string, placeholder?: string | null, description?: string | null, required: boolean, lockType: boolean, systemKey?: string | null, documentFileId?: string | null, documentDownloadUrl?: string | null, documentFilename?: string | null, documentLabel?: string | null, minAge?: number | null, fieldOrder: number, options?: Array<{ __typename?: 'SelectOption', label: string, value: string }> | null }> | null } | null }> | null } }> };

export type GetOrganizationUnitMembershipsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetOrganizationUnitMembershipsQuery = { __typename?: 'Query', memberships: Array<{ __typename?: 'Membership', id: string, user: { __typename?: 'User', id: string, name: string, email: string, image?: string | null, checkInId: string }, organizationUnit: { __typename?: 'OrganizationUnit', id: string, name: string }, roles: Array<{ __typename?: 'Role', id: string, name: string, description?: string | null, isInternal: boolean }> }> };

export type GetMyMembershipStatusQueryVariables = Exact<{
  organizationUnitId: Scalars['ID']['input'];
}>;


export type GetMyMembershipStatusQuery = { __typename?: 'Query', myMembershipStatus: boolean };

export type UpdateMembershipRolesMutationVariables = Exact<{
  membershipId: Scalars['ID']['input'];
  roleIds: Array<Scalars['ID']['input']> | Scalars['ID']['input'];
}>;


export type UpdateMembershipRolesMutation = { __typename?: 'Mutation', updateMembershipRoles: { __typename?: 'Membership', id: string, user: { __typename?: 'User', id: string, name: string, email: string, image?: string | null, checkInId: string }, organizationUnit: { __typename?: 'OrganizationUnit', id: string, name: string }, roles: Array<{ __typename?: 'Role', id: string, name: string, description?: string | null, isInternal: boolean }> } };

export type LeaveMembershipMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type LeaveMembershipMutation = { __typename?: 'Mutation', leaveMembership: { __typename?: 'Membership', id: string } };

export type RemoveMembershipMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type RemoveMembershipMutation = { __typename?: 'Mutation', removeMembership: { __typename?: 'Membership', id: string } };

export type MyMembershipsQueryVariables = Exact<{ [key: string]: never; }>;


export type MyMembershipsQuery = { __typename?: 'Query', myMemberships: Array<{ __typename?: 'Membership', id: string, createdAt: string, organizationUnit: { __typename?: 'OrganizationUnit', id: string, name: string, logoUrl?: string | null, type: { __typename?: 'OrganizationUnitType', icon: string }, parent?: { __typename?: 'OrganizationUnit', id: string } | null, organization: { __typename?: 'Organization', name: string } }, roles: Array<{ __typename?: 'Role', id: string, name: string }> }> };

export type MyMembershipQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type MyMembershipQuery = { __typename?: 'Query', myMembership?: { __typename?: 'Membership', id: string, createdAt: string, organizationUnit: { __typename?: 'OrganizationUnit', id: string, name: string, logoUrl?: string | null, type: { __typename?: 'OrganizationUnitType', icon: string }, parent?: { __typename?: 'OrganizationUnit', id: string } | null, organization: { __typename?: 'Organization', name: string } }, roles: Array<{ __typename?: 'Role', id: string, name: string }> } | null };

export type JoinOrganizationMutationVariables = Exact<{
  organizationUnitId: Scalars['ID']['input'];
}>;


export type JoinOrganizationMutation = { __typename?: 'Mutation', joinOrganization: { __typename?: 'JoinOrganizationResult', status: JoinStatus, membershipRequestId?: string | null, requirementProfile?: { __typename?: 'RequirementProfile', id: string, name: string, description?: string | null, requirements?: Array<{ __typename?: 'Requirement', id: string, name: string, description?: string | null, type: RequirementType, mandatory: boolean }> | null } | null, requirementStatuses?: Array<{ __typename?: 'UserRequirementStatus', requirementId: string, name: string, status: RequirementFulfillmentStatus }> | null, requiredForms?: Array<{ __typename?: 'RequiredFormWithStatus', order: number, submitted: boolean, submissionId?: string | null, form: { __typename?: 'RequirementForm', id: string, name: string, description?: string | null } }> | null } };

export type ApproveMembershipRequestMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  organizationUnitId: Scalars['ID']['input'];
}>;


export type ApproveMembershipRequestMutation = { __typename?: 'Mutation', approveMembershipRequest: { __typename?: 'MembershipRequest', id: string } };

export type RejectMembershipRequestMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  organizationUnitId: Scalars['ID']['input'];
  rejectionReason: Scalars['String']['input'];
}>;


export type RejectMembershipRequestMutation = { __typename?: 'Mutation', rejectMembershipRequest: { __typename?: 'MembershipRequest', id: string } };

export type CancelMembershipRequestMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  organizationUnitId: Scalars['ID']['input'];
}>;


export type CancelMembershipRequestMutation = { __typename?: 'Mutation', cancelMembershipRequest: { __typename?: 'MembershipRequest', id: string } };

export type RemoveMembershipRequestMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type RemoveMembershipRequestMutation = { __typename?: 'Mutation', removeMembershipRequest: { __typename?: 'MembershipRequest', id: string } };

export type GetMembershipRequestsQueryVariables = Exact<{
  status?: InputMaybe<MembershipRequestStatus>;
  limit: Scalars['Int']['input'];
  offset: Scalars['Int']['input'];
}>;


export type GetMembershipRequestsQuery = { __typename?: 'Query', membershipRequests: { __typename?: 'MembershipRequestPaginatedResponse', items: Array<{ __typename?: 'MembershipRequest', id: string, status: MembershipRequestStatus, reviewedAt?: string | null, rejectionReason?: string | null, createdAt: string, updatedAt: string, organizationUnit: { __typename?: 'OrganizationUnit', id: string, name: string }, user: { __typename?: 'User', id: string, name: string, email: string, image?: string | null, checkInId: string }, reviewedBy?: { __typename?: 'User', id: string, name: string } | null }> } };

export type GetMembershipRequestCountQueryVariables = Exact<{
  status?: InputMaybe<MembershipRequestStatus>;
}>;


export type GetMembershipRequestCountQuery = { __typename?: 'Query', membershipRequestCount: number };

export type GetMyMembershipRequestsQueryVariables = Exact<{
  limit: Scalars['Int']['input'];
  offset: Scalars['Int']['input'];
}>;


export type GetMyMembershipRequestsQuery = { __typename?: 'Query', myMembershipRequests: { __typename?: 'MembershipRequestPaginatedResponse', items: Array<{ __typename?: 'MembershipRequest', id: string, status: MembershipRequestStatus, reviewedAt?: string | null, rejectionReason?: string | null, createdAt: string, organizationUnit: { __typename?: 'OrganizationUnit', id: string, name: string, logoUrl?: string | null, type: { __typename?: 'OrganizationUnitType', icon: string }, parent?: { __typename?: 'OrganizationUnit', id: string } | null, organization: { __typename?: 'Organization', name: string } }, user: { __typename?: 'User', id: string, name: string, email: string }, contact?: { __typename?: 'User', id: string, name: string } | null }> } };

export type CheckInApproveMembershipRequestMutationVariables = Exact<{
  requestId: Scalars['ID']['input'];
}>;


export type CheckInApproveMembershipRequestMutation = { __typename?: 'Mutation', checkInApproveMembershipRequest: { __typename?: 'MembershipRequest', id: string, status: MembershipRequestStatus } };

export type GetOrganizationQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetOrganizationQuery = { __typename?: 'Query', organization?: { __typename?: 'Organization', id: string, name: string, slug: string, description?: string | null, logoUrl?: string | null, websiteUrl?: string | null, contactEmail?: string | null, phone?: string | null, address?: string | null, city?: string | null, zipCode?: string | null, createdAt: string, updatedAt?: string | null } | null };

export type GetOrganizationBySlugQueryVariables = Exact<{
  slug: Scalars['String']['input'];
}>;


export type GetOrganizationBySlugQuery = { __typename?: 'Query', organizationBySlug: { __typename?: 'Organization', id: string, name: string, slug: string, description?: string | null, logoUrl?: string | null, websiteUrl?: string | null, contactEmail?: string | null, phone?: string | null, address?: string | null, createdAt: string } };

export type GetOrganizationRootQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetOrganizationRootQuery = { __typename?: 'Query', organization?: { __typename?: 'Organization', id: string, root: { __typename?: 'OrganizationUnit', id: string } } | null };

export type GetOrganizationUnitQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetOrganizationUnitQuery = { __typename?: 'Query', organizationUnit?: { __typename?: 'OrganizationUnit', id: string, slug: string, name: string, description?: string | null, logoUrl?: string | null, websiteUrl?: string | null, contactEmail?: string | null, phone?: string | null, address?: string | null, city?: string | null, zipCode?: string | null, legalRep?: string | null, organizationId: string, requiredForms: Array<{ __typename?: 'RequiredFormRef', order: number, form: { __typename?: 'RequirementForm', id: string, name: string, description?: string | null, settings: { __typename?: 'FormSettings', submitButtonLabel?: string | null, successTitle?: string | null, successMessage?: string | null }, blockRefs?: Array<{ __typename?: 'RequirementFormBlockRef', id: string, formId: string, blockId: string, fieldOrder: number, required?: boolean | null, block?: { __typename?: 'FormBlock', id: string, organizationId: string, title: string, description?: string | null, icon?: string | null, required: boolean, isEditable: boolean, fields?: Array<{ __typename?: 'FormBlockField', id: string, blockId: string, type: FieldType, label: string, placeholder?: string | null, description?: string | null, required: boolean, lockType: boolean, systemKey?: string | null, documentFileId?: string | null, documentDownloadUrl?: string | null, documentFilename?: string | null, documentLabel?: string | null, minAge?: number | null, fieldOrder: number, options?: Array<{ __typename?: 'SelectOption', label: string, value: string }> | null }> | null } | null }> | null } }>, parent?: { __typename?: 'OrganizationUnit', id: string, name: string } | null, type: { __typename?: 'OrganizationUnitType', id: string, name: string, icon: string } } | null };

export type GetOrganizationVolunteersByUnitQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetOrganizationVolunteersByUnitQuery = { __typename?: 'Query', members: Array<{ __typename?: 'User', id: string, name: string, email: string, image?: string | null, checkInId: string }> };

export type GetOrganizationUnitWithOrgQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetOrganizationUnitWithOrgQuery = { __typename?: 'Query', organizationUnit?: { __typename?: 'OrganizationUnit', id: string, name: string, organization: { __typename?: 'Organization', name: string } } | null };

export type GetOrganizationUnitPublicInfoQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetOrganizationUnitPublicInfoQuery = { __typename?: 'Query', organizationUnit?: { __typename?: 'OrganizationUnit', id: string, name: string, description?: string | null, logoUrl?: string | null, websiteUrl?: string | null, contactEmail?: string | null, phone?: string | null } | null };

export type GetOrganizationsWithRootQueryVariables = Exact<{
  limit: Scalars['Int']['input'];
  offset: Scalars['Int']['input'];
}>;


export type GetOrganizationsWithRootQuery = { __typename?: 'Query', organizations: { __typename?: 'OrganizationPaginatedResponse', items: Array<{ __typename?: 'Organization', id: string, name: string, description?: string | null, logoUrl?: string | null, root: { __typename?: 'OrganizationUnit', id: string, slug: string, name: string, description?: string | null, logoUrl?: string | null, address?: string | null } }> } };

export type GetMyOrganizationUnitsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMyOrganizationUnitsQuery = { __typename?: 'Query', myOrganizationUnits: Array<{ __typename?: 'OrganizationUnit', id: string, slug: string, name: string, description?: string | null, logoUrl?: string | null, address?: string | null, city?: string | null, legalRep?: string | null, parent?: { __typename?: 'OrganizationUnit', id: string } | null, organization: { __typename?: 'Organization', id: string, name: string, description?: string | null, logoUrl?: string | null, accountingEnabled: boolean } }> };

export type GetMyAdminstableOrganizationUnitsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMyAdminstableOrganizationUnitsQuery = { __typename?: 'Query', myAdminstableOrganizationUnits: Array<{ __typename?: 'OrganizationUnit', id: string, slug: string, name: string, description?: string | null, logoUrl?: string | null, address?: string | null, city?: string | null, legalRep?: string | null, parent?: { __typename?: 'OrganizationUnit', id: string } | null, organization: { __typename?: 'Organization', id: string, name: string, description?: string | null, logoUrl?: string | null, accountingEnabled: boolean } }> };

export type GetMyCheckInAdministrableOrganizationUnitsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMyCheckInAdministrableOrganizationUnitsQuery = { __typename?: 'Query', myCheckInAdministrableOrganizationUnits: Array<{ __typename?: 'OrganizationUnit', id: string, slug: string, name: string, description?: string | null, logoUrl?: string | null, address?: string | null, city?: string | null, legalRep?: string | null, parent?: { __typename?: 'OrganizationUnit', id: string } | null, organization: { __typename?: 'Organization', id: string, name: string, description?: string | null, logoUrl?: string | null, accountingEnabled: boolean } }> };

export type GetOrganizationsQueryVariables = Exact<{
  limit: Scalars['Int']['input'];
  offset: Scalars['Int']['input'];
}>;


export type GetOrganizationsQuery = { __typename?: 'Query', organizations: { __typename?: 'OrganizationPaginatedResponse', items: Array<{ __typename?: 'Organization', id: string, name: string, slug: string, description?: string | null, logoUrl?: string | null, createdAt: string }>, pagination: { __typename?: 'PaginationInfo', total: number, limit: number, offset: number, hasMore: boolean } } };

export type CreateOrganizationMutationVariables = Exact<{
  input: CreateOrganizationInput;
}>;


export type CreateOrganizationMutation = { __typename?: 'Mutation', createOrganization: { __typename?: 'Organization', id: string, name: string, slug: string, description?: string | null, logoUrl?: string | null, websiteUrl?: string | null, createdAt: string, root: { __typename?: 'OrganizationUnit', id: string } } };

export type UpdateOrganizationMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateOrganizationInput;
}>;


export type UpdateOrganizationMutation = { __typename?: 'Mutation', updateOrganization: { __typename?: 'Organization', id: string, name: string, address?: string | null, city?: string | null, zipCode?: string | null } };

export type GetOrganizationTreeQueryVariables = Exact<{ [key: string]: never; }>;


export type GetOrganizationTreeQuery = { __typename?: 'Query', organizationTree?: { __typename?: 'OrganizationTree', root: Record<string, unknown> } | null };

export type GetOrganizationUnitTypesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetOrganizationUnitTypesQuery = { __typename?: 'Query', organizationUnitTypes: Array<{ __typename?: 'OrganizationUnitType', id: string, name: string, description?: string | null, icon: string }> };

export type CreateOrganizationUnitMutationVariables = Exact<{
  input: CreateOrganizationUnitInput;
}>;


export type CreateOrganizationUnitMutation = { __typename?: 'Mutation', createOrganizationUnit: { __typename?: 'OrganizationUnit', id: string, name: string, slug: string, deletedAt?: string | null, parent?: { __typename?: 'OrganizationUnit', id: string, name: string } | null, type: { __typename?: 'OrganizationUnitType', id: string, name: string, icon: string } } };

export type UpdateOrganizationUnitMutationVariables = Exact<{
  id: Scalars['String']['input'];
  input: UpdateOrganizationUnitInput;
}>;


export type UpdateOrganizationUnitMutation = { __typename?: 'Mutation', updateOrganizationUnit: { __typename?: 'OrganizationUnit', id: string, name: string, slug: string, deletedAt?: string | null, address?: string | null, city?: string | null, zipCode?: string | null, legalRep?: string | null, parent?: { __typename?: 'OrganizationUnit', id: string } | null, type: { __typename?: 'OrganizationUnitType', id: string, name: string, icon: string } } };

export type DeleteOrganizationUnitMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type DeleteOrganizationUnitMutation = { __typename?: 'Mutation', deleteOrganizationUnit: { __typename?: 'OrganizationUnit', id: string, name: string } };

export type IsMemberOfOrgUnitOrAncestorQueryVariables = Exact<{
  organizationUnitId: Scalars['ID']['input'];
  userId: Scalars['String']['input'];
}>;


export type IsMemberOfOrgUnitOrAncestorQuery = { __typename?: 'Query', isMemberOfUnitOrAncestor: boolean };

export type SetRequiredFormsMutationVariables = Exact<{
  organizationUnitId: Scalars['String']['input'];
  formIds: Array<Scalars['String']['input']> | Scalars['String']['input'];
}>;


export type SetRequiredFormsMutation = { __typename?: 'Mutation', setRequiredForms: Array<{ __typename?: 'RequiredFormRef', order: number, form: { __typename?: 'RequirementForm', id: string, name: string, description?: string | null } }> };

export type PublicOrganizationUnitFieldsFragment = { __typename?: 'OrganizationUnit', id: string, name: string, slug: string, description?: string | null, logoUrl?: string | null, coverUrl?: string | null, address?: string | null, memberCount: number, openShiftsCount: number, myMembershipState: JoinStatus };

export type PublicOrgEventFieldsFragment = { __typename?: 'Event', id: string, title: string, slug: string, startsAt: string, endsAt: string, location?: string | null, shiftsCount: number, shifts: Array<{ __typename?: 'Shift', id: string, instances: Array<{ __typename?: 'ShiftInstance', id: string, spotsLeft?: number | null }> }> };

export type PublicOrgShiftInstanceFieldsFragment = { __typename?: 'ShiftInstance', id: string, actualStartsAt: string, actualEndsAt: string, overrideMaxVolunteers?: number | null, filledCount: number, spotsLeft?: number | null };

export type PublicOrgShiftFieldsFragment = { __typename?: 'Shift', id: string, title: string, maxVolunteers?: number | null, rrule?: string | null, originalStartsAt: string, durationMinutes: number, instances: Array<{ __typename?: 'ShiftInstance', id: string, actualStartsAt: string, actualEndsAt: string, overrideMaxVolunteers?: number | null, filledCount: number, spotsLeft?: number | null }> };

export type GetPublicOrganizationUnitQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetPublicOrganizationUnitQuery = { __typename?: 'Query', publicOrganizationUnit: { __typename?: 'OrganizationUnit', id: string, name: string, slug: string, description?: string | null, logoUrl?: string | null, coverUrl?: string | null, address?: string | null, memberCount: number, openShiftsCount: number, myMembershipState: JoinStatus } };

export type GetPublicEventsByOrganizationUnitQueryVariables = Exact<{
  organizationUnitId: Scalars['ID']['input'];
}>;


export type GetPublicEventsByOrganizationUnitQuery = { __typename?: 'Query', publicEventsByOrganizationUnit: Array<{ __typename?: 'Event', id: string, title: string, slug: string, startsAt: string, endsAt: string, location?: string | null, shiftsCount: number, shifts: Array<{ __typename?: 'Shift', id: string, instances: Array<{ __typename?: 'ShiftInstance', id: string, spotsLeft?: number | null }> }> }> };

export type GetPublicShiftsByOrganizationUnitQueryVariables = Exact<{
  organizationUnitId: Scalars['ID']['input'];
}>;


export type GetPublicShiftsByOrganizationUnitQuery = { __typename?: 'Query', publicShiftsByOrganizationUnit: Array<{ __typename?: 'Shift', id: string, title: string, maxVolunteers?: number | null, rrule?: string | null, originalStartsAt: string, durationMinutes: number, instances: Array<{ __typename?: 'ShiftInstance', id: string, actualStartsAt: string, actualEndsAt: string, overrideMaxVolunteers?: number | null, filledCount: number, spotsLeft?: number | null }> }> };

export type GetFormBlockQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetFormBlockQuery = { __typename?: 'Query', formBlock?: { __typename?: 'FormBlock', id: string, organizationId: string, title: string, description?: string | null, icon?: string | null, required: boolean, isEditable: boolean, createdBy: string, updatedBy: string, createdAt: string, updatedAt: string, fields?: Array<{ __typename?: 'FormBlockField', id: string, blockId: string, type: FieldType, label: string, placeholder?: string | null, description?: string | null, required: boolean, lockType: boolean, systemKey?: string | null, documentFileId?: string | null, documentDownloadUrl?: string | null, documentFilename?: string | null, documentLabel?: string | null, minAge?: number | null, fieldOrder: number, createdAt: string, updatedAt: string, options?: Array<{ __typename?: 'SelectOption', label: string, value: string }> | null }> | null } | null };

export type GetFormBlocksQueryVariables = Exact<{
  organizationId: Scalars['String']['input'];
  limit: Scalars['Int']['input'];
  offset: Scalars['Int']['input'];
}>;


export type GetFormBlocksQuery = { __typename?: 'Query', formBlocks: { __typename?: 'FormBlockPaginatedResponse', items: Array<{ __typename?: 'FormBlock', id: string, organizationId: string, title: string, description?: string | null, icon?: string | null, required: boolean, isEditable: boolean, createdBy: string, updatedBy: string, createdAt: string, updatedAt: string, fields?: Array<{ __typename?: 'FormBlockField', id: string, blockId: string, type: FieldType, label: string, placeholder?: string | null, description?: string | null, required: boolean, lockType: boolean, systemKey?: string | null, documentFileId?: string | null, documentDownloadUrl?: string | null, documentFilename?: string | null, documentLabel?: string | null, minAge?: number | null, fieldOrder: number, createdAt: string, updatedAt: string, options?: Array<{ __typename?: 'SelectOption', label: string, value: string }> | null }> | null }>, pagination: { __typename?: 'PaginationInfo', total: number, limit: number, offset: number, hasMore: boolean } } };

export type CreateFormBlockMutationVariables = Exact<{
  input: CreateFormBlockInput;
}>;


export type CreateFormBlockMutation = { __typename?: 'Mutation', createFormBlock: { __typename?: 'FormBlock', id: string, organizationId: string, title: string, description?: string | null, icon?: string | null, required: boolean, isEditable: boolean, createdBy: string, updatedBy: string, createdAt: string, updatedAt: string, fields?: Array<{ __typename?: 'FormBlockField', id: string, blockId: string, type: FieldType, label: string, placeholder?: string | null, description?: string | null, required: boolean, lockType: boolean, systemKey?: string | null, documentFileId?: string | null, documentDownloadUrl?: string | null, documentFilename?: string | null, documentLabel?: string | null, minAge?: number | null, fieldOrder: number, createdAt: string, updatedAt: string, options?: Array<{ __typename?: 'SelectOption', label: string, value: string }> | null }> | null } };

export type UpdateFormBlockMutationVariables = Exact<{
  id: Scalars['String']['input'];
  input: UpdateFormBlockInput;
}>;


export type UpdateFormBlockMutation = { __typename?: 'Mutation', updateFormBlock: { __typename?: 'FormBlock', id: string, organizationId: string, title: string, description?: string | null, icon?: string | null, required: boolean, isEditable: boolean, createdBy: string, updatedBy: string, createdAt: string, updatedAt: string, fields?: Array<{ __typename?: 'FormBlockField', id: string, blockId: string, type: FieldType, label: string, placeholder?: string | null, description?: string | null, required: boolean, lockType: boolean, systemKey?: string | null, documentFileId?: string | null, documentDownloadUrl?: string | null, documentFilename?: string | null, documentLabel?: string | null, minAge?: number | null, fieldOrder: number, createdAt: string, updatedAt: string, options?: Array<{ __typename?: 'SelectOption', label: string, value: string }> | null }> | null } };

export type DeleteFormBlockMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type DeleteFormBlockMutation = { __typename?: 'Mutation', deleteFormBlock: { __typename?: 'FormBlock', id: string } };

export type CreateFormBlockFieldMutationVariables = Exact<{
  blockId: Scalars['String']['input'];
  input: CreateFormBlockFieldInput;
}>;


export type CreateFormBlockFieldMutation = { __typename?: 'Mutation', createFormBlockField: { __typename?: 'FormBlock', id: string, organizationId: string, title: string, description?: string | null, icon?: string | null, required: boolean, isEditable: boolean, createdBy: string, updatedBy: string, createdAt: string, updatedAt: string, fields?: Array<{ __typename?: 'FormBlockField', id: string, blockId: string, type: FieldType, label: string, placeholder?: string | null, description?: string | null, required: boolean, lockType: boolean, systemKey?: string | null, documentFileId?: string | null, documentDownloadUrl?: string | null, documentFilename?: string | null, documentLabel?: string | null, minAge?: number | null, fieldOrder: number, createdAt: string, updatedAt: string, options?: Array<{ __typename?: 'SelectOption', label: string, value: string }> | null }> | null } };

export type UpdateFormBlockFieldMutationVariables = Exact<{
  fieldId: Scalars['String']['input'];
  input: UpdateFormBlockFieldInput;
}>;


export type UpdateFormBlockFieldMutation = { __typename?: 'Mutation', updateFormBlockField: { __typename?: 'FormBlock', id: string, organizationId: string, title: string, description?: string | null, icon?: string | null, required: boolean, isEditable: boolean, createdBy: string, updatedBy: string, createdAt: string, updatedAt: string, fields?: Array<{ __typename?: 'FormBlockField', id: string, blockId: string, type: FieldType, label: string, placeholder?: string | null, description?: string | null, required: boolean, lockType: boolean, systemKey?: string | null, documentFileId?: string | null, documentDownloadUrl?: string | null, documentFilename?: string | null, documentLabel?: string | null, minAge?: number | null, fieldOrder: number, createdAt: string, updatedAt: string, options?: Array<{ __typename?: 'SelectOption', label: string, value: string }> | null }> | null } };

export type DeleteFormBlockFieldMutationVariables = Exact<{
  fieldId: Scalars['String']['input'];
}>;


export type DeleteFormBlockFieldMutation = { __typename?: 'Mutation', deleteFormBlockField: { __typename?: 'FormBlock', id: string, organizationId: string, title: string, description?: string | null, icon?: string | null, required: boolean, isEditable: boolean, createdBy: string, updatedBy: string, createdAt: string, updatedAt: string, fields?: Array<{ __typename?: 'FormBlockField', id: string, blockId: string, type: FieldType, label: string, placeholder?: string | null, description?: string | null, required: boolean, lockType: boolean, systemKey?: string | null, documentFileId?: string | null, documentDownloadUrl?: string | null, documentFilename?: string | null, documentLabel?: string | null, minAge?: number | null, fieldOrder: number, createdAt: string, updatedAt: string, options?: Array<{ __typename?: 'SelectOption', label: string, value: string }> | null }> | null } };

export type GetRequirementFormQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetRequirementFormQuery = { __typename?: 'Query', requirementForm?: { __typename?: 'RequirementForm', id: string, organizationId: string, organizationUnitId?: string | null, slug: string, name: string, description?: string | null, shareToken: string, submissionCount: number, createdBy: string, updatedBy: string, createdAt: string, updatedAt: string, settings: { __typename?: 'FormSettings', submitButtonLabel?: string | null, successTitle?: string | null, successMessage?: string | null, allowEmbed?: boolean | null }, blockRefs?: Array<{ __typename?: 'RequirementFormBlockRef', id: string, formId: string, blockId: string, fieldOrder: number, required?: boolean | null, createdAt: string, updatedAt: string, block?: { __typename?: 'FormBlock', id: string, organizationId: string, title: string, description?: string | null, icon?: string | null, required: boolean, isEditable: boolean, createdBy: string, updatedBy: string, createdAt: string, updatedAt: string, fields?: Array<{ __typename?: 'FormBlockField', id: string, blockId: string, type: FieldType, label: string, placeholder?: string | null, description?: string | null, required: boolean, lockType: boolean, systemKey?: string | null, documentFileId?: string | null, documentDownloadUrl?: string | null, documentFilename?: string | null, documentLabel?: string | null, minAge?: number | null, fieldOrder: number, createdAt: string, updatedAt: string, options?: Array<{ __typename?: 'SelectOption', label: string, value: string }> | null }> | null } | null }> | null } | null };

export type GetRequirementFormByShareTokenQueryVariables = Exact<{
  token: Scalars['String']['input'];
}>;


export type GetRequirementFormByShareTokenQuery = { __typename?: 'Query', requirementFormByShareToken?: { __typename?: 'RequirementForm', id: string, organizationUnitId?: string | null, name: string, description?: string | null, settings: { __typename?: 'FormSettings', submitButtonLabel?: string | null, successTitle?: string | null, successMessage?: string | null, allowEmbed?: boolean | null }, blockRefs?: Array<{ __typename?: 'RequirementFormBlockRef', id: string, formId: string, blockId: string, fieldOrder: number, required?: boolean | null, block?: { __typename?: 'FormBlock', id: string, title: string, description?: string | null, icon?: string | null, required: boolean, fields?: Array<{ __typename?: 'FormBlockField', id: string, blockId: string, type: FieldType, label: string, placeholder?: string | null, description?: string | null, required: boolean, systemKey?: string | null, documentFileId?: string | null, documentDownloadUrl?: string | null, documentFilename?: string | null, documentLabel?: string | null, options?: Array<{ __typename?: 'SelectOption', label: string, value: string }> | null }> | null } | null }> | null } | null };

export type GetRequirementFormsQueryVariables = Exact<{
  organizationId: Scalars['String']['input'];
  limit: Scalars['Int']['input'];
  offset: Scalars['Int']['input'];
}>;


export type GetRequirementFormsQuery = { __typename?: 'Query', requirementForms: { __typename?: 'RequirementFormPaginatedResponse', items: Array<{ __typename?: 'RequirementForm', id: string, organizationId: string, organizationUnitId?: string | null, slug: string, name: string, description?: string | null, shareToken: string, submissionCount: number, createdBy: string, updatedBy: string, createdAt: string, updatedAt: string, settings: { __typename?: 'FormSettings', submitButtonLabel?: string | null, successTitle?: string | null, successMessage?: string | null, allowEmbed?: boolean | null }, blockRefs?: Array<{ __typename?: 'RequirementFormBlockRef', id: string, formId: string, blockId: string, fieldOrder: number, required?: boolean | null, createdAt: string, updatedAt: string, block?: { __typename?: 'FormBlock', id: string, organizationId: string, title: string, description?: string | null, icon?: string | null, required: boolean, isEditable: boolean, createdBy: string, updatedBy: string, createdAt: string, updatedAt: string } | null }> | null }>, pagination: { __typename?: 'PaginationInfo', total: number, limit: number, offset: number, hasMore: boolean } } };

export type CreateRequirementFormMutationVariables = Exact<{
  input: CreateRequirementFormInput;
}>;


export type CreateRequirementFormMutation = { __typename?: 'Mutation', createRequirementForm: { __typename?: 'RequirementForm', id: string, organizationId: string, organizationUnitId?: string | null, slug: string, name: string, description?: string | null, shareToken: string, submissionCount: number, createdAt: string, updatedAt: string } };

export type UpdateRequirementFormMutationVariables = Exact<{
  id: Scalars['String']['input'];
  input: UpdateRequirementFormInput;
}>;


export type UpdateRequirementFormMutation = { __typename?: 'Mutation', updateRequirementForm: { __typename?: 'RequirementForm', id: string, organizationId: string, organizationUnitId?: string | null, slug: string, name: string, description?: string | null, shareToken: string, submissionCount: number, updatedAt: string } };

export type DeleteRequirementFormMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type DeleteRequirementFormMutation = { __typename?: 'Mutation', deleteRequirementForm: { __typename?: 'RequirementForm', id: string } };

export type RegenerateFormShareTokenMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type RegenerateFormShareTokenMutation = { __typename?: 'Mutation', regenerateFormShareToken: { __typename?: 'RequirementForm', id: string, shareToken: string } };

export type SubmitFormMutationVariables = Exact<{
  token: Scalars['String']['input'];
  organizationUnitId: Scalars['ID']['input'];
  input: SubmitFormInput;
}>;


export type SubmitFormMutation = { __typename?: 'Mutation', submitForm: { __typename?: 'FormSubmission', id: string, formId: string, userId: string, submittedAt: string } };

export type SubmitRequiredFormMutationVariables = Exact<{
  targetType: RequiredFormTargetType;
  targetId: Scalars['String']['input'];
  formId: Scalars['String']['input'];
  input: SubmitFormInput;
}>;


export type SubmitRequiredFormMutation = { __typename?: 'Mutation', submitRequiredForm: { __typename?: 'FormSubmission', id: string, formId: string, userId: string, submittedAt: string } };

export type GetMyFormSubmissionByTokenQueryVariables = Exact<{
  token: Scalars['String']['input'];
}>;


export type GetMyFormSubmissionByTokenQuery = { __typename?: 'Query', myFormSubmissionByToken?: { __typename?: 'FormSubmission', id: string, formId: string, userId: string, submittedAt: string } | null };

export type GetMyFormSubmissionsQueryVariables = Exact<{
  organizationUnitId: Scalars['ID']['input'];
}>;


export type GetMyFormSubmissionsQuery = { __typename?: 'Query', myFormSubmissions: Array<{ __typename?: 'FormSubmission', id: string, submittedAt: string, form?: { __typename?: 'RequirementForm', id: string, name: string, description?: string | null, shareToken: string } | null }> };

export type GetMyUserProfileQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMyUserProfileQuery = { __typename?: 'Query', myUserProfile?: { __typename?: 'UserProfile', id: string, userId: string, data: Record<string, unknown>, createdAt: string, updatedAt: string } | null };

export type UpdateMyUserProfileMutationVariables = Exact<{
  input: UpdateUserProfileInput;
}>;


export type UpdateMyUserProfileMutation = { __typename?: 'Mutation', updateMyUserProfile: { __typename?: 'UserProfile', id: string, userId: string, data: Record<string, unknown>, updatedAt: string } };

export type GetFormSubmissionsByMembershipRequestQueryVariables = Exact<{
  membershipRequestId: Scalars['String']['input'];
}>;


export type GetFormSubmissionsByMembershipRequestQuery = { __typename?: 'Query', formSubmissionsByMembershipRequest: Array<{ __typename?: 'FormSubmission', id: string, submittedAt: string, form?: { __typename?: 'RequirementForm', id: string, name: string } | null }> };

export type GetFormSubmissionsForVolunteerQueryVariables = Exact<{
  userId: Scalars['String']['input'];
}>;


export type GetFormSubmissionsForVolunteerQuery = { __typename?: 'Query', formSubmissionsForVolunteer: Array<{ __typename?: 'FormSubmission', id: string, submittedAt: string, form?: { __typename?: 'RequirementForm', id: string, name: string } | null }> };

export type GetAdminFormSubmissionQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetAdminFormSubmissionQuery = { __typename?: 'Query', adminVolunteerSubmission?: { __typename?: 'FormSubmission', id: string, submittedAt: string, user?: { __typename?: 'User', id: string, name: string, email: string, checkInId: string } | null, form?: { __typename?: 'RequirementForm', id: string, name: string, blockRefs?: Array<{ __typename?: 'RequirementFormBlockRef', fieldOrder: number, block?: { __typename?: 'FormBlock', id: string, fields?: Array<{ __typename?: 'FormBlockField', id: string, label: string, type: FieldType, systemKey?: string | null, options?: Array<{ __typename?: 'SelectOption', label: string, value: string }> | null }> | null } | null }> | null } | null, values?: Array<{ __typename?: 'FormSubmissionValue', fieldId: string, value: string }> | null } | null };

export type GetFormSubmissionsByFormQueryVariables = Exact<{
  formId: Scalars['String']['input'];
  limit: Scalars['Int']['input'];
  offset: Scalars['Int']['input'];
}>;


export type GetFormSubmissionsByFormQuery = { __typename?: 'Query', formSubmissionsByForm: { __typename?: 'FormSubmissionPaginatedResponse', items: Array<{ __typename?: 'FormSubmission', id: string, submittedAt: string, user?: { __typename?: 'User', id: string, name: string, email: string, checkInId: string, image?: string | null } | null }>, pagination: { __typename?: 'PaginationInfo', total: number, limit: number, offset: number, hasMore: boolean } } };

export type MyRequiredOrgUnitFormsQueryVariables = Exact<{
  organizationUnitId: Scalars['ID']['input'];
}>;


export type MyRequiredOrgUnitFormsQuery = { __typename?: 'Query', myRequiredOrgUnitForms: Array<{ __typename?: 'RequirementForm', id: string, name: string, description?: string | null, shareToken: string }> };

export type MyFormSubmissionQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type MyFormSubmissionQuery = { __typename?: 'Query', myFormSubmission?: { __typename?: 'FormSubmission', id: string, submittedAt: string, form?: { __typename?: 'RequirementForm', id: string, name: string, blockRefs?: Array<{ __typename?: 'RequirementFormBlockRef', fieldOrder: number, block?: { __typename?: 'FormBlock', id: string, fields?: Array<{ __typename?: 'FormBlockField', id: string, label: string, type: FieldType, systemKey?: string | null, options?: Array<{ __typename?: 'SelectOption', label: string, value: string }> | null }> | null } | null }> | null } | null, values?: Array<{ __typename?: 'FormSubmissionValue', fieldId: string, value: string }> | null } | null };

export type GetAdminUserProfileQueryVariables = Exact<{
  userId: Scalars['String']['input'];
}>;


export type GetAdminUserProfileQuery = { __typename?: 'Query', adminUserProfile?: { __typename?: 'UserProfile', id: string, userId: string, data: Record<string, unknown>, createdAt: string, updatedAt: string } | null };

export type CreateRequirementProfileSubmissionMutationVariables = Exact<{
  input: CreateRequirementProfileSubmissionInput;
}>;


export type CreateRequirementProfileSubmissionMutation = { __typename?: 'Mutation', createRequirementProfileSubmission: { __typename?: 'RequirementProfileSubmission', id: string, status: RequirementProfileSubmissionStatus, requirementProfile: { __typename?: 'RequirementProfile', id: string, name: string } } };

export type GetRoleQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetRoleQuery = { __typename?: 'Query', role: { __typename?: 'Role', id: string, name: string, description?: string | null, isInternal: boolean, permissions: Array<{ __typename?: 'Permission', id: string, key: PermissionKey, description?: string | null }> } };

export type GetRolesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetRolesQuery = { __typename?: 'Query', roles: Array<{ __typename?: 'Role', id: string, name: string, description?: string | null, isInternal: boolean, permissions: Array<{ __typename?: 'Permission', id: string, key: PermissionKey, description?: string | null }> }> };

export type GetPermissionsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetPermissionsQuery = { __typename?: 'Query', permissions: Array<{ __typename?: 'Permission', id: string, key: PermissionKey, description?: string | null }> };

export type GetPermissionGroupsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetPermissionGroupsQuery = { __typename?: 'Query', permissionGroups: Array<{ __typename?: 'PermissionGroup', key: string, label: string, items: Array<{ __typename?: 'PermissionGroupItem', label: string, permission: { __typename?: 'Permission', id: string, key: PermissionKey, description?: string | null } }> }> };

export type CreateRoleMutationVariables = Exact<{
  input: CreateRoleInput;
}>;


export type CreateRoleMutation = { __typename?: 'Mutation', createRole: { __typename?: 'Role', id: string, name: string, description?: string | null, permissions: Array<{ __typename?: 'Permission', id: string, key: PermissionKey }> } };

export type UpdateRoleMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: CreateRoleInput;
}>;


export type UpdateRoleMutation = { __typename?: 'Mutation', updateRole: { __typename?: 'Role', id: string, name: string, description?: string | null, permissions: Array<{ __typename?: 'Permission', id: string, key: PermissionKey }> } };

export type DeleteRoleMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteRoleMutation = { __typename?: 'Mutation', deleteRole: { __typename?: 'Role', id: string, name: string } };

export type GetShiftQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetShiftQuery = { __typename?: 'Query', shift: { __typename?: 'Shift', id: string, title: string, slug: string, instructions?: string | null, location?: string | null, imageUrl?: string | null, visibility: ShiftVisibility, createdAt: string, maxVolunteers?: number | null, minVolunteers?: number | null, reimbursementTypeId?: string | null, rrule?: string | null, originalStartsAt: string, durationMinutes: number, organizationUnitId: string, requiredFormsCount: number, requiredForms: Array<{ __typename?: 'RequiredFormRef', order: number, form: { __typename?: 'RequirementForm', id: string, name: string, description?: string | null, settings: { __typename?: 'FormSettings', submitButtonLabel?: string | null, successTitle?: string | null, successMessage?: string | null }, blockRefs?: Array<{ __typename?: 'RequirementFormBlockRef', id: string, formId: string, blockId: string, fieldOrder: number, required?: boolean | null, block?: { __typename?: 'FormBlock', id: string, organizationId: string, title: string, description?: string | null, icon?: string | null, required: boolean, isEditable: boolean, fields?: Array<{ __typename?: 'FormBlockField', id: string, blockId: string, type: FieldType, label: string, placeholder?: string | null, description?: string | null, required: boolean, lockType: boolean, systemKey?: string | null, documentFileId?: string | null, documentDownloadUrl?: string | null, documentFilename?: string | null, documentLabel?: string | null, minAge?: number | null, fieldOrder: number, options?: Array<{ __typename?: 'SelectOption', label: string, value: string }> | null }> | null } | null }> | null } }>, organizationUnit: { __typename?: 'OrganizationUnit', id: string, name: string, logoUrl?: string | null, myMembershipState: JoinStatus, requiredForms: Array<{ __typename?: 'RequiredFormRef', order: number, form: { __typename?: 'RequirementForm', id: string, name: string, description?: string | null, settings: { __typename?: 'FormSettings', submitButtonLabel?: string | null, successTitle?: string | null, successMessage?: string | null }, blockRefs?: Array<{ __typename?: 'RequirementFormBlockRef', id: string, formId: string, blockId: string, fieldOrder: number, required?: boolean | null, block?: { __typename?: 'FormBlock', id: string, organizationId: string, title: string, description?: string | null, icon?: string | null, required: boolean, isEditable: boolean, fields?: Array<{ __typename?: 'FormBlockField', id: string, blockId: string, type: FieldType, label: string, placeholder?: string | null, description?: string | null, required: boolean, lockType: boolean, systemKey?: string | null, documentFileId?: string | null, documentDownloadUrl?: string | null, documentFilename?: string | null, documentLabel?: string | null, minAge?: number | null, fieldOrder: number, options?: Array<{ __typename?: 'SelectOption', label: string, value: string }> | null }> | null } | null }> | null } }>, organization: { __typename?: 'Organization', id: string, name: string } }, createdBy?: { __typename?: 'User', id: string, name: string, image?: string | null } | null, event?: { __typename?: 'Event', id: string, title: string, coverImageUrl?: string | null } | null } };

export type GetShiftsQueryVariables = Exact<{
  limit: Scalars['Int']['input'];
  offset: Scalars['Int']['input'];
}>;


export type GetShiftsQuery = { __typename?: 'Query', shifts: { __typename?: 'ShiftPaginatedResponse', items: Array<{ __typename?: 'Shift', id: string, title: string, rrule?: string | null, originalStartsAt: string, durationMinutes: number, visibility: ShiftVisibility, maxVolunteers?: number | null, minVolunteers?: number | null, requiredFormsCount: number, createdBy?: { __typename?: 'User', id: string, name: string, email: string } | null }>, pagination: { __typename?: 'PaginationInfo', total: number, limit: number, offset: number, hasMore: boolean } } };

export type GetEventShiftsQueryVariables = Exact<{
  eventId: Scalars['ID']['input'];
  limit: Scalars['Int']['input'];
  offset: Scalars['Int']['input'];
}>;


export type GetEventShiftsQuery = { __typename?: 'Query', eventShifts: { __typename?: 'ShiftPaginatedResponse', items: Array<{ __typename?: 'Shift', id: string, title: string, rrule?: string | null, originalStartsAt: string, durationMinutes: number, visibility: ShiftVisibility, maxVolunteers?: number | null, minVolunteers?: number | null, requiredFormsCount: number, createdBy?: { __typename?: 'User', id: string, name: string, email: string } | null }>, pagination: { __typename?: 'PaginationInfo', total: number, limit: number, offset: number, hasMore: boolean } } };

export type GetShiftInstancesByMasterIdsQueryVariables = Exact<{
  masterIds: Array<Scalars['ID']['input']> | Scalars['ID']['input'];
}>;


export type GetShiftInstancesByMasterIdsQuery = { __typename?: 'Query', shiftInstancesByMasterIds: Array<{ __typename?: 'ShiftInstancesByMaster', masterId: string, instances: Array<{ __typename?: 'ShiftInstance', id: string, masterId: string }> }> };

export type CreateShiftMutationVariables = Exact<{
  input: CreateShiftInput;
}>;


export type CreateShiftMutation = { __typename?: 'Mutation', createShift: { __typename?: 'Shift', id: string } };

export type UpdateShiftMutationVariables = Exact<{
  id: Scalars['String']['input'];
  input: UpdateShiftInput;
}>;


export type UpdateShiftMutation = { __typename?: 'Mutation', updateShift: { __typename?: 'Shift', id: string } };

export type DeleteShiftMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type DeleteShiftMutation = { __typename?: 'Mutation', deleteShift: { __typename?: 'Shift', id: string } };

export type SetShiftRequiredFormsMutationVariables = Exact<{
  shiftId: Scalars['ID']['input'];
  formIds: Array<Scalars['String']['input']> | Scalars['String']['input'];
}>;


export type SetShiftRequiredFormsMutation = { __typename?: 'Mutation', setShiftRequiredForms: Array<{ __typename?: 'RequiredFormRef', order: number, form: { __typename?: 'RequirementForm', id: string, name: string, description?: string | null, settings: { __typename?: 'FormSettings', submitButtonLabel?: string | null, successTitle?: string | null, successMessage?: string | null }, blockRefs?: Array<{ __typename?: 'RequirementFormBlockRef', id: string, formId: string, blockId: string, fieldOrder: number, required?: boolean | null, block?: { __typename?: 'FormBlock', id: string, organizationId: string, title: string, description?: string | null, icon?: string | null, required: boolean, isEditable: boolean, fields?: Array<{ __typename?: 'FormBlockField', id: string, blockId: string, type: FieldType, label: string, placeholder?: string | null, description?: string | null, required: boolean, lockType: boolean, systemKey?: string | null, documentFileId?: string | null, documentDownloadUrl?: string | null, documentFilename?: string | null, documentLabel?: string | null, minAge?: number | null, fieldOrder: number, options?: Array<{ __typename?: 'SelectOption', label: string, value: string }> | null }> | null } | null }> | null } }> };

export type SetShiftInstanceRequiredFormsMutationVariables = Exact<{
  instanceId: Scalars['ID']['input'];
  formIds: Array<Scalars['String']['input']> | Scalars['String']['input'];
}>;


export type SetShiftInstanceRequiredFormsMutation = { __typename?: 'Mutation', setShiftInstanceRequiredForms: Array<{ __typename?: 'RequiredFormRef', order: number, form: { __typename?: 'RequirementForm', id: string, name: string, description?: string | null, settings: { __typename?: 'FormSettings', submitButtonLabel?: string | null, successTitle?: string | null, successMessage?: string | null }, blockRefs?: Array<{ __typename?: 'RequirementFormBlockRef', id: string, formId: string, blockId: string, fieldOrder: number, required?: boolean | null, block?: { __typename?: 'FormBlock', id: string, organizationId: string, title: string, description?: string | null, icon?: string | null, required: boolean, isEditable: boolean, fields?: Array<{ __typename?: 'FormBlockField', id: string, blockId: string, type: FieldType, label: string, placeholder?: string | null, description?: string | null, required: boolean, lockType: boolean, systemKey?: string | null, documentFileId?: string | null, documentDownloadUrl?: string | null, documentFilename?: string | null, documentLabel?: string | null, minAge?: number | null, fieldOrder: number, options?: Array<{ __typename?: 'SelectOption', label: string, value: string }> | null }> | null } | null }> | null } }> };

export type UpdateMembersForShiftInstanceMutationVariables = Exact<{
  instanceId: Scalars['String']['input'];
  memberIds: Array<Scalars['String']['input']> | Scalars['String']['input'];
  inviteToAllInstances?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type UpdateMembersForShiftInstanceMutation = { __typename?: 'Mutation', updateMembersForShiftInstance: { __typename?: 'ShiftInstance', id: string } };

export type UpdateShiftInstanceMutationVariables = Exact<{
  instanceId: Scalars['String']['input'];
  input: UpdateShiftInstanceInput;
  applyToAllFuture?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type UpdateShiftInstanceMutation = { __typename?: 'Mutation', updateShiftInstance: { __typename?: 'ShiftInstance', id: string } };

export type DeleteShiftInstanceMutationVariables = Exact<{
  id: Scalars['String']['input'];
  applyToAllFuture?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type DeleteShiftInstanceMutation = { __typename?: 'Mutation', deleteShiftInstance: { __typename?: 'ShiftInstance', id: string, isCancelled: boolean } };

export type UpdateShiftInstanceVolunteersMutationVariables = Exact<{
  instanceId: Scalars['String']['input'];
  memberIds: Array<Scalars['String']['input']> | Scalars['String']['input'];
}>;


export type UpdateShiftInstanceVolunteersMutation = { __typename?: 'Mutation', updateMembersForShiftInstance: { __typename?: 'ShiftInstance', id: string } };

export type UpdateShiftInstanceInviteStatusMutationVariables = Exact<{
  instanceId: Scalars['String']['input'];
  status: ShiftInviteStatus;
  userId?: InputMaybe<Scalars['String']['input']>;
}>;


export type UpdateShiftInstanceInviteStatusMutation = { __typename?: 'Mutation', updateShiftInstanceInviteStatus: { __typename?: 'ShiftInstanceInvite', status: ShiftInviteStatus, userId: string } };

export type JoinShiftInstanceMutationVariables = Exact<{
  instanceId: Scalars['String']['input'];
}>;


export type JoinShiftInstanceMutation = { __typename?: 'Mutation', joinShiftInstance: { __typename?: 'JoinShiftInstanceResult', status: JoinStatus, membershipRequestId?: string | null, shiftInstance: { __typename?: 'ShiftInstance', id: string, actualStartsAt: string, actualEndsAt: string, overrideTitle?: string | null, overrideInstructions?: string | null, overrideLocation?: string | null, overrideMaxVolunteers?: number | null, isException: boolean, isCancelled: boolean, occurrenceIndex: number, master: { __typename?: 'Shift', id: string, title: string } }, requirementProfile?: { __typename?: 'RequirementProfile', id: string, name: string, description?: string | null, requirements?: Array<{ __typename?: 'Requirement', id: string, name: string, description?: string | null, type: RequirementType, mandatory: boolean }> | null } | null, requirementStatuses?: Array<{ __typename?: 'UserRequirementStatus', requirementId: string, name: string, status: RequirementFulfillmentStatus }> | null, requiredForms?: Array<{ __typename?: 'RequiredFormWithStatus', order: number, submitted: boolean, submissionId?: string | null, targetType: RequiredFormTargetType, targetId: string, form: { __typename?: 'RequirementForm', id: string, name: string, description?: string | null, settings: { __typename?: 'FormSettings', submitButtonLabel?: string | null, successTitle?: string | null, successMessage?: string | null }, blockRefs?: Array<{ __typename?: 'RequirementFormBlockRef', id: string, formId: string, blockId: string, fieldOrder: number, required?: boolean | null, block?: { __typename?: 'FormBlock', id: string, organizationId: string, title: string, description?: string | null, icon?: string | null, required: boolean, isEditable: boolean, fields?: Array<{ __typename?: 'FormBlockField', id: string, blockId: string, type: FieldType, label: string, placeholder?: string | null, description?: string | null, required: boolean, lockType: boolean, systemKey?: string | null, documentFileId?: string | null, documentDownloadUrl?: string | null, documentFilename?: string | null, documentLabel?: string | null, minAge?: number | null, fieldOrder: number, options?: Array<{ __typename?: 'SelectOption', label: string, value: string }> | null }> | null } | null }> | null } }> | null } };

export type GetShiftVolunteersQueryVariables = Exact<{
  instanceId: Scalars['ID']['input'];
  statuses?: InputMaybe<Array<ShiftInviteStatus> | ShiftInviteStatus>;
}>;


export type GetShiftVolunteersQuery = { __typename?: 'Query', shiftVolunteers: Array<{ __typename?: 'User', id: string, name: string, email: string, image?: string | null }> };

export type GetActiveShiftInstancesQueryVariables = Exact<{
  userId: Scalars['String']['input'];
}>;


export type GetActiveShiftInstancesQuery = { __typename?: 'Query', activeShiftInstances: Array<{ __typename?: 'ShiftInstance', id: string, actualStartsAt: string, actualEndsAt: string, overrideTitle?: string | null, invite?: { __typename?: 'ShiftInstanceInvite', status: ShiftInviteStatus } | null, master: { __typename?: 'Shift', id: string, title: string, location?: string | null, instructions?: string | null, visibility: ShiftVisibility, maxVolunteers?: number | null } }> };

export type GetShiftInstancesQueryVariables = Exact<{
  shiftId: Scalars['ID']['input'];
}>;


export type GetShiftInstancesQuery = { __typename?: 'Query', shiftInstances: Array<{ __typename?: 'ShiftInstance', id: string, actualStartsAt: string, actualEndsAt: string, overrideTitle?: string | null, isCancelled: boolean }> };

export type GetShiftInstanceQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetShiftInstanceQuery = { __typename?: 'Query', shiftInstance: { __typename?: 'ShiftInstance', id: string, actualStartsAt: string, actualEndsAt: string, overrideTitle?: string | null, overrideLocation?: string | null, overrideInstructions?: string | null, overrideMaxVolunteers?: number | null, overrideMinVolunteers?: number | null, overrideReimbursementTypeId?: string | null, isCancelled: boolean, filledCount: number, spotsLeft?: number | null, requiredFormsCount: number, requiredForms: Array<{ __typename?: 'RequiredFormRef', order: number, form: { __typename?: 'RequirementForm', id: string, name: string, description?: string | null, settings: { __typename?: 'FormSettings', submitButtonLabel?: string | null, successTitle?: string | null, successMessage?: string | null }, blockRefs?: Array<{ __typename?: 'RequirementFormBlockRef', id: string, formId: string, blockId: string, fieldOrder: number, required?: boolean | null, block?: { __typename?: 'FormBlock', id: string, organizationId: string, title: string, description?: string | null, icon?: string | null, required: boolean, isEditable: boolean, fields?: Array<{ __typename?: 'FormBlockField', id: string, blockId: string, type: FieldType, label: string, placeholder?: string | null, description?: string | null, required: boolean, lockType: boolean, systemKey?: string | null, documentFileId?: string | null, documentDownloadUrl?: string | null, documentFilename?: string | null, documentLabel?: string | null, minAge?: number | null, fieldOrder: number, options?: Array<{ __typename?: 'SelectOption', label: string, value: string }> | null }> | null } | null }> | null } }>, master: { __typename?: 'Shift', id: string, title: string, location?: string | null, instructions?: string | null, minVolunteers?: number | null, maxVolunteers?: number | null, reimbursementTypeId?: string | null, visibility: ShiftVisibility, rrule?: string | null, createdAt: string, imageUrl?: string | null, createdBy?: { __typename?: 'User', id: string, name: string, image?: string | null } | null }, invites?: Array<{ __typename?: 'ShiftInstanceInvite', status: ShiftInviteStatus, user: { __typename?: 'User', id: string, name: string, email: string, image?: string | null, checkInId: string } }> | null } };

export type GetWeeklyShiftsQueryVariables = Exact<{
  startsAfter: Scalars['DateTime']['input'];
  endsBefore: Scalars['DateTime']['input'];
  eventId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type GetWeeklyShiftsQuery = { __typename?: 'Query', weeklyShifts: Array<{ __typename?: 'ShiftInstance', id: string, overrideTitle?: string | null, actualStartsAt: string, actualEndsAt: string, isCancelled: boolean, overrideMinVolunteers?: number | null, overrideMaxVolunteers?: number | null, master: { __typename?: 'Shift', id: string, title: string, minVolunteers?: number | null, maxVolunteers?: number | null, visibility: ShiftVisibility, rrule?: string | null }, volunteers?: Array<{ __typename?: 'User', id: string, name: string }> | null, invites?: Array<{ __typename?: 'ShiftInstanceInvite', status: ShiftInviteStatus, user: { __typename?: 'User', id: string, name: string, email: string, image?: string | null } }> | null }> };

export type PublicShiftDetailInstanceFieldsFragment = { __typename?: 'ShiftInstance', id: string, actualStartsAt: string, actualEndsAt: string, overrideTitle?: string | null, overrideMaxVolunteers?: number | null, filledCount: number, spotsLeft?: number | null, myInviteStatus?: ShiftInviteStatus | null, isIntendingToJoin: boolean, requiredFormsCount: number, requiredForms: Array<{ __typename?: 'RequiredFormRef', order: number, form: { __typename?: 'RequirementForm', id: string, name: string, description?: string | null, settings: { __typename?: 'FormSettings', submitButtonLabel?: string | null, successTitle?: string | null, successMessage?: string | null }, blockRefs?: Array<{ __typename?: 'RequirementFormBlockRef', id: string, formId: string, blockId: string, fieldOrder: number, required?: boolean | null, block?: { __typename?: 'FormBlock', id: string, organizationId: string, title: string, description?: string | null, icon?: string | null, required: boolean, isEditable: boolean, fields?: Array<{ __typename?: 'FormBlockField', id: string, blockId: string, type: FieldType, label: string, placeholder?: string | null, description?: string | null, required: boolean, lockType: boolean, systemKey?: string | null, documentFileId?: string | null, documentDownloadUrl?: string | null, documentFilename?: string | null, documentLabel?: string | null, minAge?: number | null, fieldOrder: number, options?: Array<{ __typename?: 'SelectOption', label: string, value: string }> | null }> | null } | null }> | null } }> };

export type GetPublicShiftInstancesQueryVariables = Exact<{
  shiftId: Scalars['ID']['input'];
}>;


export type GetPublicShiftInstancesQuery = { __typename?: 'Query', publicShiftInstances: Array<{ __typename?: 'ShiftInstance', id: string, actualStartsAt: string, actualEndsAt: string, overrideTitle?: string | null, overrideMaxVolunteers?: number | null, filledCount: number, spotsLeft?: number | null, myInviteStatus?: ShiftInviteStatus | null, isIntendingToJoin: boolean, requiredFormsCount: number, requiredForms: Array<{ __typename?: 'RequiredFormRef', order: number, form: { __typename?: 'RequirementForm', id: string, name: string, description?: string | null, settings: { __typename?: 'FormSettings', submitButtonLabel?: string | null, successTitle?: string | null, successMessage?: string | null }, blockRefs?: Array<{ __typename?: 'RequirementFormBlockRef', id: string, formId: string, blockId: string, fieldOrder: number, required?: boolean | null, block?: { __typename?: 'FormBlock', id: string, organizationId: string, title: string, description?: string | null, icon?: string | null, required: boolean, isEditable: boolean, fields?: Array<{ __typename?: 'FormBlockField', id: string, blockId: string, type: FieldType, label: string, placeholder?: string | null, description?: string | null, required: boolean, lockType: boolean, systemKey?: string | null, documentFileId?: string | null, documentDownloadUrl?: string | null, documentFilename?: string | null, documentLabel?: string | null, minAge?: number | null, fieldOrder: number, options?: Array<{ __typename?: 'SelectOption', label: string, value: string }> | null }> | null } | null }> | null } }> }> };

export type GetPublicShiftInstanceQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetPublicShiftInstanceQuery = { __typename?: 'Query', publicShiftInstance: { __typename?: 'ShiftInstance', id: string, actualStartsAt: string, actualEndsAt: string, overrideTitle?: string | null, overrideMaxVolunteers?: number | null, filledCount: number, spotsLeft?: number | null, myInviteStatus?: ShiftInviteStatus | null, isIntendingToJoin: boolean, requiredFormsCount: number, requiredForms: Array<{ __typename?: 'RequiredFormRef', order: number, form: { __typename?: 'RequirementForm', id: string, name: string, description?: string | null, settings: { __typename?: 'FormSettings', submitButtonLabel?: string | null, successTitle?: string | null, successMessage?: string | null }, blockRefs?: Array<{ __typename?: 'RequirementFormBlockRef', id: string, formId: string, blockId: string, fieldOrder: number, required?: boolean | null, block?: { __typename?: 'FormBlock', id: string, organizationId: string, title: string, description?: string | null, icon?: string | null, required: boolean, isEditable: boolean, fields?: Array<{ __typename?: 'FormBlockField', id: string, blockId: string, type: FieldType, label: string, placeholder?: string | null, description?: string | null, required: boolean, lockType: boolean, systemKey?: string | null, documentFileId?: string | null, documentDownloadUrl?: string | null, documentFilename?: string | null, documentLabel?: string | null, minAge?: number | null, fieldOrder: number, options?: Array<{ __typename?: 'SelectOption', label: string, value: string }> | null }> | null } | null }> | null } }> } };

export type VolunteerHomeShiftInstanceFragment = { __typename?: 'ShiftInstance', id: string, overrideTitle?: string | null, actualStartsAt: string, actualEndsAt: string, isCheckedIn: boolean, filledCount: number, myInviteStatus?: ShiftInviteStatus | null, myInvitedAt?: string | null, isIntendingToJoin: boolean, master: { __typename?: 'Shift', id: string, title: string, location?: string | null, rrule?: string | null, maxVolunteers?: number | null, organizationUnit: { __typename?: 'OrganizationUnit', id: string, name: string, logoUrl?: string | null }, event?: { __typename?: 'Event', id: string, title: string, coverImageUrl?: string | null } | null } };

export type GetMyShiftInstancesQueryVariables = Exact<{
  includePast?: InputMaybe<Scalars['Boolean']['input']>;
  startsAfter?: InputMaybe<Scalars['DateTime']['input']>;
  endsBefore?: InputMaybe<Scalars['DateTime']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<SortOrder>;
  statuses?: InputMaybe<Array<ShiftInviteStatus> | ShiftInviteStatus>;
  includeIntended?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type GetMyShiftInstancesQuery = { __typename?: 'Query', myShiftInstances: { __typename?: 'ShiftInstancePaginatedResponse', items: Array<{ __typename?: 'ShiftInstance', id: string, overrideTitle?: string | null, actualStartsAt: string, actualEndsAt: string, isCheckedIn: boolean, filledCount: number, myInviteStatus?: ShiftInviteStatus | null, myInvitedAt?: string | null, isIntendingToJoin: boolean, master: { __typename?: 'Shift', id: string, title: string, location?: string | null, rrule?: string | null, maxVolunteers?: number | null, organizationUnit: { __typename?: 'OrganizationUnit', id: string, name: string, logoUrl?: string | null }, event?: { __typename?: 'Event', id: string, title: string, coverImageUrl?: string | null } | null } }>, pagination: { __typename?: 'PaginationInfo', total: number, limit: number, offset: number, hasMore: boolean } } };

export type GetAvailableShiftInstancesQueryVariables = Exact<{
  startsAfter?: InputMaybe<Scalars['DateTime']['input']>;
  endsBefore?: InputMaybe<Scalars['DateTime']['input']>;
  organizationUnitIds?: InputMaybe<Array<Scalars['ID']['input']> | Scalars['ID']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetAvailableShiftInstancesQuery = { __typename?: 'Query', availableShiftInstances: { __typename?: 'ShiftInstancePaginatedResponse', items: Array<{ __typename?: 'ShiftInstance', id: string, overrideTitle?: string | null, actualStartsAt: string, actualEndsAt: string, isCheckedIn: boolean, filledCount: number, myInviteStatus?: ShiftInviteStatus | null, myInvitedAt?: string | null, isIntendingToJoin: boolean, master: { __typename?: 'Shift', id: string, title: string, location?: string | null, rrule?: string | null, maxVolunteers?: number | null, organizationUnit: { __typename?: 'OrganizationUnit', id: string, name: string, logoUrl?: string | null }, event?: { __typename?: 'Event', id: string, title: string, coverImageUrl?: string | null } | null } }>, pagination: { __typename?: 'PaginationInfo', total: number, limit: number, offset: number, hasMore: boolean } } };

export type CheckInMutationVariables = Exact<{
  shiftInstanceId: Scalars['ID']['input'];
}>;


export type CheckInMutation = { __typename?: 'Mutation', checkIn: { __typename?: 'TimeEntry', id: string } };

export type CheckOutMutationVariables = Exact<{
  shiftInstanceId: Scalars['ID']['input'];
}>;


export type CheckOutMutation = { __typename?: 'Mutation', checkOut: { __typename?: 'TimeEntry', id: string } };

export type GetCheckInShiftInstancesQueryVariables = Exact<{
  startsAfter: Scalars['DateTime']['input'];
  endsBefore: Scalars['DateTime']['input'];
}>;


export type GetCheckInShiftInstancesQuery = { __typename?: 'Query', checkInShiftInstances: Array<{ __typename?: 'ShiftInstance', id: string, actualStartsAt: string, actualEndsAt: string, overrideTitle?: string | null, master: { __typename?: 'Shift', id: string, title: string } }> };

export type GetCheckInShiftsQueryVariables = Exact<{
  search?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetCheckInShiftsQuery = { __typename?: 'Query', checkInShifts: Array<{ __typename?: 'Shift', id: string, title: string }> };

export type CheckInInviteToShiftInstanceMutationVariables = Exact<{
  shiftInstanceId: Scalars['ID']['input'];
  volunteerId: Scalars['ID']['input'];
}>;


export type CheckInInviteToShiftInstanceMutation = { __typename?: 'Mutation', checkInInviteToShiftInstance: { __typename?: 'ShiftInstance', id: string } };

export type AddTimeEntryMutationVariables = Exact<{
  input: AddTimeEntryInput;
}>;


export type AddTimeEntryMutation = { __typename?: 'Mutation', addTimeEntry: { __typename?: 'TimeEntry', id: string } };

export type DeleteTimeEntryMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteTimeEntryMutation = { __typename?: 'Mutation', deleteTimeEntry: { __typename?: 'TimeEntry', id: string } };

export type CloseTimeEntryMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: CloseTimeEntryInput;
}>;


export type CloseTimeEntryMutation = { __typename?: 'Mutation', closeTimeEntry: { __typename?: 'TimeEntry', id: string } };

export type GetTimeEntryQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetTimeEntryQuery = { __typename?: 'Query', timeEntry: { __typename?: 'TimeEntry', id: string, startedAt: string, endedAt?: string | null, notes?: string | null, createdAt: string, volunteer: { __typename?: 'User', id: string, name: string, email: string }, shiftInstance?: { __typename?: 'ShiftInstance', id: string, actualStartsAt: string, actualEndsAt: string, overrideTitle?: string | null, master: { __typename?: 'Shift', id: string, title: string } } | null, organizationUnit: { __typename?: 'OrganizationUnit', id: string, name: string, organization: { __typename?: 'Organization', id: string, name: string } } } };

export type UpdateTimeEntryMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateTimeEntryInput;
}>;


export type UpdateTimeEntryMutation = { __typename?: 'Mutation', updateTimeEntry: { __typename?: 'TimeEntry', id: string } };

export type GetTimeEntriesQueryVariables = Exact<{
  limit: Scalars['Int']['input'];
  offset: Scalars['Int']['input'];
}>;


export type GetTimeEntriesQuery = { __typename?: 'Query', timeEntries: { __typename?: 'TimeEntryPaginatedResponse', items: Array<{ __typename?: 'TimeEntry', id: string, startedAt: string, endedAt?: string | null, volunteer: { __typename?: 'User', id: string, name: string, email: string }, shiftInstance?: { __typename?: 'ShiftInstance', id: string, actualStartsAt: string, actualEndsAt: string, overrideTitle?: string | null, master: { __typename?: 'Shift', id: string, title: string } } | null, organizationUnit: { __typename?: 'OrganizationUnit', id: string, name: string, organization: { __typename?: 'Organization', id: string, name: string } } }>, pagination: { __typename?: 'PaginationInfo', total: number, limit: number, offset: number, hasMore: boolean } } };

export type GetTimeEntriesByUserQueryVariables = Exact<{
  userId: Scalars['String']['input'];
  limit: Scalars['Int']['input'];
  offset: Scalars['Int']['input'];
}>;


export type GetTimeEntriesByUserQuery = { __typename?: 'Query', timeEntriesByUser: { __typename?: 'TimeEntryPaginatedResponse', items: Array<{ __typename?: 'TimeEntry', id: string, startedAt: string, endedAt?: string | null, shiftInstance?: { __typename?: 'ShiftInstance', id: string, actualStartsAt: string, actualEndsAt: string, overrideTitle?: string | null, master: { __typename?: 'Shift', id: string, title: string } } | null, organizationUnit: { __typename?: 'OrganizationUnit', id: string, name: string, organization: { __typename?: 'Organization', id: string, name: string } } }>, pagination: { __typename?: 'PaginationInfo', total: number, limit: number, offset: number, hasMore: boolean } } };

export type GetMyTimeQueryVariables = Exact<{
  limit: Scalars['Int']['input'];
  offset: Scalars['Int']['input'];
}>;


export type GetMyTimeQuery = { __typename?: 'Query', myTime: { __typename?: 'TimeEntryPaginatedResponse', items: Array<{ __typename?: 'TimeEntry', id: string, startedAt: string, endedAt?: string | null, shiftInstance?: { __typename?: 'ShiftInstance', id: string, overrideTitle?: string | null, master: { __typename?: 'Shift', id: string, title: string, organizationUnit: { __typename?: 'OrganizationUnit', id: string, name: string, organization: { __typename?: 'Organization', id: string, name: string } } } } | null, organizationUnit: { __typename?: 'OrganizationUnit', id: string, name: string, organization: { __typename?: 'Organization', id: string, name: string } } }>, pagination: { __typename?: 'PaginationInfo', total: number, limit: number, offset: number, hasMore: boolean } } };

export type GetCheckInContextQueryVariables = Exact<{
  checkInId: Scalars['String']['input'];
}>;


export type GetCheckInContextQuery = { __typename?: 'Query', checkInContext?: { __typename?: 'CheckInContext', volunteer: { __typename?: 'User', id: string, name: string, email: string, image?: string | null }, eligibleOrganizationUnits: Array<{ __typename?: 'OrganizationUnit', id: string, name: string }>, openTimeEntries: Array<{ __typename?: 'TimeEntry', id: string, startedAt: string, shiftInstance?: { __typename?: 'ShiftInstance', id: string, overrideTitle?: string | null, master: { __typename?: 'Shift', id: string, title: string } } | null, organizationUnit: { __typename?: 'OrganizationUnit', id: string, name: string, organization: { __typename?: 'Organization', id: string, name: string } } }> } | null };

export type GetCheckInReadinessQueryVariables = Exact<{
  volunteerId: Scalars['ID']['input'];
  shiftInstanceId: Scalars['ID']['input'];
}>;


export type GetCheckInReadinessQuery = { __typename?: 'Query', checkInReadiness: { __typename?: 'CheckInReadiness', isMember: boolean, openMembershipRequestId?: string | null, shiftInviteStatus?: ShiftInviteStatus | null, isParticipating: boolean, hasOpenTimeEntry: boolean } };

export type GetCheckInVolunteerRequiredFormsQueryVariables = Exact<{
  volunteerId: Scalars['ID']['input'];
}>;


export type GetCheckInVolunteerRequiredFormsQuery = { __typename?: 'Query', checkInVolunteerRequiredForms: Array<{ __typename?: 'RequiredFormWithStatus', order: number, submitted: boolean, submissionId?: string | null, form: { __typename?: 'RequirementForm', id: string, name: string } }> };

export type CheckInVolunteerMutationVariables = Exact<{
  volunteerId: Scalars['ID']['input'];
  shiftInstanceId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type CheckInVolunteerMutation = { __typename?: 'Mutation', checkInVolunteer: { __typename?: 'TimeEntry', id: string } };

export type CheckInInviteToOrganizationMutationVariables = Exact<{
  volunteerId: Scalars['ID']['input'];
}>;


export type CheckInInviteToOrganizationMutation = { __typename?: 'Mutation', checkInInviteToOrganization: boolean };

export type CheckOutVolunteerMutationVariables = Exact<{
  timeEntryId: Scalars['ID']['input'];
}>;


export type CheckOutVolunteerMutation = { __typename?: 'Mutation', checkOutVolunteer: { __typename?: 'TimeEntry', id: string } };

export type GetMeQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMeQuery = { __typename?: 'Query', me: { __typename?: 'User', id: string, name: string, email: string, image?: string | null, checkInId: string, locale?: string | null } };

export type GetUserQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetUserQuery = { __typename?: 'Query', user?: { __typename?: 'User', id: string, name: string, email: string, image?: string | null, checkInId: string, locale?: string | null } | null };

export type GetUserByCheckInIdQueryVariables = Exact<{
  checkInId: Scalars['String']['input'];
}>;


export type GetUserByCheckInIdQuery = { __typename?: 'Query', userByCheckInId?: { __typename?: 'User', id: string, name: string, email: string, image?: string | null, checkInId: string, locale?: string | null } | null };

export type GetMyPermissionsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMyPermissionsQuery = { __typename?: 'Query', me: { __typename?: 'User', id: string, permissions?: Array<{ __typename?: 'Permission', id: string, key: PermissionKey }> | null } };

export type GetMyOrganizationsQueryVariables = Exact<{
  limit: Scalars['Int']['input'];
  offset: Scalars['Int']['input'];
}>;


export type GetMyOrganizationsQuery = { __typename?: 'Query', organizations: { __typename?: 'OrganizationPaginatedResponse', items: Array<{ __typename?: 'Organization', id: string, name: string, slug: string, description?: string | null, logoUrl?: string | null }>, pagination: { __typename?: 'PaginationInfo', total: number, limit: number, offset: number, hasMore: boolean } } };

export type UpdateMyLocaleMutationVariables = Exact<{
  locale: Scalars['String']['input'];
}>;


export type UpdateMyLocaleMutation = { __typename?: 'Mutation', updateMyLocale: { __typename?: 'User', id: string, locale?: string | null } };

export type UpdateMyImageMutationVariables = Exact<{
  input: UpdateMyImageInput;
}>;


export type UpdateMyImageMutation = { __typename?: 'Mutation', updateMyImage: { __typename?: 'User', id: string, image?: string | null } };

export const ContractSummaryFieldsFragmentDoc = gql`
    fragment ContractSummaryFields on Contract {
  id
  contractStatus
  periodStart
  periodEnd
  isNonCompliant
  declineReason
  declinedAt
  declinedAtSigneeType
  declinedByUser {
    id
    name
  }
  renewDate
  downloadUrl
  missingProfileFields
  missingOrgProfileFields
  createdAt
  updatedAt
  volunteer {
    id
    name
    image
  }
  reimbursementType {
    id
    key
  }
  documentTemplate {
    id
    kind
  }
  signatures {
    id
    order
    signeeType
    signedAt
    signedByUser {
      id
      name
    }
    requiredPermission {
      id
      key
    }
  }
  statusChanges {
    id
    type
    occurredAt
    actorUser {
      id
      name
    }
  }
}
    `;
export const InvoiceSummaryFieldsFragmentDoc = gql`
    fragment InvoiceSummaryFields on Invoice {
  id
  invoiceStatus
  periodStart
  periodEnd
  totalAmountCents
  totalHours
  isNonCompliant
  declineReason
  declinedAt
  declinedAtSigneeType
  declinedByUser {
    id
    name
  }
  downloadUrl
  missingProfileFields
  missingOrgProfileFields
  createdAt
  updatedAt
  volunteer {
    id
    name
    image
  }
  reimbursementType {
    id
    key
  }
  documentTemplate {
    id
    kind
  }
  invoiceTimeEntries {
    id
  }
  signatures {
    id
    order
    signeeType
    signedAt
    signedByUser {
      id
      name
    }
    requiredPermission {
      id
      key
    }
  }
  statusChanges {
    id
    type
    occurredAt
    actorUser {
      id
      name
    }
  }
}
    `;
export const DocumentTemplateSummaryFieldsFragmentDoc = gql`
    fragment DocumentTemplateSummaryFields on DocumentTemplate {
  id
  kind
  invoiceNumberFormat
  renewalCadence
  isDeleted
  lastEditedAt
  lastEditedByUser {
    id
    name
  }
  reimbursementType {
    id
    key
  }
  organizationUnit {
    id
    name
  }
  signees {
    id
    order
    signeeType
    requiredPermission {
      id
      key
    }
  }
}
    `;
export const RequiredFormFieldsFragmentDoc = gql`
    fragment RequiredFormFields on RequirementForm {
  id
  name
  description
  settings {
    submitButtonLabel
    successTitle
    successMessage
  }
  blockRefs {
    id
    formId
    blockId
    fieldOrder
    required
    block {
      id
      organizationId
      title
      description
      icon
      required
      isEditable
      fields {
        id
        blockId
        type
        label
        placeholder
        description
        required
        lockType
        systemKey
        options {
          label
          value
        }
        documentFileId
        documentDownloadUrl
        documentFilename
        documentLabel
        minAge
        fieldOrder
      }
    }
  }
}
    `;
export const RequiredFormWithStatusFieldsFragmentDoc = gql`
    fragment RequiredFormWithStatusFields on RequiredFormWithStatus {
  form {
    ...RequiredFormFields
  }
  order
  submitted
  submissionId
  targetType
  targetId
}
    `;
export const EventListFieldsFragmentDoc = gql`
    fragment EventListFields on Event {
  id
  title
  slug
  startsAt
  endsAt
  shiftsCount
  requiredFormsCount
  coverUrl
  signedUpCount
}
    `;
export const RequiredFormRefFieldsFragmentDoc = gql`
    fragment RequiredFormRefFields on RequiredFormRef {
  form {
    ...RequiredFormFields
  }
  order
}
    `;
export const EventDetailFieldsFragmentDoc = gql`
    fragment EventDetailFields on Event {
  ...EventListFields
  createdAt
  location
  organizer {
    id
    name
    image
  }
  coverUrl
  logoUrl
  requiredForms {
    ...RequiredFormRefFields
  }
}
    `;
export const MyEventFieldsFragmentDoc = gql`
    fragment MyEventFields on Event {
  id
  title
  startsAt
  endsAt
  location
  myInvitedAt
  shiftsCount
  coverUrl
  organizationUnit {
    id
    name
    logoUrl
  }
}
    `;
export const DiscoverEventFieldsFragmentDoc = gql`
    fragment DiscoverEventFields on Event {
  id
  title
  startsAt
  endsAt
  shiftsCount
  coverUrl
  organizationUnit {
    id
    name
    logoUrl
  }
}
    `;
export const PublicEventOrganizationUnitFieldsFragmentDoc = gql`
    fragment PublicEventOrganizationUnitFields on EventOrganizationUnit {
  id
  name
  slug
  logoUrl
  myMembershipState
  requiredForms {
    ...RequiredFormRefFields
  }
}
    `;
export const PublicShiftInstanceFieldsFragmentDoc = gql`
    fragment PublicShiftInstanceFields on ShiftInstance {
  id
  actualStartsAt
  actualEndsAt
  overrideTitle
  overrideMaxVolunteers
  filledCount
  spotsLeft
}
    `;
export const PublicShiftFieldsFragmentDoc = gql`
    fragment PublicShiftFields on Shift {
  id
  title
  maxVolunteers
  instances {
    ...PublicShiftInstanceFields
  }
}
    `;
export const PublicEventFieldsFragmentDoc = gql`
    fragment PublicEventFields on Event {
  id
  title
  slug
  description
  location
  coverImageUrl
  startsAt
  endsAt
  shiftsCount
  myJoinStatus
  organizationUnit {
    ...PublicEventOrganizationUnitFields
  }
  shifts {
    ...PublicShiftFields
  }
  requiredForms {
    ...RequiredFormRefFields
  }
}
    `;
export const PublicOrganizationUnitFieldsFragmentDoc = gql`
    fragment PublicOrganizationUnitFields on OrganizationUnit {
  id
  name
  slug
  description
  logoUrl
  coverUrl
  address
  memberCount
  openShiftsCount
  myMembershipState
}
    `;
export const PublicOrgEventFieldsFragmentDoc = gql`
    fragment PublicOrgEventFields on Event {
  id
  title
  slug
  startsAt
  endsAt
  location
  shiftsCount
  shifts {
    id
    instances {
      id
      spotsLeft
    }
  }
}
    `;
export const PublicOrgShiftInstanceFieldsFragmentDoc = gql`
    fragment PublicOrgShiftInstanceFields on ShiftInstance {
  id
  actualStartsAt
  actualEndsAt
  overrideMaxVolunteers
  filledCount
  spotsLeft
}
    `;
export const PublicOrgShiftFieldsFragmentDoc = gql`
    fragment PublicOrgShiftFields on Shift {
  id
  title
  maxVolunteers
  rrule
  originalStartsAt
  durationMinutes
  instances {
    ...PublicOrgShiftInstanceFields
  }
}
    `;
export const PublicShiftDetailInstanceFieldsFragmentDoc = gql`
    fragment PublicShiftDetailInstanceFields on ShiftInstance {
  id
  actualStartsAt
  actualEndsAt
  overrideTitle
  overrideMaxVolunteers
  filledCount
  spotsLeft
  myInviteStatus
  isIntendingToJoin
  requiredFormsCount
  requiredForms {
    ...RequiredFormRefFields
  }
}
    `;
export const VolunteerHomeShiftInstanceFragmentDoc = gql`
    fragment VolunteerHomeShiftInstance on ShiftInstance {
  id
  overrideTitle
  actualStartsAt
  actualEndsAt
  isCheckedIn
  filledCount
  myInviteStatus
  myInvitedAt
  isIntendingToJoin
  master {
    id
    title
    location
    rrule
    maxVolunteers
    organizationUnit {
      id
      name
      logoUrl
    }
    event {
      id
      title
      coverImageUrl
    }
  }
}
    `;
export const GetReimbursementTypesDocument = gql`
    query GetReimbursementTypes {
  reimbursementTypes {
    id
    key
    legalReference
    yearlyLimitCents
    platformDefaultRateCents
  }
}
    `;
export const GetEffectiveRatesDocument = gql`
    query GetEffectiveRates($organizationUnitId: ID) {
  effectiveRates(organizationUnitId: $organizationUnitId) {
    reimbursementType {
      id
      key
      legalReference
      yearlyLimitCents
      platformDefaultRateCents
    }
    hourlyRateCents
    isOverride
    organizationUnitId
  }
}
    `;
export const SetReimbursementRateDocument = gql`
    mutation SetReimbursementRate($reimbursementTypeId: ID!, $hourlyRateCents: Int!, $organizationUnitId: ID) {
  setReimbursementRate(
    reimbursementTypeId: $reimbursementTypeId
    hourlyRateCents: $hourlyRateCents
    organizationUnitId: $organizationUnitId
  ) {
    id
    hourlyRateCents
  }
}
    `;
export const GetYearlyUsageDocument = gql`
    query GetYearlyUsage($reimbursementTypeId: ID!, $year: Int!) {
  yearlyUsage(reimbursementTypeId: $reimbursementTypeId, year: $year) {
    usedCents
    limitCents
    remainingCents
  }
}
    `;
export const GetRosterYearlyUsageDocument = gql`
    query GetRosterYearlyUsage($organizationUnitId: ID!, $year: Int!) {
  rosterYearlyUsage(organizationUnitId: $organizationUnitId, year: $year) {
    volunteer {
      id
      name
      image
    }
    usageByType {
      reimbursementType {
        id
        key
      }
      usedCents
      limitCents
      remainingCents
    }
  }
}
    `;
export const GetContractsDocument = gql`
    query GetContracts($filter: ContractFilterInput) {
  contracts(filter: $filter) {
    ...ContractSummaryFields
  }
}
    ${ContractSummaryFieldsFragmentDoc}`;
export const GetMyContractsDocument = gql`
    query GetMyContracts($filter: ContractFilterInput) {
  myContracts(filter: $filter) {
    ...ContractSummaryFields
  }
}
    ${ContractSummaryFieldsFragmentDoc}`;
export const GetContractDocument = gql`
    query GetContract($id: ID!) {
  contract(id: $id) {
    ...ContractSummaryFields
    resolvedBody
  }
}
    ${ContractSummaryFieldsFragmentDoc}`;
export const GetPendingContractSigneeDocument = gql`
    query GetPendingContractSignee($contractId: ID!) {
  pendingContractSignee(contractId: $contractId) {
    signeeType
    userId
    permissionKey
    eligibleUserIds
  }
}
    `;
export const CreateContractDocument = gql`
    mutation CreateContract($input: CreateContractInput!) {
  createContract(input: $input) {
    ...ContractSummaryFields
  }
}
    ${ContractSummaryFieldsFragmentDoc}`;
export const SignContractDocument = gql`
    mutation SignContract($contractId: ID!) {
  signContract(contractId: $contractId) {
    ...ContractSummaryFields
  }
}
    ${ContractSummaryFieldsFragmentDoc}`;
export const DeclineContractDocument = gql`
    mutation DeclineContract($contractId: ID!, $reason: String!) {
  declineContract(contractId: $contractId, reason: $reason) {
    ...ContractSummaryFields
  }
}
    ${ContractSummaryFieldsFragmentDoc}`;
export const GetInvoicesDocument = gql`
    query GetInvoices($filter: InvoiceFilterInput) {
  invoices(filter: $filter) {
    ...InvoiceSummaryFields
  }
}
    ${InvoiceSummaryFieldsFragmentDoc}`;
export const GetMyInvoicesDocument = gql`
    query GetMyInvoices($filter: InvoiceFilterInput) {
  myInvoices(filter: $filter) {
    ...InvoiceSummaryFields
  }
}
    ${InvoiceSummaryFieldsFragmentDoc}`;
export const GetInvoiceDocument = gql`
    query GetInvoice($id: ID!) {
  invoice(id: $id) {
    ...InvoiceSummaryFields
    resolvedBody
    invoiceTimeEntries {
      id
      timeEntry {
        id
        startedAt
        endedAt
        notes
        shiftInstance {
          id
          master {
            title
          }
        }
      }
    }
  }
}
    ${InvoiceSummaryFieldsFragmentDoc}`;
export const GetPendingInvoiceSigneeDocument = gql`
    query GetPendingInvoiceSignee($invoiceId: ID!) {
  pendingInvoiceSignee(invoiceId: $invoiceId) {
    signeeType
    userId
    permissionKey
    eligibleUserIds
  }
}
    `;
export const GetVolunteersNeedingTimesheetsDocument = gql`
    query GetVolunteersNeedingTimesheets($periodStart: DateTime, $periodEnd: DateTime) {
  volunteersNeedingTimesheets(periodStart: $periodStart, periodEnd: $periodEnd) {
    volunteer {
      id
      name
    }
    reimbursementType {
      id
      key
    }
    eligibleHours
  }
}
    `;
export const GetEligibleTimeEntriesForInvoiceDocument = gql`
    query GetEligibleTimeEntriesForInvoice($volunteerId: ID!, $reimbursementTypeId: ID!, $periodStart: DateTime, $periodEnd: DateTime) {
  eligibleTimeEntriesForInvoice(
    volunteerId: $volunteerId
    reimbursementTypeId: $reimbursementTypeId
    periodStart: $periodStart
    periodEnd: $periodEnd
  ) {
    id
    startedAt
    endedAt
    notes
    shiftInstance {
      id
      master {
        title
      }
    }
  }
}
    `;
export const CreateInvoiceDocument = gql`
    mutation CreateInvoice($input: CreateInvoiceInput!) {
  createInvoice(input: $input) {
    ...InvoiceSummaryFields
  }
}
    ${InvoiceSummaryFieldsFragmentDoc}`;
export const SignInvoiceDocument = gql`
    mutation SignInvoice($invoiceId: ID!) {
  signInvoice(invoiceId: $invoiceId) {
    ...InvoiceSummaryFields
  }
}
    ${InvoiceSummaryFieldsFragmentDoc}`;
export const DeclineInvoiceDocument = gql`
    mutation DeclineInvoice($invoiceId: ID!, $reason: String!) {
  declineInvoice(invoiceId: $invoiceId, reason: $reason) {
    ...InvoiceSummaryFields
  }
}
    ${InvoiceSummaryFieldsFragmentDoc}`;
export const GetDocumentTemplatesDocument = gql`
    query GetDocumentTemplates {
  documentTemplates {
    ...DocumentTemplateSummaryFields
  }
}
    ${DocumentTemplateSummaryFieldsFragmentDoc}`;
export const GetDocumentTemplateDocument = gql`
    query GetDocumentTemplate($id: ID!) {
  documentTemplate(id: $id) {
    ...DocumentTemplateSummaryFields
    body
  }
}
    ${DocumentTemplateSummaryFieldsFragmentDoc}`;
export const GetActiveDocumentTemplateDocument = gql`
    query GetActiveDocumentTemplate($kind: DocumentKind!, $reimbursementTypeId: ID!, $organizationUnitId: ID) {
  activeDocumentTemplate(
    kind: $kind
    reimbursementTypeId: $reimbursementTypeId
    organizationUnitId: $organizationUnitId
  ) {
    ...DocumentTemplateSummaryFields
    body
  }
}
    ${DocumentTemplateSummaryFieldsFragmentDoc}`;
export const CreateDocumentTemplateDocument = gql`
    mutation CreateDocumentTemplate($input: CreateDocumentTemplateInput!) {
  createDocumentTemplate(input: $input) {
    ...DocumentTemplateSummaryFields
  }
}
    ${DocumentTemplateSummaryFieldsFragmentDoc}`;
export const UpdateDocumentTemplateDocument = gql`
    mutation UpdateDocumentTemplate($id: ID!, $input: UpdateDocumentTemplateInput!) {
  updateDocumentTemplate(id: $id, input: $input) {
    ...DocumentTemplateSummaryFields
  }
}
    ${DocumentTemplateSummaryFieldsFragmentDoc}`;
export const DeleteDocumentTemplateDocument = gql`
    mutation DeleteDocumentTemplate($id: ID!) {
  deleteDocumentTemplate(id: $id)
}
    `;
export const GetBundleDownloadStatusDocument = gql`
    query GetBundleDownloadStatus($volunteerId: ID!, $reimbursementTypeId: ID!) {
  bundleDownloadStatus(
    volunteerId: $volunteerId
    reimbursementTypeId: $reimbursementTypeId
  ) {
    volunteer {
      id
      name
    }
    reimbursementType {
      id
      key
    }
    downloadedAt
    downloadedByUser {
      id
      name
    }
  }
}
    `;
export const RecordBundleDownloadDocument = gql`
    mutation RecordBundleDownload($volunteerId: ID!, $reimbursementTypeId: ID!, $invoiceIds: [ID!]) {
  recordBundleDownload(
    volunteerId: $volunteerId
    reimbursementTypeId: $reimbursementTypeId
    invoiceIds: $invoiceIds
  ) {
    volunteer {
      id
      name
    }
    reimbursementType {
      id
      key
    }
    downloadedAt
    downloadedByUser {
      id
      name
    }
  }
}
    `;
export const GetManualBaselineDocument = gql`
    query GetManualBaseline($volunteerId: ID!, $reimbursementTypeId: ID!, $year: Int!) {
  manualBaseline(
    volunteerId: $volunteerId
    reimbursementTypeId: $reimbursementTypeId
    year: $year
  ) {
    volunteer {
      id
      name
    }
    reimbursementType {
      id
      key
    }
    year
    amountCents
    updatedAt
    updatedByUser {
      id
      name
    }
  }
}
    `;
export const SetManualBaselineDocument = gql`
    mutation SetManualBaseline($volunteerId: ID!, $reimbursementTypeId: ID!, $year: Int!, $amountCents: Int!) {
  setManualBaseline(
    volunteerId: $volunteerId
    reimbursementTypeId: $reimbursementTypeId
    year: $year
    amountCents: $amountCents
  ) {
    volunteer {
      id
      name
    }
    reimbursementType {
      id
      key
    }
    year
    amountCents
    updatedAt
    updatedByUser {
      id
      name
    }
  }
}
    `;
export const MyDocumentsDocument = gql`
    query MyDocuments {
  myDocuments {
    membershipId
    organizationUnitId
    organizationUnitName
    organizationName
    logoUrl
    contracts {
      ...ContractSummaryFields
    }
    invoices {
      ...InvoiceSummaryFields
    }
  }
}
    ${ContractSummaryFieldsFragmentDoc}
${InvoiceSummaryFieldsFragmentDoc}`;
export const MyDocumentSummaryDocument = gql`
    query MyDocumentSummary {
  myDocumentSummary {
    total
    pending
  }
}
    `;
export const GetEventsDocument = gql`
    query GetEvents($limit: Int!, $offset: Int!) {
  events(limit: $limit, offset: $offset) {
    items {
      ...EventListFields
    }
    pagination {
      total
      limit
      offset
      hasMore
    }
  }
}
    ${EventListFieldsFragmentDoc}`;
export const GetMyEventsDocument = gql`
    query GetMyEvents($includePast: Boolean = false, $startsAfter: DateTime, $endsBefore: DateTime, $limit: Int = 15, $offset: Int = 0, $order: SortOrder = ASC, $statuses: [EventInviteStatus!]) {
  myEvents(
    includePast: $includePast
    startsAfter: $startsAfter
    endsBefore: $endsBefore
    limit: $limit
    offset: $offset
    order: $order
    statuses: $statuses
  ) {
    items {
      ...MyEventFields
    }
    pagination {
      total
      limit
      offset
      hasMore
    }
  }
}
    ${MyEventFieldsFragmentDoc}`;
export const GetAvailableEventsDocument = gql`
    query GetAvailableEvents($startsAfter: DateTime, $endsBefore: DateTime, $limit: Int = 15, $offset: Int = 0, $organizationUnitIds: [ID!]) {
  availableEvents(
    startsAfter: $startsAfter
    endsBefore: $endsBefore
    limit: $limit
    offset: $offset
    organizationUnitIds: $organizationUnitIds
  ) {
    items {
      ...DiscoverEventFields
    }
    pagination {
      total
      limit
      offset
      hasMore
    }
  }
}
    ${DiscoverEventFieldsFragmentDoc}`;
export const GetEventDocument = gql`
    query GetEvent($id: ID!) {
  event(id: $id) {
    ...EventDetailFields
  }
}
    ${EventDetailFieldsFragmentDoc}
${EventListFieldsFragmentDoc}
${RequiredFormRefFieldsFragmentDoc}
${RequiredFormFieldsFragmentDoc}`;
export const GetEventInvitesDocument = gql`
    query GetEventInvites($eventId: ID!) {
  eventInvites(eventId: $eventId) {
    id
    status
    user {
      id
      name
      email
      image
      checkInId
    }
  }
}
    `;
export const CreateEventDocument = gql`
    mutation CreateEvent($input: CreateEventInput!) {
  createEvent(input: $input) {
    ...EventDetailFields
  }
}
    ${EventDetailFieldsFragmentDoc}
${EventListFieldsFragmentDoc}
${RequiredFormRefFieldsFragmentDoc}
${RequiredFormFieldsFragmentDoc}`;
export const UpdateEventDocument = gql`
    mutation UpdateEvent($id: ID!, $input: UpdateEventInput!) {
  updateEvent(id: $id, input: $input) {
    ...EventDetailFields
  }
}
    ${EventDetailFieldsFragmentDoc}
${EventListFieldsFragmentDoc}
${RequiredFormRefFieldsFragmentDoc}
${RequiredFormFieldsFragmentDoc}`;
export const DeleteEventDocument = gql`
    mutation DeleteEvent($id: ID!) {
  deleteEvent(id: $id) {
    id
  }
}
    `;
export const InviteMembersToEventDocument = gql`
    mutation InviteMembersToEvent($eventId: ID!, $memberIds: [String!]!) {
  inviteMembersToEvent(eventId: $eventId, memberIds: $memberIds) {
    id
  }
}
    `;
export const UpdateEventInviteStatusDocument = gql`
    mutation UpdateEventInviteStatus($eventId: ID!, $status: EventInviteStatus!, $userId: String) {
  updateEventInviteStatus(eventId: $eventId, status: $status, userId: $userId) {
    id
    status
    userId
  }
}
    `;
export const GetPublicEventDocument = gql`
    query GetPublicEvent($id: ID!) {
  publicEvent(id: $id) {
    ...PublicEventFields
  }
}
    ${PublicEventFieldsFragmentDoc}
${PublicEventOrganizationUnitFieldsFragmentDoc}
${RequiredFormRefFieldsFragmentDoc}
${RequiredFormFieldsFragmentDoc}
${PublicShiftFieldsFragmentDoc}
${PublicShiftInstanceFieldsFragmentDoc}`;
export const JoinEventDocument = gql`
    mutation JoinEvent($eventId: ID!) {
  joinEvent(eventId: $eventId) {
    status
    event {
      id
    }
    requiredForms {
      ...RequiredFormWithStatusFields
    }
  }
}
    ${RequiredFormWithStatusFieldsFragmentDoc}
${RequiredFormFieldsFragmentDoc}`;
export const SetEventRequiredFormsDocument = gql`
    mutation SetEventRequiredForms($eventId: ID!, $formIds: [String!]!) {
  setEventRequiredForms(eventId: $eventId, formIds: $formIds) {
    ...RequiredFormRefFields
  }
}
    ${RequiredFormRefFieldsFragmentDoc}
${RequiredFormFieldsFragmentDoc}`;
export const GetOrganizationUnitMembershipsDocument = gql`
    query GetOrganizationUnitMemberships {
  memberships {
    id
    user {
      id
      name
      email
      image
      checkInId
    }
    organizationUnit {
      id
      name
    }
    roles {
      id
      name
      description
      isInternal
    }
  }
}
    `;
export const GetMyMembershipStatusDocument = gql`
    query GetMyMembershipStatus($organizationUnitId: ID!) {
  myMembershipStatus(organizationUnitId: $organizationUnitId)
}
    `;
export const UpdateMembershipRolesDocument = gql`
    mutation UpdateMembershipRoles($membershipId: ID!, $roleIds: [ID!]!) {
  updateMembershipRoles(membershipId: $membershipId, roleIds: $roleIds) {
    id
    user {
      id
      name
      email
      image
      checkInId
    }
    organizationUnit {
      id
      name
    }
    roles {
      id
      name
      description
      isInternal
    }
  }
}
    `;
export const LeaveMembershipDocument = gql`
    mutation LeaveMembership($id: ID!) {
  leaveMembership(id: $id) {
    id
  }
}
    `;
export const RemoveMembershipDocument = gql`
    mutation RemoveMembership($id: ID!) {
  removeMembership(id: $id) {
    id
  }
}
    `;
export const MyMembershipsDocument = gql`
    query MyMemberships {
  myMemberships {
    id
    createdAt
    organizationUnit {
      id
      name
      logoUrl
      type {
        icon
      }
      parent {
        id
      }
      organization {
        name
      }
    }
    roles {
      id
      name
    }
  }
}
    `;
export const MyMembershipDocument = gql`
    query MyMembership($id: ID!) {
  myMembership(id: $id) {
    id
    createdAt
    organizationUnit {
      id
      name
      logoUrl
      type {
        icon
      }
      parent {
        id
      }
      organization {
        name
      }
    }
    roles {
      id
      name
    }
  }
}
    `;
export const JoinOrganizationDocument = gql`
    mutation JoinOrganization($organizationUnitId: ID!) {
  joinOrganization(organizationUnitId: $organizationUnitId) {
    status
    membershipRequestId
    requirementProfile {
      id
      name
      description
      requirements {
        id
        name
        description
        type
        mandatory
      }
    }
    requirementStatuses {
      requirementId
      name
      status
    }
    requiredForms {
      form {
        id
        name
        description
      }
      order
      submitted
      submissionId
    }
  }
}
    `;
export const ApproveMembershipRequestDocument = gql`
    mutation ApproveMembershipRequest($id: ID!, $organizationUnitId: ID!) {
  approveMembershipRequest(id: $id, organizationUnitId: $organizationUnitId) {
    id
  }
}
    `;
export const RejectMembershipRequestDocument = gql`
    mutation RejectMembershipRequest($id: ID!, $organizationUnitId: ID!, $rejectionReason: String!) {
  rejectMembershipRequest(
    id: $id
    organizationUnitId: $organizationUnitId
    rejectionReason: $rejectionReason
  ) {
    id
  }
}
    `;
export const CancelMembershipRequestDocument = gql`
    mutation CancelMembershipRequest($id: ID!, $organizationUnitId: ID!) {
  cancelMembershipRequest(id: $id, organizationUnitId: $organizationUnitId) {
    id
  }
}
    `;
export const RemoveMembershipRequestDocument = gql`
    mutation RemoveMembershipRequest($id: ID!) {
  removeMembershipRequest(id: $id) {
    id
  }
}
    `;
export const GetMembershipRequestsDocument = gql`
    query GetMembershipRequests($status: MembershipRequestStatus, $limit: Int!, $offset: Int!) {
  membershipRequests(status: $status, limit: $limit, offset: $offset) {
    items {
      id
      organizationUnit {
        id
        name
      }
      user {
        id
        name
        email
        image
        checkInId
      }
      status
      reviewedBy {
        id
        name
      }
      reviewedAt
      rejectionReason
      createdAt
      updatedAt
    }
  }
}
    `;
export const GetMembershipRequestCountDocument = gql`
    query GetMembershipRequestCount($status: MembershipRequestStatus) {
  membershipRequestCount(status: $status)
}
    `;
export const GetMyMembershipRequestsDocument = gql`
    query GetMyMembershipRequests($limit: Int!, $offset: Int!) {
  myMembershipRequests(limit: $limit, offset: $offset) {
    items {
      id
      organizationUnit {
        id
        name
        logoUrl
        type {
          icon
        }
        parent {
          id
        }
        organization {
          name
        }
      }
      user {
        id
        name
        email
      }
      contact {
        id
        name
      }
      status
      reviewedAt
      rejectionReason
      createdAt
    }
  }
}
    `;
export const CheckInApproveMembershipRequestDocument = gql`
    mutation CheckInApproveMembershipRequest($requestId: ID!) {
  checkInApproveMembershipRequest(requestId: $requestId) {
    id
    status
  }
}
    `;
export const GetOrganizationDocument = gql`
    query GetOrganization($id: String!) {
  organization(id: $id) {
    id
    name
    slug
    description
    logoUrl
    websiteUrl
    contactEmail
    phone
    address
    city
    zipCode
    createdAt
    updatedAt
  }
}
    `;
export const GetOrganizationBySlugDocument = gql`
    query GetOrganizationBySlug($slug: String!) {
  organizationBySlug(slug: $slug) {
    id
    name
    slug
    description
    logoUrl
    websiteUrl
    contactEmail
    phone
    address
    createdAt
  }
}
    `;
export const GetOrganizationRootDocument = gql`
    query GetOrganizationRoot($id: String!) {
  organization(id: $id) {
    id
    root {
      id
    }
  }
}
    `;
export const GetOrganizationUnitDocument = gql`
    query GetOrganizationUnit($id: String!) {
  organizationUnit(id: $id) {
    id
    slug
    name
    description
    logoUrl
    websiteUrl
    contactEmail
    phone
    address
    city
    zipCode
    legalRep
    organizationId
    requiredForms {
      form {
        id
        name
        description
        settings {
          submitButtonLabel
          successTitle
          successMessage
        }
        blockRefs {
          id
          formId
          blockId
          fieldOrder
          required
          block {
            id
            organizationId
            title
            description
            icon
            required
            isEditable
            fields {
              id
              blockId
              type
              label
              placeholder
              description
              required
              lockType
              systemKey
              options {
                label
                value
              }
              documentFileId
              documentDownloadUrl
              documentFilename
              documentLabel
              minAge
              fieldOrder
            }
          }
        }
      }
      order
    }
    parent {
      id
      name
    }
    type {
      id
      name
      icon
    }
  }
}
    `;
export const GetOrganizationVolunteersByUnitDocument = gql`
    query GetOrganizationVolunteersByUnit($id: ID!) {
  members(organizationUnitId: $id) {
    id
    name
    email
    image
    checkInId
  }
}
    `;
export const GetOrganizationUnitWithOrgDocument = gql`
    query GetOrganizationUnitWithOrg($id: String!) {
  organizationUnit(id: $id) {
    id
    name
    organization {
      name
    }
  }
}
    `;
export const GetOrganizationUnitPublicInfoDocument = gql`
    query GetOrganizationUnitPublicInfo($id: String!) {
  organizationUnit(id: $id) {
    id
    name
    description
    logoUrl
    websiteUrl
    contactEmail
    phone
  }
}
    `;
export const GetOrganizationsWithRootDocument = gql`
    query GetOrganizationsWithRoot($limit: Int!, $offset: Int!) {
  organizations(limit: $limit, offset: $offset) {
    items {
      id
      name
      description
      logoUrl
      root {
        id
        slug
        name
        description
        logoUrl
        address
      }
    }
  }
}
    `;
export const GetMyOrganizationUnitsDocument = gql`
    query GetMyOrganizationUnits {
  myOrganizationUnits {
    id
    slug
    name
    description
    logoUrl
    address
    city
    legalRep
    parent {
      id
    }
    organization {
      id
      name
      description
      logoUrl
      accountingEnabled
    }
  }
}
    `;
export const GetMyAdminstableOrganizationUnitsDocument = gql`
    query GetMyAdminstableOrganizationUnits {
  myAdminstableOrganizationUnits {
    id
    slug
    name
    description
    logoUrl
    address
    city
    legalRep
    parent {
      id
    }
    organization {
      id
      name
      description
      logoUrl
      accountingEnabled
    }
  }
}
    `;
export const GetMyCheckInAdministrableOrganizationUnitsDocument = gql`
    query GetMyCheckInAdministrableOrganizationUnits {
  myCheckInAdministrableOrganizationUnits {
    id
    slug
    name
    description
    logoUrl
    address
    city
    legalRep
    parent {
      id
    }
    organization {
      id
      name
      description
      logoUrl
      accountingEnabled
    }
  }
}
    `;
export const GetOrganizationsDocument = gql`
    query GetOrganizations($limit: Int!, $offset: Int!) {
  organizations(limit: $limit, offset: $offset) {
    items {
      id
      name
      slug
      description
      logoUrl
      createdAt
    }
    pagination {
      total
      limit
      offset
      hasMore
    }
  }
}
    `;
export const CreateOrganizationDocument = gql`
    mutation CreateOrganization($input: CreateOrganizationInput!) {
  createOrganization(input: $input) {
    id
    name
    slug
    description
    logoUrl
    websiteUrl
    createdAt
    root {
      id
    }
  }
}
    `;
export const UpdateOrganizationDocument = gql`
    mutation UpdateOrganization($id: ID!, $input: UpdateOrganizationInput!) {
  updateOrganization(id: $id, input: $input) {
    id
    name
    address
    city
    zipCode
  }
}
    `;
export const GetOrganizationTreeDocument = gql`
    query GetOrganizationTree {
  organizationTree {
    root
  }
}
    `;
export const GetOrganizationUnitTypesDocument = gql`
    query GetOrganizationUnitTypes {
  organizationUnitTypes {
    id
    name
    description
    icon
  }
}
    `;
export const CreateOrganizationUnitDocument = gql`
    mutation CreateOrganizationUnit($input: CreateOrganizationUnitInput!) {
  createOrganizationUnit(input: $input) {
    id
    name
    slug
    deletedAt
    parent {
      id
      name
    }
    type {
      id
      name
      icon
    }
  }
}
    `;
export const UpdateOrganizationUnitDocument = gql`
    mutation UpdateOrganizationUnit($id: String!, $input: UpdateOrganizationUnitInput!) {
  updateOrganizationUnit(id: $id, input: $input) {
    id
    name
    slug
    deletedAt
    address
    city
    zipCode
    legalRep
    parent {
      id
    }
    type {
      id
      name
      icon
    }
  }
}
    `;
export const DeleteOrganizationUnitDocument = gql`
    mutation DeleteOrganizationUnit($id: String!) {
  deleteOrganizationUnit(id: $id) {
    id
    name
  }
}
    `;
export const IsMemberOfOrgUnitOrAncestorDocument = gql`
    query IsMemberOfOrgUnitOrAncestor($organizationUnitId: ID!, $userId: String!) {
  isMemberOfUnitOrAncestor(
    organizationUnitId: $organizationUnitId
    userId: $userId
  )
}
    `;
export const SetRequiredFormsDocument = gql`
    mutation SetRequiredForms($organizationUnitId: String!, $formIds: [String!]!) {
  setRequiredForms(organizationUnitId: $organizationUnitId, formIds: $formIds) {
    form {
      id
      name
      description
    }
    order
  }
}
    `;
export const GetPublicOrganizationUnitDocument = gql`
    query GetPublicOrganizationUnit($id: ID!) {
  publicOrganizationUnit(id: $id) {
    ...PublicOrganizationUnitFields
  }
}
    ${PublicOrganizationUnitFieldsFragmentDoc}`;
export const GetPublicEventsByOrganizationUnitDocument = gql`
    query GetPublicEventsByOrganizationUnit($organizationUnitId: ID!) {
  publicEventsByOrganizationUnit(organizationUnitId: $organizationUnitId) {
    ...PublicOrgEventFields
  }
}
    ${PublicOrgEventFieldsFragmentDoc}`;
export const GetPublicShiftsByOrganizationUnitDocument = gql`
    query GetPublicShiftsByOrganizationUnit($organizationUnitId: ID!) {
  publicShiftsByOrganizationUnit(organizationUnitId: $organizationUnitId) {
    ...PublicOrgShiftFields
  }
}
    ${PublicOrgShiftFieldsFragmentDoc}
${PublicOrgShiftInstanceFieldsFragmentDoc}`;
export const GetFormBlockDocument = gql`
    query GetFormBlock($id: String!) {
  formBlock(id: $id) {
    id
    organizationId
    title
    description
    icon
    required
    isEditable
    createdBy
    updatedBy
    createdAt
    updatedAt
    fields {
      id
      blockId
      type
      label
      placeholder
      description
      required
      lockType
      systemKey
      options {
        label
        value
      }
      documentFileId
      documentDownloadUrl
      documentFilename
      documentLabel
      minAge
      fieldOrder
      createdAt
      updatedAt
    }
  }
}
    `;
export const GetFormBlocksDocument = gql`
    query GetFormBlocks($organizationId: String!, $limit: Int!, $offset: Int!) {
  formBlocks(organizationId: $organizationId, limit: $limit, offset: $offset) {
    items {
      id
      organizationId
      title
      description
      icon
      required
      isEditable
      createdBy
      updatedBy
      createdAt
      updatedAt
      fields {
        id
        blockId
        type
        label
        placeholder
        description
        required
        lockType
        systemKey
        options {
          label
          value
        }
        documentFileId
        documentDownloadUrl
        documentFilename
        documentLabel
        minAge
        fieldOrder
        createdAt
        updatedAt
      }
    }
    pagination {
      total
      limit
      offset
      hasMore
    }
  }
}
    `;
export const CreateFormBlockDocument = gql`
    mutation CreateFormBlock($input: CreateFormBlockInput!) {
  createFormBlock(input: $input) {
    id
    organizationId
    title
    description
    icon
    required
    isEditable
    createdBy
    updatedBy
    createdAt
    updatedAt
    fields {
      id
      blockId
      type
      label
      placeholder
      description
      required
      lockType
      systemKey
      options {
        label
        value
      }
      documentFileId
      documentDownloadUrl
      documentFilename
      documentLabel
      minAge
      fieldOrder
      createdAt
      updatedAt
    }
  }
}
    `;
export const UpdateFormBlockDocument = gql`
    mutation UpdateFormBlock($id: String!, $input: UpdateFormBlockInput!) {
  updateFormBlock(id: $id, input: $input) {
    id
    organizationId
    title
    description
    icon
    required
    isEditable
    createdBy
    updatedBy
    createdAt
    updatedAt
    fields {
      id
      blockId
      type
      label
      placeholder
      description
      required
      lockType
      systemKey
      options {
        label
        value
      }
      documentFileId
      documentDownloadUrl
      documentFilename
      documentLabel
      minAge
      fieldOrder
      createdAt
      updatedAt
    }
  }
}
    `;
export const DeleteFormBlockDocument = gql`
    mutation DeleteFormBlock($id: String!) {
  deleteFormBlock(id: $id) {
    id
  }
}
    `;
export const CreateFormBlockFieldDocument = gql`
    mutation CreateFormBlockField($blockId: String!, $input: CreateFormBlockFieldInput!) {
  createFormBlockField(blockId: $blockId, input: $input) {
    id
    organizationId
    title
    description
    icon
    required
    isEditable
    createdBy
    updatedBy
    createdAt
    updatedAt
    fields {
      id
      blockId
      type
      label
      placeholder
      description
      required
      lockType
      systemKey
      options {
        label
        value
      }
      documentFileId
      documentDownloadUrl
      documentFilename
      documentLabel
      minAge
      fieldOrder
      createdAt
      updatedAt
    }
  }
}
    `;
export const UpdateFormBlockFieldDocument = gql`
    mutation UpdateFormBlockField($fieldId: String!, $input: UpdateFormBlockFieldInput!) {
  updateFormBlockField(fieldId: $fieldId, input: $input) {
    id
    organizationId
    title
    description
    icon
    required
    isEditable
    createdBy
    updatedBy
    createdAt
    updatedAt
    fields {
      id
      blockId
      type
      label
      placeholder
      description
      required
      lockType
      systemKey
      options {
        label
        value
      }
      documentFileId
      documentDownloadUrl
      documentFilename
      documentLabel
      minAge
      fieldOrder
      createdAt
      updatedAt
    }
  }
}
    `;
export const DeleteFormBlockFieldDocument = gql`
    mutation DeleteFormBlockField($fieldId: String!) {
  deleteFormBlockField(fieldId: $fieldId) {
    id
    organizationId
    title
    description
    icon
    required
    isEditable
    createdBy
    updatedBy
    createdAt
    updatedAt
    fields {
      id
      blockId
      type
      label
      placeholder
      description
      required
      lockType
      systemKey
      options {
        label
        value
      }
      documentFileId
      documentDownloadUrl
      documentFilename
      documentLabel
      minAge
      fieldOrder
      createdAt
      updatedAt
    }
  }
}
    `;
export const GetRequirementFormDocument = gql`
    query GetRequirementForm($id: String!) {
  requirementForm(id: $id) {
    id
    organizationId
    organizationUnitId
    slug
    name
    description
    settings {
      submitButtonLabel
      successTitle
      successMessage
      allowEmbed
    }
    shareToken
    submissionCount
    createdBy
    updatedBy
    createdAt
    updatedAt
    blockRefs {
      id
      formId
      blockId
      fieldOrder
      required
      createdAt
      updatedAt
      block {
        id
        organizationId
        title
        description
        icon
        required
        isEditable
        createdBy
        updatedBy
        createdAt
        updatedAt
        fields {
          id
          blockId
          type
          label
          placeholder
          description
          required
          lockType
          systemKey
          options {
            label
            value
          }
          documentFileId
          documentDownloadUrl
          documentFilename
          documentLabel
          minAge
          fieldOrder
          createdAt
          updatedAt
        }
      }
    }
  }
}
    `;
export const GetRequirementFormByShareTokenDocument = gql`
    query GetRequirementFormByShareToken($token: String!) {
  requirementFormByShareToken(token: $token) {
    id
    organizationUnitId
    name
    description
    settings {
      submitButtonLabel
      successTitle
      successMessage
      allowEmbed
    }
    blockRefs {
      id
      formId
      blockId
      fieldOrder
      required
      block {
        id
        title
        description
        icon
        required
        fields {
          id
          blockId
          type
          label
          placeholder
          description
          required
          systemKey
          options {
            label
            value
          }
          documentFileId
          documentDownloadUrl
          documentFilename
          documentLabel
        }
      }
    }
  }
}
    `;
export const GetRequirementFormsDocument = gql`
    query GetRequirementForms($organizationId: String!, $limit: Int!, $offset: Int!) {
  requirementForms(
    organizationId: $organizationId
    limit: $limit
    offset: $offset
  ) {
    items {
      id
      organizationId
      organizationUnitId
      slug
      name
      description
      settings {
        submitButtonLabel
        successTitle
        successMessage
        allowEmbed
      }
      shareToken
      submissionCount
      createdBy
      updatedBy
      createdAt
      updatedAt
      blockRefs {
        id
        formId
        blockId
        fieldOrder
        required
        createdAt
        updatedAt
        block {
          id
          organizationId
          title
          description
          icon
          required
          isEditable
          createdBy
          updatedBy
          createdAt
          updatedAt
        }
      }
    }
    pagination {
      total
      limit
      offset
      hasMore
    }
  }
}
    `;
export const CreateRequirementFormDocument = gql`
    mutation CreateRequirementForm($input: CreateRequirementFormInput!) {
  createRequirementForm(input: $input) {
    id
    organizationId
    organizationUnitId
    slug
    name
    description
    shareToken
    submissionCount
    createdAt
    updatedAt
  }
}
    `;
export const UpdateRequirementFormDocument = gql`
    mutation UpdateRequirementForm($id: String!, $input: UpdateRequirementFormInput!) {
  updateRequirementForm(id: $id, input: $input) {
    id
    organizationId
    organizationUnitId
    slug
    name
    description
    shareToken
    submissionCount
    updatedAt
  }
}
    `;
export const DeleteRequirementFormDocument = gql`
    mutation DeleteRequirementForm($id: String!) {
  deleteRequirementForm(id: $id) {
    id
  }
}
    `;
export const RegenerateFormShareTokenDocument = gql`
    mutation RegenerateFormShareToken($id: String!) {
  regenerateFormShareToken(id: $id) {
    id
    shareToken
  }
}
    `;
export const SubmitFormDocument = gql`
    mutation SubmitForm($token: String!, $organizationUnitId: ID!, $input: SubmitFormInput!) {
  submitForm(
    token: $token
    organizationUnitId: $organizationUnitId
    input: $input
  ) {
    id
    formId
    userId
    submittedAt
  }
}
    `;
export const SubmitRequiredFormDocument = gql`
    mutation SubmitRequiredForm($targetType: RequiredFormTargetType!, $targetId: String!, $formId: String!, $input: SubmitFormInput!) {
  submitRequiredForm(
    targetType: $targetType
    targetId: $targetId
    formId: $formId
    input: $input
  ) {
    id
    formId
    userId
    submittedAt
  }
}
    `;
export const GetMyFormSubmissionByTokenDocument = gql`
    query GetMyFormSubmissionByToken($token: String!) {
  myFormSubmissionByToken(token: $token) {
    id
    formId
    userId
    submittedAt
  }
}
    `;
export const GetMyFormSubmissionsDocument = gql`
    query GetMyFormSubmissions($organizationUnitId: ID!) {
  myFormSubmissions(organizationUnitId: $organizationUnitId) {
    id
    submittedAt
    form {
      id
      name
      description
      shareToken
    }
  }
}
    `;
export const GetMyUserProfileDocument = gql`
    query GetMyUserProfile {
  myUserProfile {
    id
    userId
    data
    createdAt
    updatedAt
  }
}
    `;
export const UpdateMyUserProfileDocument = gql`
    mutation UpdateMyUserProfile($input: UpdateUserProfileInput!) {
  updateMyUserProfile(input: $input) {
    id
    userId
    data
    updatedAt
  }
}
    `;
export const GetFormSubmissionsByMembershipRequestDocument = gql`
    query GetFormSubmissionsByMembershipRequest($membershipRequestId: String!) {
  formSubmissionsByMembershipRequest(membershipRequestId: $membershipRequestId) {
    id
    submittedAt
    form {
      id
      name
    }
  }
}
    `;
export const GetFormSubmissionsForVolunteerDocument = gql`
    query GetFormSubmissionsForVolunteer($userId: String!) {
  formSubmissionsForVolunteer(userId: $userId) {
    id
    submittedAt
    form {
      id
      name
    }
  }
}
    `;
export const GetAdminFormSubmissionDocument = gql`
    query GetAdminFormSubmission($id: String!) {
  adminVolunteerSubmission(id: $id) {
    id
    submittedAt
    user {
      id
      name
      email
      checkInId
    }
    form {
      id
      name
      blockRefs {
        fieldOrder
        block {
          id
          fields {
            id
            label
            type
            systemKey
            options {
              label
              value
            }
          }
        }
      }
    }
    values {
      fieldId
      value
    }
  }
}
    `;
export const GetFormSubmissionsByFormDocument = gql`
    query GetFormSubmissionsByForm($formId: String!, $limit: Int!, $offset: Int!) {
  formSubmissionsByForm(formId: $formId, limit: $limit, offset: $offset) {
    items {
      id
      submittedAt
      user {
        id
        name
        email
        checkInId
        image
      }
    }
    pagination {
      total
      limit
      offset
      hasMore
    }
  }
}
    `;
export const MyRequiredOrgUnitFormsDocument = gql`
    query MyRequiredOrgUnitForms($organizationUnitId: ID!) {
  myRequiredOrgUnitForms(organizationUnitId: $organizationUnitId) {
    id
    name
    description
    shareToken
  }
}
    `;
export const MyFormSubmissionDocument = gql`
    query MyFormSubmission($id: ID!) {
  myFormSubmission(id: $id) {
    id
    submittedAt
    form {
      id
      name
      blockRefs {
        fieldOrder
        block {
          id
          fields {
            id
            label
            type
            systemKey
            options {
              label
              value
            }
          }
        }
      }
    }
    values {
      fieldId
      value
    }
  }
}
    `;
export const GetAdminUserProfileDocument = gql`
    query GetAdminUserProfile($userId: String!) {
  adminUserProfile(userId: $userId) {
    id
    userId
    data
    createdAt
    updatedAt
  }
}
    `;
export const CreateRequirementProfileSubmissionDocument = gql`
    mutation CreateRequirementProfileSubmission($input: CreateRequirementProfileSubmissionInput!) {
  createRequirementProfileSubmission(input: $input) {
    id
    status
    requirementProfile {
      id
      name
    }
  }
}
    `;
export const GetRoleDocument = gql`
    query GetRole($id: String!) {
  role(id: $id) {
    id
    name
    description
    isInternal
    permissions {
      id
      key
      description
    }
  }
}
    `;
export const GetRolesDocument = gql`
    query GetRoles {
  roles {
    id
    name
    description
    isInternal
    permissions {
      id
      key
      description
    }
  }
}
    `;
export const GetPermissionsDocument = gql`
    query GetPermissions {
  permissions {
    id
    key
    description
  }
}
    `;
export const GetPermissionGroupsDocument = gql`
    query GetPermissionGroups {
  permissionGroups {
    key
    label
    items {
      label
      permission {
        id
        key
        description
      }
    }
  }
}
    `;
export const CreateRoleDocument = gql`
    mutation createRole($input: CreateRoleInput!) {
  createRole(input: $input) {
    id
    name
    description
    permissions {
      id
      key
    }
  }
}
    `;
export const UpdateRoleDocument = gql`
    mutation UpdateRole($id: ID!, $input: CreateRoleInput!) {
  updateRole(id: $id, input: $input) {
    id
    name
    description
    permissions {
      id
      key
    }
  }
}
    `;
export const DeleteRoleDocument = gql`
    mutation DeleteRole($id: ID!) {
  deleteRole(id: $id) {
    id
    name
  }
}
    `;
export const GetShiftDocument = gql`
    query GetShift($id: String!) {
  shift(id: $id) {
    id
    title
    slug
    instructions
    location
    imageUrl
    visibility
    createdAt
    maxVolunteers
    minVolunteers
    reimbursementTypeId
    rrule
    originalStartsAt
    durationMinutes
    organizationUnitId
    requiredFormsCount
    requiredForms {
      ...RequiredFormRefFields
    }
    organizationUnit {
      id
      name
      logoUrl
      myMembershipState
      requiredForms {
        ...RequiredFormRefFields
      }
      organization {
        id
        name
      }
    }
    createdBy {
      id
      name
      image
    }
    event {
      id
      title
      coverImageUrl
    }
  }
}
    ${RequiredFormRefFieldsFragmentDoc}
${RequiredFormFieldsFragmentDoc}`;
export const GetShiftsDocument = gql`
    query GetShifts($limit: Int!, $offset: Int!) {
  shifts(limit: $limit, offset: $offset) {
    items {
      id
      title
      rrule
      originalStartsAt
      durationMinutes
      visibility
      maxVolunteers
      minVolunteers
      requiredFormsCount
      createdBy {
        id
        name
        email
      }
    }
    pagination {
      total
      limit
      offset
      hasMore
    }
  }
}
    `;
export const GetEventShiftsDocument = gql`
    query GetEventShifts($eventId: ID!, $limit: Int!, $offset: Int!) {
  eventShifts(eventId: $eventId, limit: $limit, offset: $offset) {
    items {
      id
      title
      rrule
      originalStartsAt
      durationMinutes
      visibility
      maxVolunteers
      minVolunteers
      requiredFormsCount
      createdBy {
        id
        name
        email
      }
    }
    pagination {
      total
      limit
      offset
      hasMore
    }
  }
}
    `;
export const GetShiftInstancesByMasterIdsDocument = gql`
    query GetShiftInstancesByMasterIds($masterIds: [ID!]!) {
  shiftInstancesByMasterIds(masterIds: $masterIds) {
    masterId
    instances {
      id
      masterId
    }
  }
}
    `;
export const CreateShiftDocument = gql`
    mutation CreateShift($input: CreateShiftInput!) {
  createShift(input: $input) {
    id
  }
}
    `;
export const UpdateShiftDocument = gql`
    mutation UpdateShift($id: String!, $input: UpdateShiftInput!) {
  updateShift(id: $id, input: $input) {
    id
  }
}
    `;
export const DeleteShiftDocument = gql`
    mutation DeleteShift($id: String!) {
  deleteShift(id: $id) {
    id
  }
}
    `;
export const SetShiftRequiredFormsDocument = gql`
    mutation SetShiftRequiredForms($shiftId: ID!, $formIds: [String!]!) {
  setShiftRequiredForms(shiftId: $shiftId, formIds: $formIds) {
    ...RequiredFormRefFields
  }
}
    ${RequiredFormRefFieldsFragmentDoc}
${RequiredFormFieldsFragmentDoc}`;
export const SetShiftInstanceRequiredFormsDocument = gql`
    mutation SetShiftInstanceRequiredForms($instanceId: ID!, $formIds: [String!]!) {
  setShiftInstanceRequiredForms(instanceId: $instanceId, formIds: $formIds) {
    ...RequiredFormRefFields
  }
}
    ${RequiredFormRefFieldsFragmentDoc}
${RequiredFormFieldsFragmentDoc}`;
export const UpdateMembersForShiftInstanceDocument = gql`
    mutation UpdateMembersForShiftInstance($instanceId: String!, $memberIds: [String!]!, $inviteToAllInstances: Boolean) {
  updateMembersForShiftInstance(
    instanceId: $instanceId
    memberIds: $memberIds
    inviteToAllInstances: $inviteToAllInstances
  ) {
    id
  }
}
    `;
export const UpdateShiftInstanceDocument = gql`
    mutation UpdateShiftInstance($instanceId: String!, $input: UpdateShiftInstanceInput!, $applyToAllFuture: Boolean) {
  updateShiftInstance(
    instanceId: $instanceId
    input: $input
    applyToAllFuture: $applyToAllFuture
  ) {
    id
  }
}
    `;
export const DeleteShiftInstanceDocument = gql`
    mutation DeleteShiftInstance($id: String!, $applyToAllFuture: Boolean) {
  deleteShiftInstance(id: $id, applyToAllFuture: $applyToAllFuture) {
    id
    isCancelled
  }
}
    `;
export const UpdateShiftInstanceVolunteersDocument = gql`
    mutation UpdateShiftInstanceVolunteers($instanceId: String!, $memberIds: [String!]!) {
  updateMembersForShiftInstance(instanceId: $instanceId, memberIds: $memberIds) {
    id
  }
}
    `;
export const UpdateShiftInstanceInviteStatusDocument = gql`
    mutation UpdateShiftInstanceInviteStatus($instanceId: String!, $status: ShiftInviteStatus!, $userId: String) {
  updateShiftInstanceInviteStatus(
    instanceId: $instanceId
    status: $status
    userId: $userId
  ) {
    status
    userId
  }
}
    `;
export const JoinShiftInstanceDocument = gql`
    mutation JoinShiftInstance($instanceId: String!) {
  joinShiftInstance(instanceId: $instanceId) {
    status
    shiftInstance {
      id
      actualStartsAt
      actualEndsAt
      overrideTitle
      overrideInstructions
      overrideLocation
      overrideMaxVolunteers
      isException
      isCancelled
      occurrenceIndex
      master {
        id
        title
      }
    }
    membershipRequestId
    requirementProfile {
      id
      name
      description
      requirements {
        id
        name
        description
        type
        mandatory
      }
    }
    requirementStatuses {
      requirementId
      name
      status
    }
    requiredForms {
      ...RequiredFormWithStatusFields
    }
  }
}
    ${RequiredFormWithStatusFieldsFragmentDoc}
${RequiredFormFieldsFragmentDoc}`;
export const GetShiftVolunteersDocument = gql`
    query GetShiftVolunteers($instanceId: ID!, $statuses: [ShiftInviteStatus!]) {
  shiftVolunteers(instanceId: $instanceId, statuses: $statuses) {
    id
    name
    email
    image
  }
}
    `;
export const GetActiveShiftInstancesDocument = gql`
    query GetActiveShiftInstances($userId: String!) {
  activeShiftInstances {
    id
    actualStartsAt
    actualEndsAt
    overrideTitle
    invite(userId: $userId) {
      status
    }
    master {
      id
      title
      location
      instructions
      visibility
      maxVolunteers
    }
  }
}
    `;
export const GetShiftInstancesDocument = gql`
    query GetShiftInstances($shiftId: ID!) {
  shiftInstances(shiftId: $shiftId) {
    id
    actualStartsAt
    actualEndsAt
    overrideTitle
    isCancelled
  }
}
    `;
export const GetShiftInstanceDocument = gql`
    query GetShiftInstance($id: ID!) {
  shiftInstance(id: $id) {
    id
    actualStartsAt
    actualEndsAt
    overrideTitle
    overrideLocation
    overrideInstructions
    overrideMaxVolunteers
    overrideMinVolunteers
    overrideReimbursementTypeId
    isCancelled
    filledCount
    spotsLeft
    requiredFormsCount
    requiredForms {
      ...RequiredFormRefFields
    }
    master {
      id
      title
      location
      instructions
      minVolunteers
      maxVolunteers
      reimbursementTypeId
      visibility
      rrule
      createdAt
      imageUrl
      createdBy {
        id
        name
        image
      }
    }
    invites {
      status
      user {
        id
        name
        email
        image
        checkInId
      }
    }
  }
}
    ${RequiredFormRefFieldsFragmentDoc}
${RequiredFormFieldsFragmentDoc}`;
export const GetWeeklyShiftsDocument = gql`
    query GetWeeklyShifts($startsAfter: DateTime!, $endsBefore: DateTime!, $eventId: ID) {
  weeklyShifts(
    startsAfter: $startsAfter
    endsBefore: $endsBefore
    eventId: $eventId
  ) {
    id
    overrideTitle
    actualStartsAt
    actualEndsAt
    isCancelled
    overrideMinVolunteers
    overrideMaxVolunteers
    master {
      id
      title
      minVolunteers
      maxVolunteers
      visibility
      rrule
    }
    volunteers {
      id
      name
    }
    invites {
      status
      user {
        id
        name
        email
        image
      }
    }
  }
}
    `;
export const GetPublicShiftInstancesDocument = gql`
    query GetPublicShiftInstances($shiftId: ID!) {
  publicShiftInstances(shiftId: $shiftId) {
    ...PublicShiftDetailInstanceFields
  }
}
    ${PublicShiftDetailInstanceFieldsFragmentDoc}
${RequiredFormRefFieldsFragmentDoc}
${RequiredFormFieldsFragmentDoc}`;
export const GetPublicShiftInstanceDocument = gql`
    query GetPublicShiftInstance($id: ID!) {
  publicShiftInstance(id: $id) {
    ...PublicShiftDetailInstanceFields
  }
}
    ${PublicShiftDetailInstanceFieldsFragmentDoc}
${RequiredFormRefFieldsFragmentDoc}
${RequiredFormFieldsFragmentDoc}`;
export const GetMyShiftInstancesDocument = gql`
    query GetMyShiftInstances($includePast: Boolean = false, $startsAfter: DateTime, $endsBefore: DateTime, $limit: Int = 15, $offset: Int = 0, $order: SortOrder = ASC, $statuses: [ShiftInviteStatus!], $includeIntended: Boolean = false) {
  myShiftInstances(
    includePast: $includePast
    startsAfter: $startsAfter
    endsBefore: $endsBefore
    limit: $limit
    offset: $offset
    order: $order
    statuses: $statuses
    includeIntended: $includeIntended
  ) {
    items {
      ...VolunteerHomeShiftInstance
    }
    pagination {
      total
      limit
      offset
      hasMore
    }
  }
}
    ${VolunteerHomeShiftInstanceFragmentDoc}`;
export const GetAvailableShiftInstancesDocument = gql`
    query GetAvailableShiftInstances($startsAfter: DateTime, $endsBefore: DateTime, $organizationUnitIds: [ID!], $limit: Int = 15, $offset: Int = 0) {
  availableShiftInstances(
    startsAfter: $startsAfter
    endsBefore: $endsBefore
    organizationUnitIds: $organizationUnitIds
    limit: $limit
    offset: $offset
  ) {
    items {
      ...VolunteerHomeShiftInstance
    }
    pagination {
      total
      limit
      offset
      hasMore
    }
  }
}
    ${VolunteerHomeShiftInstanceFragmentDoc}`;
export const CheckInDocument = gql`
    mutation CheckIn($shiftInstanceId: ID!) {
  checkIn(shiftInstanceId: $shiftInstanceId) {
    id
  }
}
    `;
export const CheckOutDocument = gql`
    mutation CheckOut($shiftInstanceId: ID!) {
  checkOut(shiftInstanceId: $shiftInstanceId) {
    id
  }
}
    `;
export const GetCheckInShiftInstancesDocument = gql`
    query GetCheckInShiftInstances($startsAfter: DateTime!, $endsBefore: DateTime!) {
  checkInShiftInstances(startsAfter: $startsAfter, endsBefore: $endsBefore) {
    id
    actualStartsAt
    actualEndsAt
    overrideTitle
    master {
      id
      title
    }
  }
}
    `;
export const GetCheckInShiftsDocument = gql`
    query GetCheckInShifts($search: String) {
  checkInShifts(search: $search) {
    id
    title
  }
}
    `;
export const CheckInInviteToShiftInstanceDocument = gql`
    mutation CheckInInviteToShiftInstance($shiftInstanceId: ID!, $volunteerId: ID!) {
  checkInInviteToShiftInstance(
    shiftInstanceId: $shiftInstanceId
    volunteerId: $volunteerId
  ) {
    id
  }
}
    `;
export const AddTimeEntryDocument = gql`
    mutation AddTimeEntry($input: AddTimeEntryInput!) {
  addTimeEntry(input: $input) {
    id
  }
}
    `;
export const DeleteTimeEntryDocument = gql`
    mutation DeleteTimeEntry($id: ID!) {
  deleteTimeEntry(id: $id) {
    id
  }
}
    `;
export const CloseTimeEntryDocument = gql`
    mutation CloseTimeEntry($id: ID!, $input: CloseTimeEntryInput!) {
  closeTimeEntry(id: $id, input: $input) {
    id
  }
}
    `;
export const GetTimeEntryDocument = gql`
    query GetTimeEntry($id: String!) {
  timeEntry(id: $id) {
    id
    startedAt
    endedAt
    notes
    createdAt
    volunteer {
      id
      name
      email
    }
    shiftInstance {
      id
      actualStartsAt
      actualEndsAt
      overrideTitle
      master {
        id
        title
      }
    }
    organizationUnit {
      id
      name
      organization {
        id
        name
      }
    }
  }
}
    `;
export const UpdateTimeEntryDocument = gql`
    mutation UpdateTimeEntry($id: ID!, $input: UpdateTimeEntryInput!) {
  updateTimeEntry(id: $id, input: $input) {
    id
  }
}
    `;
export const GetTimeEntriesDocument = gql`
    query GetTimeEntries($limit: Int!, $offset: Int!) {
  timeEntries(limit: $limit, offset: $offset) {
    items {
      id
      startedAt
      endedAt
      volunteer {
        id
        name
        email
      }
      shiftInstance {
        id
        actualStartsAt
        actualEndsAt
        overrideTitle
        master {
          id
          title
        }
      }
      organizationUnit {
        id
        name
        organization {
          id
          name
        }
      }
    }
    pagination {
      total
      limit
      offset
      hasMore
    }
  }
}
    `;
export const GetTimeEntriesByUserDocument = gql`
    query GetTimeEntriesByUser($userId: String!, $limit: Int!, $offset: Int!) {
  timeEntriesByUser(userId: $userId, limit: $limit, offset: $offset) {
    items {
      id
      startedAt
      endedAt
      shiftInstance {
        id
        actualStartsAt
        actualEndsAt
        overrideTitle
        master {
          id
          title
        }
      }
      organizationUnit {
        id
        name
        organization {
          id
          name
        }
      }
    }
    pagination {
      total
      limit
      offset
      hasMore
    }
  }
}
    `;
export const GetMyTimeDocument = gql`
    query GetMyTime($limit: Int!, $offset: Int!) {
  myTime(limit: $limit, offset: $offset) {
    items {
      id
      startedAt
      endedAt
      shiftInstance {
        id
        overrideTitle
        master {
          id
          title
          organizationUnit {
            id
            name
            organization {
              id
              name
            }
          }
        }
      }
      organizationUnit {
        id
        name
        organization {
          id
          name
        }
      }
    }
    pagination {
      total
      limit
      offset
      hasMore
    }
  }
}
    `;
export const GetCheckInContextDocument = gql`
    query GetCheckInContext($checkInId: String!) {
  checkInContext(checkInId: $checkInId) {
    volunteer {
      id
      name
      email
      image
    }
    eligibleOrganizationUnits {
      id
      name
    }
    openTimeEntries {
      id
      startedAt
      shiftInstance {
        id
        overrideTitle
        master {
          id
          title
        }
      }
      organizationUnit {
        id
        name
        organization {
          id
          name
        }
      }
    }
  }
}
    `;
export const GetCheckInReadinessDocument = gql`
    query GetCheckInReadiness($volunteerId: ID!, $shiftInstanceId: ID!) {
  checkInReadiness(volunteerId: $volunteerId, shiftInstanceId: $shiftInstanceId) {
    isMember
    openMembershipRequestId
    shiftInviteStatus
    isParticipating
    hasOpenTimeEntry
  }
}
    `;
export const GetCheckInVolunteerRequiredFormsDocument = gql`
    query GetCheckInVolunteerRequiredForms($volunteerId: ID!) {
  checkInVolunteerRequiredForms(volunteerId: $volunteerId) {
    form {
      id
      name
    }
    order
    submitted
    submissionId
  }
}
    `;
export const CheckInVolunteerDocument = gql`
    mutation CheckInVolunteer($volunteerId: ID!, $shiftInstanceId: ID) {
  checkInVolunteer(volunteerId: $volunteerId, shiftInstanceId: $shiftInstanceId) {
    id
  }
}
    `;
export const CheckInInviteToOrganizationDocument = gql`
    mutation CheckInInviteToOrganization($volunteerId: ID!) {
  checkInInviteToOrganization(volunteerId: $volunteerId)
}
    `;
export const CheckOutVolunteerDocument = gql`
    mutation CheckOutVolunteer($timeEntryId: ID!) {
  checkOutVolunteer(timeEntryId: $timeEntryId) {
    id
  }
}
    `;
export const GetMeDocument = gql`
    query GetMe {
  me {
    id
    name
    email
    image
    checkInId
    locale
  }
}
    `;
export const GetUserDocument = gql`
    query GetUser($id: String!) {
  user(id: $id) {
    id
    name
    email
    image
    checkInId
    locale
  }
}
    `;
export const GetUserByCheckInIdDocument = gql`
    query GetUserByCheckInId($checkInId: String!) {
  userByCheckInId(checkInId: $checkInId) {
    id
    name
    email
    image
    checkInId
    locale
  }
}
    `;
export const GetMyPermissionsDocument = gql`
    query GetMyPermissions {
  me {
    id
    permissions {
      id
      key
    }
  }
}
    `;
export const GetMyOrganizationsDocument = gql`
    query GetMyOrganizations($limit: Int!, $offset: Int!) {
  organizations(limit: $limit, offset: $offset) {
    items {
      id
      name
      slug
      description
      logoUrl
    }
    pagination {
      total
      limit
      offset
      hasMore
    }
  }
}
    `;
export const UpdateMyLocaleDocument = gql`
    mutation UpdateMyLocale($locale: String!) {
  updateMyLocale(locale: $locale) {
    id
    locale
  }
}
    `;
export const UpdateMyImageDocument = gql`
    mutation UpdateMyImage($input: UpdateMyImageInput!) {
  updateMyImage(input: $input) {
    id
    image
  }
}
    `;

export type SdkFunctionWrapper = <T>(action: (requestHeaders?:Record<string, string>) => Promise<T>, operationName: string, operationType?: string, variables?: any) => Promise<T>;


const defaultWrapper: SdkFunctionWrapper = (action, _operationName, _operationType, _variables) => action();

export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
  return {
    GetReimbursementTypes(variables?: GetReimbursementTypesQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetReimbursementTypesQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetReimbursementTypesQuery>({ document: GetReimbursementTypesDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetReimbursementTypes', 'query', variables);
    },
    GetEffectiveRates(variables?: GetEffectiveRatesQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetEffectiveRatesQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetEffectiveRatesQuery>({ document: GetEffectiveRatesDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetEffectiveRates', 'query', variables);
    },
    SetReimbursementRate(variables: SetReimbursementRateMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<SetReimbursementRateMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<SetReimbursementRateMutation>({ document: SetReimbursementRateDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'SetReimbursementRate', 'mutation', variables);
    },
    GetYearlyUsage(variables: GetYearlyUsageQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetYearlyUsageQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetYearlyUsageQuery>({ document: GetYearlyUsageDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetYearlyUsage', 'query', variables);
    },
    GetRosterYearlyUsage(variables: GetRosterYearlyUsageQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetRosterYearlyUsageQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetRosterYearlyUsageQuery>({ document: GetRosterYearlyUsageDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetRosterYearlyUsage', 'query', variables);
    },
    GetContracts(variables?: GetContractsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetContractsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetContractsQuery>({ document: GetContractsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetContracts', 'query', variables);
    },
    GetMyContracts(variables?: GetMyContractsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetMyContractsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetMyContractsQuery>({ document: GetMyContractsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetMyContracts', 'query', variables);
    },
    GetContract(variables: GetContractQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetContractQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetContractQuery>({ document: GetContractDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetContract', 'query', variables);
    },
    GetPendingContractSignee(variables: GetPendingContractSigneeQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetPendingContractSigneeQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetPendingContractSigneeQuery>({ document: GetPendingContractSigneeDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetPendingContractSignee', 'query', variables);
    },
    CreateContract(variables: CreateContractMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<CreateContractMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateContractMutation>({ document: CreateContractDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'CreateContract', 'mutation', variables);
    },
    SignContract(variables: SignContractMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<SignContractMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<SignContractMutation>({ document: SignContractDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'SignContract', 'mutation', variables);
    },
    DeclineContract(variables: DeclineContractMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<DeclineContractMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<DeclineContractMutation>({ document: DeclineContractDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'DeclineContract', 'mutation', variables);
    },
    GetInvoices(variables?: GetInvoicesQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetInvoicesQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetInvoicesQuery>({ document: GetInvoicesDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetInvoices', 'query', variables);
    },
    GetMyInvoices(variables?: GetMyInvoicesQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetMyInvoicesQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetMyInvoicesQuery>({ document: GetMyInvoicesDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetMyInvoices', 'query', variables);
    },
    GetInvoice(variables: GetInvoiceQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetInvoiceQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetInvoiceQuery>({ document: GetInvoiceDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetInvoice', 'query', variables);
    },
    GetPendingInvoiceSignee(variables: GetPendingInvoiceSigneeQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetPendingInvoiceSigneeQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetPendingInvoiceSigneeQuery>({ document: GetPendingInvoiceSigneeDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetPendingInvoiceSignee', 'query', variables);
    },
    GetVolunteersNeedingTimesheets(variables?: GetVolunteersNeedingTimesheetsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetVolunteersNeedingTimesheetsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetVolunteersNeedingTimesheetsQuery>({ document: GetVolunteersNeedingTimesheetsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetVolunteersNeedingTimesheets', 'query', variables);
    },
    GetEligibleTimeEntriesForInvoice(variables: GetEligibleTimeEntriesForInvoiceQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetEligibleTimeEntriesForInvoiceQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetEligibleTimeEntriesForInvoiceQuery>({ document: GetEligibleTimeEntriesForInvoiceDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetEligibleTimeEntriesForInvoice', 'query', variables);
    },
    CreateInvoice(variables: CreateInvoiceMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<CreateInvoiceMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateInvoiceMutation>({ document: CreateInvoiceDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'CreateInvoice', 'mutation', variables);
    },
    SignInvoice(variables: SignInvoiceMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<SignInvoiceMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<SignInvoiceMutation>({ document: SignInvoiceDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'SignInvoice', 'mutation', variables);
    },
    DeclineInvoice(variables: DeclineInvoiceMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<DeclineInvoiceMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<DeclineInvoiceMutation>({ document: DeclineInvoiceDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'DeclineInvoice', 'mutation', variables);
    },
    GetDocumentTemplates(variables?: GetDocumentTemplatesQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetDocumentTemplatesQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetDocumentTemplatesQuery>({ document: GetDocumentTemplatesDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetDocumentTemplates', 'query', variables);
    },
    GetDocumentTemplate(variables: GetDocumentTemplateQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetDocumentTemplateQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetDocumentTemplateQuery>({ document: GetDocumentTemplateDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetDocumentTemplate', 'query', variables);
    },
    GetActiveDocumentTemplate(variables: GetActiveDocumentTemplateQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetActiveDocumentTemplateQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetActiveDocumentTemplateQuery>({ document: GetActiveDocumentTemplateDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetActiveDocumentTemplate', 'query', variables);
    },
    CreateDocumentTemplate(variables: CreateDocumentTemplateMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<CreateDocumentTemplateMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateDocumentTemplateMutation>({ document: CreateDocumentTemplateDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'CreateDocumentTemplate', 'mutation', variables);
    },
    UpdateDocumentTemplate(variables: UpdateDocumentTemplateMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<UpdateDocumentTemplateMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateDocumentTemplateMutation>({ document: UpdateDocumentTemplateDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'UpdateDocumentTemplate', 'mutation', variables);
    },
    DeleteDocumentTemplate(variables: DeleteDocumentTemplateMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<DeleteDocumentTemplateMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<DeleteDocumentTemplateMutation>({ document: DeleteDocumentTemplateDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'DeleteDocumentTemplate', 'mutation', variables);
    },
    GetBundleDownloadStatus(variables: GetBundleDownloadStatusQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetBundleDownloadStatusQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetBundleDownloadStatusQuery>({ document: GetBundleDownloadStatusDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetBundleDownloadStatus', 'query', variables);
    },
    RecordBundleDownload(variables: RecordBundleDownloadMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<RecordBundleDownloadMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<RecordBundleDownloadMutation>({ document: RecordBundleDownloadDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'RecordBundleDownload', 'mutation', variables);
    },
    GetManualBaseline(variables: GetManualBaselineQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetManualBaselineQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetManualBaselineQuery>({ document: GetManualBaselineDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetManualBaseline', 'query', variables);
    },
    SetManualBaseline(variables: SetManualBaselineMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<SetManualBaselineMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<SetManualBaselineMutation>({ document: SetManualBaselineDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'SetManualBaseline', 'mutation', variables);
    },
    MyDocuments(variables?: MyDocumentsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<MyDocumentsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<MyDocumentsQuery>({ document: MyDocumentsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'MyDocuments', 'query', variables);
    },
    MyDocumentSummary(variables?: MyDocumentSummaryQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<MyDocumentSummaryQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<MyDocumentSummaryQuery>({ document: MyDocumentSummaryDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'MyDocumentSummary', 'query', variables);
    },
    GetEvents(variables: GetEventsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetEventsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetEventsQuery>({ document: GetEventsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetEvents', 'query', variables);
    },
    GetMyEvents(variables?: GetMyEventsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetMyEventsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetMyEventsQuery>({ document: GetMyEventsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetMyEvents', 'query', variables);
    },
    GetAvailableEvents(variables?: GetAvailableEventsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetAvailableEventsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetAvailableEventsQuery>({ document: GetAvailableEventsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetAvailableEvents', 'query', variables);
    },
    GetEvent(variables: GetEventQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetEventQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetEventQuery>({ document: GetEventDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetEvent', 'query', variables);
    },
    GetEventInvites(variables: GetEventInvitesQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetEventInvitesQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetEventInvitesQuery>({ document: GetEventInvitesDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetEventInvites', 'query', variables);
    },
    CreateEvent(variables: CreateEventMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<CreateEventMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateEventMutation>({ document: CreateEventDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'CreateEvent', 'mutation', variables);
    },
    UpdateEvent(variables: UpdateEventMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<UpdateEventMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateEventMutation>({ document: UpdateEventDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'UpdateEvent', 'mutation', variables);
    },
    DeleteEvent(variables: DeleteEventMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<DeleteEventMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<DeleteEventMutation>({ document: DeleteEventDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'DeleteEvent', 'mutation', variables);
    },
    InviteMembersToEvent(variables: InviteMembersToEventMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<InviteMembersToEventMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<InviteMembersToEventMutation>({ document: InviteMembersToEventDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'InviteMembersToEvent', 'mutation', variables);
    },
    UpdateEventInviteStatus(variables: UpdateEventInviteStatusMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<UpdateEventInviteStatusMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateEventInviteStatusMutation>({ document: UpdateEventInviteStatusDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'UpdateEventInviteStatus', 'mutation', variables);
    },
    GetPublicEvent(variables: GetPublicEventQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetPublicEventQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetPublicEventQuery>({ document: GetPublicEventDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetPublicEvent', 'query', variables);
    },
    JoinEvent(variables: JoinEventMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<JoinEventMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<JoinEventMutation>({ document: JoinEventDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'JoinEvent', 'mutation', variables);
    },
    SetEventRequiredForms(variables: SetEventRequiredFormsMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<SetEventRequiredFormsMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<SetEventRequiredFormsMutation>({ document: SetEventRequiredFormsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'SetEventRequiredForms', 'mutation', variables);
    },
    GetOrganizationUnitMemberships(variables?: GetOrganizationUnitMembershipsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetOrganizationUnitMembershipsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetOrganizationUnitMembershipsQuery>({ document: GetOrganizationUnitMembershipsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetOrganizationUnitMemberships', 'query', variables);
    },
    GetMyMembershipStatus(variables: GetMyMembershipStatusQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetMyMembershipStatusQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetMyMembershipStatusQuery>({ document: GetMyMembershipStatusDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetMyMembershipStatus', 'query', variables);
    },
    UpdateMembershipRoles(variables: UpdateMembershipRolesMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<UpdateMembershipRolesMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateMembershipRolesMutation>({ document: UpdateMembershipRolesDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'UpdateMembershipRoles', 'mutation', variables);
    },
    LeaveMembership(variables: LeaveMembershipMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<LeaveMembershipMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<LeaveMembershipMutation>({ document: LeaveMembershipDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'LeaveMembership', 'mutation', variables);
    },
    RemoveMembership(variables: RemoveMembershipMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<RemoveMembershipMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<RemoveMembershipMutation>({ document: RemoveMembershipDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'RemoveMembership', 'mutation', variables);
    },
    MyMemberships(variables?: MyMembershipsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<MyMembershipsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<MyMembershipsQuery>({ document: MyMembershipsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'MyMemberships', 'query', variables);
    },
    MyMembership(variables: MyMembershipQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<MyMembershipQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<MyMembershipQuery>({ document: MyMembershipDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'MyMembership', 'query', variables);
    },
    JoinOrganization(variables: JoinOrganizationMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<JoinOrganizationMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<JoinOrganizationMutation>({ document: JoinOrganizationDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'JoinOrganization', 'mutation', variables);
    },
    ApproveMembershipRequest(variables: ApproveMembershipRequestMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<ApproveMembershipRequestMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<ApproveMembershipRequestMutation>({ document: ApproveMembershipRequestDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'ApproveMembershipRequest', 'mutation', variables);
    },
    RejectMembershipRequest(variables: RejectMembershipRequestMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<RejectMembershipRequestMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<RejectMembershipRequestMutation>({ document: RejectMembershipRequestDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'RejectMembershipRequest', 'mutation', variables);
    },
    CancelMembershipRequest(variables: CancelMembershipRequestMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<CancelMembershipRequestMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CancelMembershipRequestMutation>({ document: CancelMembershipRequestDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'CancelMembershipRequest', 'mutation', variables);
    },
    RemoveMembershipRequest(variables: RemoveMembershipRequestMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<RemoveMembershipRequestMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<RemoveMembershipRequestMutation>({ document: RemoveMembershipRequestDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'RemoveMembershipRequest', 'mutation', variables);
    },
    GetMembershipRequests(variables: GetMembershipRequestsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetMembershipRequestsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetMembershipRequestsQuery>({ document: GetMembershipRequestsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetMembershipRequests', 'query', variables);
    },
    GetMembershipRequestCount(variables?: GetMembershipRequestCountQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetMembershipRequestCountQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetMembershipRequestCountQuery>({ document: GetMembershipRequestCountDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetMembershipRequestCount', 'query', variables);
    },
    GetMyMembershipRequests(variables: GetMyMembershipRequestsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetMyMembershipRequestsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetMyMembershipRequestsQuery>({ document: GetMyMembershipRequestsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetMyMembershipRequests', 'query', variables);
    },
    CheckInApproveMembershipRequest(variables: CheckInApproveMembershipRequestMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<CheckInApproveMembershipRequestMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CheckInApproveMembershipRequestMutation>({ document: CheckInApproveMembershipRequestDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'CheckInApproveMembershipRequest', 'mutation', variables);
    },
    GetOrganization(variables: GetOrganizationQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetOrganizationQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetOrganizationQuery>({ document: GetOrganizationDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetOrganization', 'query', variables);
    },
    GetOrganizationBySlug(variables: GetOrganizationBySlugQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetOrganizationBySlugQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetOrganizationBySlugQuery>({ document: GetOrganizationBySlugDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetOrganizationBySlug', 'query', variables);
    },
    GetOrganizationRoot(variables: GetOrganizationRootQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetOrganizationRootQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetOrganizationRootQuery>({ document: GetOrganizationRootDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetOrganizationRoot', 'query', variables);
    },
    GetOrganizationUnit(variables: GetOrganizationUnitQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetOrganizationUnitQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetOrganizationUnitQuery>({ document: GetOrganizationUnitDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetOrganizationUnit', 'query', variables);
    },
    GetOrganizationVolunteersByUnit(variables: GetOrganizationVolunteersByUnitQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetOrganizationVolunteersByUnitQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetOrganizationVolunteersByUnitQuery>({ document: GetOrganizationVolunteersByUnitDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetOrganizationVolunteersByUnit', 'query', variables);
    },
    GetOrganizationUnitWithOrg(variables: GetOrganizationUnitWithOrgQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetOrganizationUnitWithOrgQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetOrganizationUnitWithOrgQuery>({ document: GetOrganizationUnitWithOrgDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetOrganizationUnitWithOrg', 'query', variables);
    },
    GetOrganizationUnitPublicInfo(variables: GetOrganizationUnitPublicInfoQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetOrganizationUnitPublicInfoQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetOrganizationUnitPublicInfoQuery>({ document: GetOrganizationUnitPublicInfoDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetOrganizationUnitPublicInfo', 'query', variables);
    },
    GetOrganizationsWithRoot(variables: GetOrganizationsWithRootQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetOrganizationsWithRootQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetOrganizationsWithRootQuery>({ document: GetOrganizationsWithRootDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetOrganizationsWithRoot', 'query', variables);
    },
    GetMyOrganizationUnits(variables?: GetMyOrganizationUnitsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetMyOrganizationUnitsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetMyOrganizationUnitsQuery>({ document: GetMyOrganizationUnitsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetMyOrganizationUnits', 'query', variables);
    },
    GetMyAdminstableOrganizationUnits(variables?: GetMyAdminstableOrganizationUnitsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetMyAdminstableOrganizationUnitsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetMyAdminstableOrganizationUnitsQuery>({ document: GetMyAdminstableOrganizationUnitsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetMyAdminstableOrganizationUnits', 'query', variables);
    },
    GetMyCheckInAdministrableOrganizationUnits(variables?: GetMyCheckInAdministrableOrganizationUnitsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetMyCheckInAdministrableOrganizationUnitsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetMyCheckInAdministrableOrganizationUnitsQuery>({ document: GetMyCheckInAdministrableOrganizationUnitsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetMyCheckInAdministrableOrganizationUnits', 'query', variables);
    },
    GetOrganizations(variables: GetOrganizationsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetOrganizationsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetOrganizationsQuery>({ document: GetOrganizationsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetOrganizations', 'query', variables);
    },
    CreateOrganization(variables: CreateOrganizationMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<CreateOrganizationMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateOrganizationMutation>({ document: CreateOrganizationDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'CreateOrganization', 'mutation', variables);
    },
    UpdateOrganization(variables: UpdateOrganizationMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<UpdateOrganizationMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateOrganizationMutation>({ document: UpdateOrganizationDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'UpdateOrganization', 'mutation', variables);
    },
    GetOrganizationTree(variables?: GetOrganizationTreeQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetOrganizationTreeQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetOrganizationTreeQuery>({ document: GetOrganizationTreeDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetOrganizationTree', 'query', variables);
    },
    GetOrganizationUnitTypes(variables?: GetOrganizationUnitTypesQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetOrganizationUnitTypesQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetOrganizationUnitTypesQuery>({ document: GetOrganizationUnitTypesDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetOrganizationUnitTypes', 'query', variables);
    },
    CreateOrganizationUnit(variables: CreateOrganizationUnitMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<CreateOrganizationUnitMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateOrganizationUnitMutation>({ document: CreateOrganizationUnitDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'CreateOrganizationUnit', 'mutation', variables);
    },
    UpdateOrganizationUnit(variables: UpdateOrganizationUnitMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<UpdateOrganizationUnitMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateOrganizationUnitMutation>({ document: UpdateOrganizationUnitDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'UpdateOrganizationUnit', 'mutation', variables);
    },
    DeleteOrganizationUnit(variables: DeleteOrganizationUnitMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<DeleteOrganizationUnitMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<DeleteOrganizationUnitMutation>({ document: DeleteOrganizationUnitDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'DeleteOrganizationUnit', 'mutation', variables);
    },
    IsMemberOfOrgUnitOrAncestor(variables: IsMemberOfOrgUnitOrAncestorQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<IsMemberOfOrgUnitOrAncestorQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<IsMemberOfOrgUnitOrAncestorQuery>({ document: IsMemberOfOrgUnitOrAncestorDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'IsMemberOfOrgUnitOrAncestor', 'query', variables);
    },
    SetRequiredForms(variables: SetRequiredFormsMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<SetRequiredFormsMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<SetRequiredFormsMutation>({ document: SetRequiredFormsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'SetRequiredForms', 'mutation', variables);
    },
    GetPublicOrganizationUnit(variables: GetPublicOrganizationUnitQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetPublicOrganizationUnitQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetPublicOrganizationUnitQuery>({ document: GetPublicOrganizationUnitDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetPublicOrganizationUnit', 'query', variables);
    },
    GetPublicEventsByOrganizationUnit(variables: GetPublicEventsByOrganizationUnitQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetPublicEventsByOrganizationUnitQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetPublicEventsByOrganizationUnitQuery>({ document: GetPublicEventsByOrganizationUnitDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetPublicEventsByOrganizationUnit', 'query', variables);
    },
    GetPublicShiftsByOrganizationUnit(variables: GetPublicShiftsByOrganizationUnitQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetPublicShiftsByOrganizationUnitQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetPublicShiftsByOrganizationUnitQuery>({ document: GetPublicShiftsByOrganizationUnitDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetPublicShiftsByOrganizationUnit', 'query', variables);
    },
    GetFormBlock(variables: GetFormBlockQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetFormBlockQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetFormBlockQuery>({ document: GetFormBlockDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetFormBlock', 'query', variables);
    },
    GetFormBlocks(variables: GetFormBlocksQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetFormBlocksQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetFormBlocksQuery>({ document: GetFormBlocksDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetFormBlocks', 'query', variables);
    },
    CreateFormBlock(variables: CreateFormBlockMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<CreateFormBlockMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateFormBlockMutation>({ document: CreateFormBlockDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'CreateFormBlock', 'mutation', variables);
    },
    UpdateFormBlock(variables: UpdateFormBlockMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<UpdateFormBlockMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateFormBlockMutation>({ document: UpdateFormBlockDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'UpdateFormBlock', 'mutation', variables);
    },
    DeleteFormBlock(variables: DeleteFormBlockMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<DeleteFormBlockMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<DeleteFormBlockMutation>({ document: DeleteFormBlockDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'DeleteFormBlock', 'mutation', variables);
    },
    CreateFormBlockField(variables: CreateFormBlockFieldMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<CreateFormBlockFieldMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateFormBlockFieldMutation>({ document: CreateFormBlockFieldDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'CreateFormBlockField', 'mutation', variables);
    },
    UpdateFormBlockField(variables: UpdateFormBlockFieldMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<UpdateFormBlockFieldMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateFormBlockFieldMutation>({ document: UpdateFormBlockFieldDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'UpdateFormBlockField', 'mutation', variables);
    },
    DeleteFormBlockField(variables: DeleteFormBlockFieldMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<DeleteFormBlockFieldMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<DeleteFormBlockFieldMutation>({ document: DeleteFormBlockFieldDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'DeleteFormBlockField', 'mutation', variables);
    },
    GetRequirementForm(variables: GetRequirementFormQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetRequirementFormQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetRequirementFormQuery>({ document: GetRequirementFormDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetRequirementForm', 'query', variables);
    },
    GetRequirementFormByShareToken(variables: GetRequirementFormByShareTokenQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetRequirementFormByShareTokenQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetRequirementFormByShareTokenQuery>({ document: GetRequirementFormByShareTokenDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetRequirementFormByShareToken', 'query', variables);
    },
    GetRequirementForms(variables: GetRequirementFormsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetRequirementFormsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetRequirementFormsQuery>({ document: GetRequirementFormsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetRequirementForms', 'query', variables);
    },
    CreateRequirementForm(variables: CreateRequirementFormMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<CreateRequirementFormMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateRequirementFormMutation>({ document: CreateRequirementFormDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'CreateRequirementForm', 'mutation', variables);
    },
    UpdateRequirementForm(variables: UpdateRequirementFormMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<UpdateRequirementFormMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateRequirementFormMutation>({ document: UpdateRequirementFormDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'UpdateRequirementForm', 'mutation', variables);
    },
    DeleteRequirementForm(variables: DeleteRequirementFormMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<DeleteRequirementFormMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<DeleteRequirementFormMutation>({ document: DeleteRequirementFormDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'DeleteRequirementForm', 'mutation', variables);
    },
    RegenerateFormShareToken(variables: RegenerateFormShareTokenMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<RegenerateFormShareTokenMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<RegenerateFormShareTokenMutation>({ document: RegenerateFormShareTokenDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'RegenerateFormShareToken', 'mutation', variables);
    },
    SubmitForm(variables: SubmitFormMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<SubmitFormMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<SubmitFormMutation>({ document: SubmitFormDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'SubmitForm', 'mutation', variables);
    },
    SubmitRequiredForm(variables: SubmitRequiredFormMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<SubmitRequiredFormMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<SubmitRequiredFormMutation>({ document: SubmitRequiredFormDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'SubmitRequiredForm', 'mutation', variables);
    },
    GetMyFormSubmissionByToken(variables: GetMyFormSubmissionByTokenQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetMyFormSubmissionByTokenQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetMyFormSubmissionByTokenQuery>({ document: GetMyFormSubmissionByTokenDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetMyFormSubmissionByToken', 'query', variables);
    },
    GetMyFormSubmissions(variables: GetMyFormSubmissionsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetMyFormSubmissionsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetMyFormSubmissionsQuery>({ document: GetMyFormSubmissionsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetMyFormSubmissions', 'query', variables);
    },
    GetMyUserProfile(variables?: GetMyUserProfileQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetMyUserProfileQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetMyUserProfileQuery>({ document: GetMyUserProfileDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetMyUserProfile', 'query', variables);
    },
    UpdateMyUserProfile(variables: UpdateMyUserProfileMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<UpdateMyUserProfileMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateMyUserProfileMutation>({ document: UpdateMyUserProfileDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'UpdateMyUserProfile', 'mutation', variables);
    },
    GetFormSubmissionsByMembershipRequest(variables: GetFormSubmissionsByMembershipRequestQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetFormSubmissionsByMembershipRequestQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetFormSubmissionsByMembershipRequestQuery>({ document: GetFormSubmissionsByMembershipRequestDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetFormSubmissionsByMembershipRequest', 'query', variables);
    },
    GetFormSubmissionsForVolunteer(variables: GetFormSubmissionsForVolunteerQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetFormSubmissionsForVolunteerQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetFormSubmissionsForVolunteerQuery>({ document: GetFormSubmissionsForVolunteerDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetFormSubmissionsForVolunteer', 'query', variables);
    },
    GetAdminFormSubmission(variables: GetAdminFormSubmissionQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetAdminFormSubmissionQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetAdminFormSubmissionQuery>({ document: GetAdminFormSubmissionDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetAdminFormSubmission', 'query', variables);
    },
    GetFormSubmissionsByForm(variables: GetFormSubmissionsByFormQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetFormSubmissionsByFormQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetFormSubmissionsByFormQuery>({ document: GetFormSubmissionsByFormDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetFormSubmissionsByForm', 'query', variables);
    },
    MyRequiredOrgUnitForms(variables: MyRequiredOrgUnitFormsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<MyRequiredOrgUnitFormsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<MyRequiredOrgUnitFormsQuery>({ document: MyRequiredOrgUnitFormsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'MyRequiredOrgUnitForms', 'query', variables);
    },
    MyFormSubmission(variables: MyFormSubmissionQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<MyFormSubmissionQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<MyFormSubmissionQuery>({ document: MyFormSubmissionDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'MyFormSubmission', 'query', variables);
    },
    GetAdminUserProfile(variables: GetAdminUserProfileQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetAdminUserProfileQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetAdminUserProfileQuery>({ document: GetAdminUserProfileDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetAdminUserProfile', 'query', variables);
    },
    CreateRequirementProfileSubmission(variables: CreateRequirementProfileSubmissionMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<CreateRequirementProfileSubmissionMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateRequirementProfileSubmissionMutation>({ document: CreateRequirementProfileSubmissionDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'CreateRequirementProfileSubmission', 'mutation', variables);
    },
    GetRole(variables: GetRoleQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetRoleQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetRoleQuery>({ document: GetRoleDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetRole', 'query', variables);
    },
    GetRoles(variables?: GetRolesQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetRolesQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetRolesQuery>({ document: GetRolesDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetRoles', 'query', variables);
    },
    GetPermissions(variables?: GetPermissionsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetPermissionsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetPermissionsQuery>({ document: GetPermissionsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetPermissions', 'query', variables);
    },
    GetPermissionGroups(variables?: GetPermissionGroupsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetPermissionGroupsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetPermissionGroupsQuery>({ document: GetPermissionGroupsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetPermissionGroups', 'query', variables);
    },
    createRole(variables: CreateRoleMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<CreateRoleMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateRoleMutation>({ document: CreateRoleDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'createRole', 'mutation', variables);
    },
    UpdateRole(variables: UpdateRoleMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<UpdateRoleMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateRoleMutation>({ document: UpdateRoleDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'UpdateRole', 'mutation', variables);
    },
    DeleteRole(variables: DeleteRoleMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<DeleteRoleMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<DeleteRoleMutation>({ document: DeleteRoleDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'DeleteRole', 'mutation', variables);
    },
    GetShift(variables: GetShiftQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetShiftQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetShiftQuery>({ document: GetShiftDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetShift', 'query', variables);
    },
    GetShifts(variables: GetShiftsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetShiftsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetShiftsQuery>({ document: GetShiftsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetShifts', 'query', variables);
    },
    GetEventShifts(variables: GetEventShiftsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetEventShiftsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetEventShiftsQuery>({ document: GetEventShiftsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetEventShifts', 'query', variables);
    },
    GetShiftInstancesByMasterIds(variables: GetShiftInstancesByMasterIdsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetShiftInstancesByMasterIdsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetShiftInstancesByMasterIdsQuery>({ document: GetShiftInstancesByMasterIdsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetShiftInstancesByMasterIds', 'query', variables);
    },
    CreateShift(variables: CreateShiftMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<CreateShiftMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateShiftMutation>({ document: CreateShiftDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'CreateShift', 'mutation', variables);
    },
    UpdateShift(variables: UpdateShiftMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<UpdateShiftMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateShiftMutation>({ document: UpdateShiftDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'UpdateShift', 'mutation', variables);
    },
    DeleteShift(variables: DeleteShiftMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<DeleteShiftMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<DeleteShiftMutation>({ document: DeleteShiftDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'DeleteShift', 'mutation', variables);
    },
    SetShiftRequiredForms(variables: SetShiftRequiredFormsMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<SetShiftRequiredFormsMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<SetShiftRequiredFormsMutation>({ document: SetShiftRequiredFormsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'SetShiftRequiredForms', 'mutation', variables);
    },
    SetShiftInstanceRequiredForms(variables: SetShiftInstanceRequiredFormsMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<SetShiftInstanceRequiredFormsMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<SetShiftInstanceRequiredFormsMutation>({ document: SetShiftInstanceRequiredFormsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'SetShiftInstanceRequiredForms', 'mutation', variables);
    },
    UpdateMembersForShiftInstance(variables: UpdateMembersForShiftInstanceMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<UpdateMembersForShiftInstanceMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateMembersForShiftInstanceMutation>({ document: UpdateMembersForShiftInstanceDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'UpdateMembersForShiftInstance', 'mutation', variables);
    },
    UpdateShiftInstance(variables: UpdateShiftInstanceMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<UpdateShiftInstanceMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateShiftInstanceMutation>({ document: UpdateShiftInstanceDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'UpdateShiftInstance', 'mutation', variables);
    },
    DeleteShiftInstance(variables: DeleteShiftInstanceMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<DeleteShiftInstanceMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<DeleteShiftInstanceMutation>({ document: DeleteShiftInstanceDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'DeleteShiftInstance', 'mutation', variables);
    },
    UpdateShiftInstanceVolunteers(variables: UpdateShiftInstanceVolunteersMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<UpdateShiftInstanceVolunteersMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateShiftInstanceVolunteersMutation>({ document: UpdateShiftInstanceVolunteersDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'UpdateShiftInstanceVolunteers', 'mutation', variables);
    },
    UpdateShiftInstanceInviteStatus(variables: UpdateShiftInstanceInviteStatusMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<UpdateShiftInstanceInviteStatusMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateShiftInstanceInviteStatusMutation>({ document: UpdateShiftInstanceInviteStatusDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'UpdateShiftInstanceInviteStatus', 'mutation', variables);
    },
    JoinShiftInstance(variables: JoinShiftInstanceMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<JoinShiftInstanceMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<JoinShiftInstanceMutation>({ document: JoinShiftInstanceDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'JoinShiftInstance', 'mutation', variables);
    },
    GetShiftVolunteers(variables: GetShiftVolunteersQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetShiftVolunteersQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetShiftVolunteersQuery>({ document: GetShiftVolunteersDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetShiftVolunteers', 'query', variables);
    },
    GetActiveShiftInstances(variables: GetActiveShiftInstancesQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetActiveShiftInstancesQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetActiveShiftInstancesQuery>({ document: GetActiveShiftInstancesDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetActiveShiftInstances', 'query', variables);
    },
    GetShiftInstances(variables: GetShiftInstancesQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetShiftInstancesQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetShiftInstancesQuery>({ document: GetShiftInstancesDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetShiftInstances', 'query', variables);
    },
    GetShiftInstance(variables: GetShiftInstanceQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetShiftInstanceQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetShiftInstanceQuery>({ document: GetShiftInstanceDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetShiftInstance', 'query', variables);
    },
    GetWeeklyShifts(variables: GetWeeklyShiftsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetWeeklyShiftsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetWeeklyShiftsQuery>({ document: GetWeeklyShiftsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetWeeklyShifts', 'query', variables);
    },
    GetPublicShiftInstances(variables: GetPublicShiftInstancesQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetPublicShiftInstancesQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetPublicShiftInstancesQuery>({ document: GetPublicShiftInstancesDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetPublicShiftInstances', 'query', variables);
    },
    GetPublicShiftInstance(variables: GetPublicShiftInstanceQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetPublicShiftInstanceQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetPublicShiftInstanceQuery>({ document: GetPublicShiftInstanceDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetPublicShiftInstance', 'query', variables);
    },
    GetMyShiftInstances(variables?: GetMyShiftInstancesQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetMyShiftInstancesQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetMyShiftInstancesQuery>({ document: GetMyShiftInstancesDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetMyShiftInstances', 'query', variables);
    },
    GetAvailableShiftInstances(variables?: GetAvailableShiftInstancesQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetAvailableShiftInstancesQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetAvailableShiftInstancesQuery>({ document: GetAvailableShiftInstancesDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetAvailableShiftInstances', 'query', variables);
    },
    CheckIn(variables: CheckInMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<CheckInMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CheckInMutation>({ document: CheckInDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'CheckIn', 'mutation', variables);
    },
    CheckOut(variables: CheckOutMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<CheckOutMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CheckOutMutation>({ document: CheckOutDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'CheckOut', 'mutation', variables);
    },
    GetCheckInShiftInstances(variables: GetCheckInShiftInstancesQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetCheckInShiftInstancesQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetCheckInShiftInstancesQuery>({ document: GetCheckInShiftInstancesDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetCheckInShiftInstances', 'query', variables);
    },
    GetCheckInShifts(variables?: GetCheckInShiftsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetCheckInShiftsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetCheckInShiftsQuery>({ document: GetCheckInShiftsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetCheckInShifts', 'query', variables);
    },
    CheckInInviteToShiftInstance(variables: CheckInInviteToShiftInstanceMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<CheckInInviteToShiftInstanceMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CheckInInviteToShiftInstanceMutation>({ document: CheckInInviteToShiftInstanceDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'CheckInInviteToShiftInstance', 'mutation', variables);
    },
    AddTimeEntry(variables: AddTimeEntryMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<AddTimeEntryMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<AddTimeEntryMutation>({ document: AddTimeEntryDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'AddTimeEntry', 'mutation', variables);
    },
    DeleteTimeEntry(variables: DeleteTimeEntryMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<DeleteTimeEntryMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<DeleteTimeEntryMutation>({ document: DeleteTimeEntryDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'DeleteTimeEntry', 'mutation', variables);
    },
    CloseTimeEntry(variables: CloseTimeEntryMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<CloseTimeEntryMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CloseTimeEntryMutation>({ document: CloseTimeEntryDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'CloseTimeEntry', 'mutation', variables);
    },
    GetTimeEntry(variables: GetTimeEntryQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetTimeEntryQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetTimeEntryQuery>({ document: GetTimeEntryDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetTimeEntry', 'query', variables);
    },
    UpdateTimeEntry(variables: UpdateTimeEntryMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<UpdateTimeEntryMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateTimeEntryMutation>({ document: UpdateTimeEntryDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'UpdateTimeEntry', 'mutation', variables);
    },
    GetTimeEntries(variables: GetTimeEntriesQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetTimeEntriesQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetTimeEntriesQuery>({ document: GetTimeEntriesDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetTimeEntries', 'query', variables);
    },
    GetTimeEntriesByUser(variables: GetTimeEntriesByUserQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetTimeEntriesByUserQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetTimeEntriesByUserQuery>({ document: GetTimeEntriesByUserDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetTimeEntriesByUser', 'query', variables);
    },
    GetMyTime(variables: GetMyTimeQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetMyTimeQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetMyTimeQuery>({ document: GetMyTimeDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetMyTime', 'query', variables);
    },
    GetCheckInContext(variables: GetCheckInContextQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetCheckInContextQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetCheckInContextQuery>({ document: GetCheckInContextDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetCheckInContext', 'query', variables);
    },
    GetCheckInReadiness(variables: GetCheckInReadinessQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetCheckInReadinessQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetCheckInReadinessQuery>({ document: GetCheckInReadinessDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetCheckInReadiness', 'query', variables);
    },
    GetCheckInVolunteerRequiredForms(variables: GetCheckInVolunteerRequiredFormsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetCheckInVolunteerRequiredFormsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetCheckInVolunteerRequiredFormsQuery>({ document: GetCheckInVolunteerRequiredFormsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetCheckInVolunteerRequiredForms', 'query', variables);
    },
    CheckInVolunteer(variables: CheckInVolunteerMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<CheckInVolunteerMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CheckInVolunteerMutation>({ document: CheckInVolunteerDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'CheckInVolunteer', 'mutation', variables);
    },
    CheckInInviteToOrganization(variables: CheckInInviteToOrganizationMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<CheckInInviteToOrganizationMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CheckInInviteToOrganizationMutation>({ document: CheckInInviteToOrganizationDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'CheckInInviteToOrganization', 'mutation', variables);
    },
    CheckOutVolunteer(variables: CheckOutVolunteerMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<CheckOutVolunteerMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CheckOutVolunteerMutation>({ document: CheckOutVolunteerDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'CheckOutVolunteer', 'mutation', variables);
    },
    GetMe(variables?: GetMeQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetMeQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetMeQuery>({ document: GetMeDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetMe', 'query', variables);
    },
    GetUser(variables: GetUserQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetUserQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetUserQuery>({ document: GetUserDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetUser', 'query', variables);
    },
    GetUserByCheckInId(variables: GetUserByCheckInIdQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetUserByCheckInIdQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetUserByCheckInIdQuery>({ document: GetUserByCheckInIdDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetUserByCheckInId', 'query', variables);
    },
    GetMyPermissions(variables?: GetMyPermissionsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetMyPermissionsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetMyPermissionsQuery>({ document: GetMyPermissionsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetMyPermissions', 'query', variables);
    },
    GetMyOrganizations(variables: GetMyOrganizationsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetMyOrganizationsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetMyOrganizationsQuery>({ document: GetMyOrganizationsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetMyOrganizations', 'query', variables);
    },
    UpdateMyLocale(variables: UpdateMyLocaleMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<UpdateMyLocaleMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateMyLocaleMutation>({ document: UpdateMyLocaleDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'UpdateMyLocale', 'mutation', variables);
    },
    UpdateMyImage(variables: UpdateMyImageMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<UpdateMyImageMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateMyImageMutation>({ document: UpdateMyImageDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'UpdateMyImage', 'mutation', variables);
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;
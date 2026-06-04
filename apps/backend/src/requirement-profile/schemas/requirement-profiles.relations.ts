import { defineRelationsPart } from 'drizzle-orm';
import * as schema from '../../database/schema';

export const requirementProfilesRelations = defineRelationsPart(
  schema,
  (r) => ({
    requirementProfiles: {
      organization: r.one.organizations({
        from: r.requirementProfiles.organizationId,
        to: r.organizations.id,
      }),
      requirements: r.many.requirementProfileRequirements({
        from: r.requirementProfiles.id,
        to: r.requirementProfileRequirements.profileId,
      }),
      requiredByOrgUnits: r.many.organizationUnits({
        from: r.requirementProfiles.id,
        to: r.organizationUnits.requiredMembershipRequirementProfileId,
      }),
    },
    requirements: {
      organization: r.one.organizations({
        from: r.requirements.organizationId,
        to: r.organizations.id,
      }),
      profiles: r.many.requirementProfileRequirements({
        from: r.requirements.id,
        to: r.requirementProfileRequirements.requirementId,
      }),
    },
    requirementProfileRequirements: {
      requirementProfile: r.one.requirementProfiles({
        from: r.requirementProfileRequirements.profileId,
        to: r.requirementProfiles.id,
      }),
      requirement: r.one.requirements({
        from: r.requirementProfileRequirements.requirementId,
        to: r.requirements.id,
      }),
    },
    requirementProfileSubmissions: {
      requirementProfile: r.one.requirementProfiles({
        from: r.requirementProfileSubmissions.profileId,
        to: r.requirementProfiles.id,
      }),
      membership: r.one.memberships({
        from: r.requirementProfileSubmissions.membershipId,
        to: r.memberships.id,
      }),
      membershipRequest: r.one.membershipRequests({
        from: r.requirementProfileSubmissions.membershipRequestId,
        to: r.membershipRequests.id,
      }),
      reviewedBy: r.one.users({
        from: r.requirementProfileSubmissions.reviewedById,
        to: r.users.id,
      }),
      fulfillments: r.many.requirementFulfillments({
        from: r.requirementProfileSubmissions.id,
        to: r.requirementFulfillments.submissionId,
      }),
    },
    requirementFulfillments: {
      submission: r.one.requirementProfileSubmissions({
        from: r.requirementFulfillments.submissionId,
        to: r.requirementProfileSubmissions.id,
      }),
      requirement: r.one.requirements({
        from: r.requirementFulfillments.requirementId,
        to: r.requirements.id,
      }),
      reviewedBy: r.one.users({
        from: r.requirementFulfillments.reviewedById,
        to: r.users.id,
      }),
      profile: r.one.organizationUserProfiles({
        from: r.requirementFulfillments.organizationUserProfileId,
        to: r.organizationUserProfiles.id,
      }),
    },
    organizationUserProfiles: {
      organization: r.one.organizations({
        from: r.organizationUserProfiles.organizationId,
        to: r.organizations.id,
      }),
      user: r.one.users({
        from: r.organizationUserProfiles.userId,
        to: r.users.id,
      }),
      fulfillments: r.many.requirementFulfillments({
        from: r.organizationUserProfiles.id,
        to: r.requirementFulfillments.organizationUserProfileId,
      }),
    },
    documents: {
      user: r.one.users({
        from: r.documents.userId,
        to: r.users.id,
      }),
    },
    userProfiles: {
      user: r.one.users({
        from: r.userProfiles.userId,
        to: r.users.id,
      }),
    },
    formBlocks: {
      organization: r.one.organizations({
        from: r.formBlocks.organizationId,
        to: r.organizations.id,
      }),
      createdByUser: r.one.users({
        from: r.formBlocks.createdBy,
        to: r.users.id,
      }),
      updatedByUser: r.one.users({
        from: r.formBlocks.updatedBy,
        to: r.users.id,
      }),
      fields: r.many.formBlockFields({
        from: r.formBlocks.id,
        to: r.formBlockFields.blockId,
      }),
      formRefs: r.many.requirementFormBlockRefs({
        from: r.formBlocks.id,
        to: r.requirementFormBlockRefs.blockId,
      }),
    },
    formBlockFields: {
      block: r.one.formBlocks({
        from: r.formBlockFields.blockId,
        to: r.formBlocks.id,
      }),
    },
    requirementForms: {
      organization: r.one.organizations({
        from: r.requirementForms.organizationId,
        to: r.organizations.id,
      }),
      createdByUser: r.one.users({
        from: r.requirementForms.createdBy,
        to: r.users.id,
      }),
      updatedByUser: r.one.users({
        from: r.requirementForms.updatedBy,
        to: r.users.id,
      }),
      blockRefs: r.many.requirementFormBlockRefs({
        from: r.requirementForms.id,
        to: r.requirementFormBlockRefs.formId,
      }),
      submissions: r.many.formSubmissions({
        from: r.requirementForms.id,
        to: r.formSubmissions.formId,
      }),
    },
    requirementFormBlockRefs: {
      form: r.one.requirementForms({
        from: r.requirementFormBlockRefs.formId,
        to: r.requirementForms.id,
      }),
      block: r.one.formBlocks({
        from: r.requirementFormBlockRefs.blockId,
        to: r.formBlocks.id,
      }),
    },
    formSubmissions: {
      form: r.one.requirementForms({
        from: r.formSubmissions.formId,
        to: r.requirementForms.id,
      }),
      user: r.one.users({
        from: r.formSubmissions.userId,
        to: r.users.id,
      }),
      membership: r.one.memberships({
        from: r.formSubmissions.membershipId,
        to: r.memberships.id,
      }),
      values: r.many.formSubmissionValues({
        from: r.formSubmissions.id,
        to: r.formSubmissionValues.submissionId,
      }),
    },
    formSubmissionValues: {
      submission: r.one.formSubmissions({
        from: r.formSubmissionValues.submissionId,
        to: r.formSubmissions.id,
      }),
      field: r.one.formBlockFields({
        from: r.formSubmissionValues.fieldId,
        to: r.formBlockFields.id,
      }),
      block: r.one.formBlocks({
        from: r.formSubmissionValues.blockId,
        to: r.formBlocks.id,
      }),
    },
  }),
);

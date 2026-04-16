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
      favoritedByOrgUnits: r.many.organizationUnitFavoriteRequirementProfiles({
        from: r.requirementProfiles.id,
        to: r.organizationUnitFavoriteRequirementProfiles.requirementProfileId,
      }),
    },
    organizationUnitFavoriteRequirementProfiles: {
      organization: r.one.organizations({
        from: r.organizationUnitFavoriteRequirementProfiles.organizationId,
        to: r.organizations.id,
      }),
      organizationUnit: r.one.organizationUnits({
        from: r.organizationUnitFavoriteRequirementProfiles.organizationUnitId,
        to: r.organizationUnits.id,
      }),
      requirementProfile: r.one.requirementProfiles({
        from: r.organizationUnitFavoriteRequirementProfiles
          .requirementProfileId,
        to: r.requirementProfiles.id,
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
  }),
);

import { defineRelationsPart } from 'drizzle-orm';
import * as schema from '../../database/schema';

export const organizationRelations = defineRelationsPart(schema, (r) => ({
  organizations: {
    root: r.one.organizationUnits({
      from: r.organizations.id,
      to: r.organizationUnits.organizationId,
      where: {
        parentId: {
          isNull: true,
        },
      },
    }),
    units: r.many.organizationUnits({
      from: r.organizations.id,
      to: r.organizationUnits.organizationId,
    }),
    roles: r.many.roles({
      from: r.organizations.id,
      to: r.roles.organizationId,
    }),
  },
  organizationUnits: {
    organization: r.one.organizations({
      from: r.organizationUnits.organizationId,
      to: r.organizations.id,
    }),
    type: r.one.organizationUnitTypes({
      from: r.organizationUnits.typeId,
      to: r.organizationUnitTypes.id,
    }),
    parent: r.one.organizationUnits({
      from: r.organizationUnits.parentId,
      to: r.organizationUnits.id,
    }),
    children: r.many.organizationUnits({
      from: r.organizationUnits.id,
      to: r.organizationUnits.parentId,
    }),
    memberships: r.many.memberships({
      from: r.organizationUnits.id,
      to: r.memberships.organizationUnitId,
    }),
    requiredMembershipRequirementProfile: r.one.requirementProfiles({
      from: r.organizationUnits.requiredMembershipRequirementProfileId,
      to: r.requirementProfiles.id,
    }),
    requiredForms: r.many.organizationUnitRequiredForms({
      from: r.organizationUnits.id,
      to: r.organizationUnitRequiredForms.organizationUnitId,
    }),
  },
  organizationUnitRequiredForms: {
    organizationUnit: r.one.organizationUnits({
      from: r.organizationUnitRequiredForms.organizationUnitId,
      to: r.organizationUnits.id,
    }),
    form: r.one.requirementForms({
      from: r.organizationUnitRequiredForms.formId,
      to: r.requirementForms.id,
    }),
  },
  organizationUnitTypes: {
    units: r.many.organizationUnits({
      from: r.organizationUnitTypes.id,
      to: r.organizationUnits.typeId,
    }),
  },
}));

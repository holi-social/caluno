import { defineRelationsPart } from 'drizzle-orm';
import * as schema from '../../database/schema';

export const organizationRelations = defineRelationsPart(schema, (r) => ({
  organizations: {
    root: r.one.organizationUnits({
      from: r.organizations.id,
      to: r.organizationUnits.organizationId,
      where: {
        isRoot: true,
      },
    }),
    units: r.many.organizationUnits({
      from: r.organizations.id,
      to: r.organizationUnits.organizationId,
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
    roles: r.many.roles({
      from: r.organizationUnits.id,
      to: r.roles.organizationUnitId,
    }),
    memberships: r.many.memberships({
      from: r.organizationUnits.id.through(r.roles.organizationUnitId),
      to: r.memberships.roleId.through(r.roles.id),
    }),
    favoriteRequirementProfiles: r.many.requirementProfiles({
      from: r.organizationUnits.id.through(
        r.organizationUnitFavoriteRequirementProfiles.organizationUnitId,
      ),
      to: r.requirementProfiles.id.through(
        r.organizationUnitFavoriteRequirementProfiles.requirementProfileId,
      ),
    }),
    requirementProfileFavorites:
      r.many.organizationUnitFavoriteRequirementProfiles({
        from: r.organizationUnits.id,
        to: r.organizationUnitFavoriteRequirementProfiles.organizationUnitId,
      }),
  },
  organizationUnitTypes: {
    units: r.many.organizationUnits({
      from: r.organizationUnitTypes.id,
      to: r.organizationUnits.typeId,
    }),
  },
}));

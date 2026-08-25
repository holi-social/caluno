import { beforeAll, describe, expect, it } from 'bun:test';
import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { type Database, DatabaseModule } from '../src/database/database.module';
import { DATABASE_CONNECTION } from '../src/database/database-connection';
import { MembershipService } from '../src/membership/membership.service';
import { NotificationService } from '../src/notification/notification.service';
import { OrganizationMapper } from '../src/organization/mappers/organization.mapper';
import { OrganizationService } from '../src/organization/organization.service';
import { OrganizationUnitService } from '../src/organization/organization-unit.service';
import { OrganizationUnitDataService } from '../src/organization/organization-unit-data.service';
import { PostHogService } from '../src/shared/observability/posthog.service';
import { FileService } from '../src/storage/services';
import { createUser } from './factories';
import {
  addMembership,
  createOrganizationWithType,
  createUnit,
} from './factories/org.factory';
import {
  assignRoleToMembership,
  createPermission,
  createRole,
  grantPermissionToRole,
} from './factories/role.factory';
import {
  ensureTestDatabase,
  registerTestResourceCleanup,
} from './helpers/ensure-test-database';

const accessibleIds = async (
  service: OrganizationService,
  userId: string,
): Promise<Set<string>> => {
  const units = await service.findUnits(userId);
  return new Set(units.map((unit) => unit.id));
};

const administrableIds = async (
  service: OrganizationService,
  userId: string,
): Promise<Set<string>> => {
  const units = await service.findAdministrableUnits(userId);
  return new Set(units.map((unit) => unit.id));
};

// Attaches a role that carries one permission to a membership, making it administrable.
const makeAdministrable = async (
  db: Database,
  args: { membershipId: string; organizationId: string },
) => {
  const role = await createRole(db, { organizationId: args.organizationId });
  const permission = await createPermission(db, {});
  await grantPermissionToRole(db, {
    roleId: role.id,
    permissionId: permission.id,
  });
  await assignRoleToMembership(db, {
    membershipId: args.membershipId,
    roleId: role.id,
  });
};

describe('OrganizationService', () => {
  let moduleRef: TestingModule;
  let organizationService: OrganizationService;
  let db: Database;

  beforeAll(async () => {
    await ensureTestDatabase();
    moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule],
    }).compile();
    db = moduleRef.get<Database>(DATABASE_CONNECTION);

    organizationService = new OrganizationService(
      db,
      {} as OrganizationMapper,
      {} as MembershipService,
      {} as OrganizationUnitService,
      {} as NotificationService,
      {} as FileService,
      { captureUserJoinedOrg: () => {} } as unknown as PostHogService,
    );

    registerTestResourceCleanup(async () => {
      await moduleRef.close();
    });
  });

  describe('findAccessibleUnits', () => {
    it('finds only the subtree of a unit, not its siblings or ancestors', async () => {
      const user = await createUser(db);
      const { organization, type } = await createOrganizationWithType(
        db,
        `Subtree Org ${crypto.randomUUID()}`,
      );

      const root = await createUnit(db, {
        organizationId: organization.id,
        typeId: type.id,
        name: 'root',
      });
      const region = await createUnit(db, {
        organizationId: organization.id,
        typeId: type.id,
        name: 'region',
        parentId: root.id,
      });
      const branch1 = await createUnit(db, {
        organizationId: organization.id,
        typeId: type.id,
        name: 'branch-1',
        parentId: region.id,
      });
      const branch2 = await createUnit(db, {
        organizationId: organization.id,
        typeId: type.id,
        name: 'branch-2',
        parentId: region.id,
      });
      const site = await createUnit(db, {
        organizationId: organization.id,
        typeId: type.id,
        name: 'site',
        parentId: root.id,
      });

      await addMembership(db, user.id, region.id);

      const ids = await accessibleIds(organizationService, user.id);

      expect(ids).toEqual(new Set([region.id, branch1.id, branch2.id]));
      // Neither the ancestor nor the sibling branch leak in.
      expect(ids.has(root.id)).toBe(false);
      expect(ids.has(site.id)).toBe(false);
    });

    it('excludes soft-deleted descendants from the accessible set', async () => {
      const user = await createUser(db);
      const { organization, type } = await createOrganizationWithType(
        db,
        `Deleted Org ${crypto.randomUUID()}`,
      );

      const root = await createUnit(db, {
        organizationId: organization.id,
        typeId: type.id,
        name: 'root',
      });
      const activeChild = await createUnit(db, {
        organizationId: organization.id,
        typeId: type.id,
        name: 'active-child',
        parentId: root.id,
      });
      await createUnit(db, {
        organizationId: organization.id,
        typeId: type.id,
        name: 'deleted-child',
        parentId: root.id,
        deletedAt: new Date(),
      });

      await addMembership(db, user.id, root.id);

      const ids = await accessibleIds(organizationService, user.id);

      expect(ids).toEqual(new Set([root.id, activeChild.id]));
    });

    it('unions the subtrees of every membership the user holds', async () => {
      const user = await createUser(db);
      const { organization, type } = await createOrganizationWithType(
        db,
        `Union Org ${crypto.randomUUID()}`,
      );

      const root = await createUnit(db, {
        organizationId: organization.id,
        typeId: type.id,
        name: 'root',
      });
      const region = await createUnit(db, {
        organizationId: organization.id,
        typeId: type.id,
        name: 'region',
        parentId: root.id,
      });
      const branch1 = await createUnit(db, {
        organizationId: organization.id,
        typeId: type.id,
        name: 'branch-1',
        parentId: region.id,
      });
      const site = await createUnit(db, {
        organizationId: organization.id,
        typeId: type.id,
        name: 'site',
        parentId: root.id,
      });
      const siteA = await createUnit(db, {
        organizationId: organization.id,
        typeId: type.id,
        name: 'site-a',
        parentId: site.id,
      });

      // Two disjoint subtrees: region's branch, and the site branch.
      await addMembership(db, user.id, branch1.id);
      await addMembership(db, user.id, site.id);

      const ids = await accessibleIds(organizationService, user.id);

      expect(ids).toEqual(new Set([branch1.id, site.id, siteA.id]));
      // The shared ancestor and the other region subtree stay out.
      expect(ids.has(root.id)).toBe(false);
      expect(ids.has(region.id)).toBe(false);
    });

    it('returns nothing when the user holds no memberships', async () => {
      const user = await createUser(db);

      const units = await organizationService.findUnits(user.id);

      expect(units).toEqual([]);
    });

    it('combines units across organizations', async () => {
      const user = await createUser(db);
      const { organization: orgA, type: typeA } =
        await createOrganizationWithType(
          db,
          `Cross Org A ${crypto.randomUUID()}`,
        );
      const { organization: orgB, type: typeB } =
        await createOrganizationWithType(
          db,
          `Cross Org B ${crypto.randomUUID()}`,
        );

      const aUnit = await createUnit(db, {
        organizationId: orgA.id,
        typeId: typeA.id,
        name: 'b-middle',
      });
      const bUnit = await createUnit(db, {
        organizationId: orgB.id,
        typeId: typeB.id,
        name: 'a-first',
      });
      const cUnit = await createUnit(db, {
        organizationId: orgA.id,
        typeId: typeA.id,
        name: 'c-last',
        parentId: aUnit.id,
      });

      await addMembership(db, user.id, aUnit.id);
      await addMembership(db, user.id, bUnit.id);

      const units = await organizationService.findUnits(user.id);

      // Units from both orgs are present...
      expect(new Set(units.map((unit) => unit.id))).toEqual(
        new Set([aUnit.id, bUnit.id, cUnit.id]),
      );
    });
  });

  describe('findAdministrableUnits', () => {
    it('grants a permission-bearing membership its unit and all descendants', async () => {
      const user = await createUser(db);
      const { organization, type } = await createOrganizationWithType(
        db,
        `Admin Org ${crypto.randomUUID()}`,
      );

      const root = await createUnit(db, {
        organizationId: organization.id,
        typeId: type.id,
        name: 'root',
      });
      const child = await createUnit(db, {
        organizationId: organization.id,
        typeId: type.id,
        name: 'child',
        parentId: root.id,
      });
      const grandchild = await createUnit(db, {
        organizationId: organization.id,
        typeId: type.id,
        name: 'grandchild',
        parentId: child.id,
      });

      const membership = await addMembership(db, user.id, root.id);
      await makeAdministrable(db, {
        membershipId: membership.id,
        organizationId: organization.id,
      });

      const ids = await administrableIds(organizationService, user.id);

      expect(ids).toEqual(new Set([root.id, child.id, grandchild.id]));
    });

    it('excludes a membership whose role has no permissions', async () => {
      const user = await createUser(db);
      const { organization, type } = await createOrganizationWithType(
        db,
        `NoPerm Org ${crypto.randomUUID()}`,
      );

      const root = await createUnit(db, {
        organizationId: organization.id,
        typeId: type.id,
        name: 'root',
      });

      const membership = await addMembership(db, user.id, root.id);
      const role = await createRole(db, { organizationId: organization.id });
      await assignRoleToMembership(db, {
        membershipId: membership.id,
        roleId: role.id,
      });

      const ids = await administrableIds(organizationService, user.id);

      expect(ids).toEqual(new Set());
    });

    it('only gets the org unit where they have admin perms, ignores others', async () => {
      const user = await createUser(db);
      const { organization, type } = await createOrganizationWithType(
        db,
        `Mixed Org ${crypto.randomUUID()}`,
      );

      const root = await createUnit(db, {
        organizationId: organization.id,
        typeId: type.id,
        name: 'root',
      });
      const adminChild = await createUnit(db, {
        organizationId: organization.id,
        typeId: type.id,
        name: 'admin-child',
        parentId: root.id,
      });
      const plainSibling = await createUnit(db, {
        organizationId: organization.id,
        typeId: type.id,
        name: 'plain-sibling',
        parentId: root.id,
      });

      const adminMembership = await addMembership(db, user.id, adminChild.id);
      await makeAdministrable(db, {
        membershipId: adminMembership.id,
        organizationId: organization.id,
      });

      const plainMembership = await addMembership(db, user.id, plainSibling.id);
      const plainRole = await createRole(db, {
        organizationId: organization.id,
      });
      await assignRoleToMembership(db, {
        membershipId: plainMembership.id,
        roleId: plainRole.id,
      });

      const ids = await administrableIds(organizationService, user.id);

      expect(ids).toEqual(new Set([adminChild.id]));
    });
  });
});

describe('OrganizationUnitService', () => {
  let db: Database;
  let organizationUnitService: OrganizationUnitService;

  beforeAll(async () => {
    await ensureTestDatabase();
    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule],
    }).compile();
    db = moduleRef.get<Database>(DATABASE_CONNECTION);

    organizationUnitService = new OrganizationUnitService(
      db,
      {
        assertUploadedFileForPurpose: async () => ({}),
        resolvePublicUrlForUploadedFile: async () =>
          'https://example.com/logo.png',
      } as never,
      new OrganizationUnitDataService(db),
    );

    registerTestResourceCleanup(async () => {
      await moduleRef.close();
    });
  });

  describe('update', () => {
    it('keeps the existing slug when the unit name is updated', async () => {
      const { organization, type } = await createOrganizationWithType(
        db,
        `Slug Stability Org ${crypto.randomUUID()}`,
      );
      const root = await createUnit(db, {
        organizationId: organization.id,
        typeId: type.id,
        name: 'root',
      });
      const child = await createUnit(db, {
        organizationId: organization.id,
        typeId: type.id,
        name: 'child',
        parentId: root.id,
      });
      const originalSlug = child.slug;

      const updated = await organizationUnitService.update(child.id, {
        organizationId: organization.id,
        name: 'Renamed Child',
        typeId: type.id,
        parentId: root.id,
      });

      expect(updated.slug).toBe(originalSlug);
      expect(updated.name).toBe('Renamed Child');
    });
  });
});

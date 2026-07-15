import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, inArray, isNotNull, sql } from 'drizzle-orm';
import {
  DEFAULT_MEMBER_ROLE_NAME,
  DEFAULT_OWNER_ROLE_NAME,
  MEMBER_DEFAULT_PERMISSIONS,
  PERMISSIONS,
} from '../auth/constants';
import type { Database } from '../database/database.module';
import { DATABASE_CONNECTION } from '../database/database-connection';
import * as schema from '../database/schema';
import {
  OrganizationEntity,
  OrganizationUnitEntity,
  OrganizationUnitTypeEntity,
} from '../database/schema';
import type { PaginationInput } from '../graphql/pagination.input';
import { MembershipService } from '../membership/membership.service';
import { NotificationService } from '../notification';
import { slugify } from '../utils';
import type { CreateOrganizationInput } from './inputs/create-organization.input';
import { OrganizationMapper } from './mappers/organization.mapper';
import { type Organization } from './models/organization.model';
import { OrganizationTree } from './models/organization-tree.model';
import { OrganizationUnitService } from './organization-unit.service';
import { OrganizationNode } from './types/organization-node';

type OrganizationUnitWithType = OrganizationUnitEntity & {
  type: OrganizationUnitTypeEntity;
};

type SeedMembership = {
  organizationUnit: { id: string; organizationId: string | null } | null;
};

@Injectable()
export class OrganizationService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
    private readonly mapper: OrganizationMapper,
    private readonly membershipService: MembershipService,
    private readonly organizationUnitService: OrganizationUnitService,
    private readonly notificationService: NotificationService,
  ) {}

  async findById(id: string): Promise<OrganizationEntity | undefined> {
    return this.db.query.organizations.findFirst({
      where: { id },
    });
  }

  async findBySlug(slug: string): Promise<OrganizationEntity | undefined> {
    return this.db.query.organizations.findFirst({
      where: { slug },
    });
  }

  async findAll(
    userId: string,
    pagination: PaginationInput,
  ): Promise<{ items: OrganizationEntity[]; total: number }> {
    const organizationIdsPage = await this.db
      .select({
        id: schema.organizations.id,
        createdAt: schema.organizations.createdAt,
      })
      .from(schema.memberships)
      .innerJoin(
        schema.organizationUnits,
        eq(schema.memberships.organizationUnitId, schema.organizationUnits.id),
      )
      .innerJoin(
        schema.organizations,
        eq(schema.organizationUnits.organizationId, schema.organizations.id),
      )
      .where(
        and(
          eq(schema.memberships.userId, userId),
          isNotNull(schema.organizationUnits.organizationId),
        ),
      )
      .groupBy(schema.organizations.id, schema.organizations.createdAt)
      .orderBy(desc(schema.organizations.createdAt))
      .limit(pagination.limit)
      .offset(pagination.offset);

    const [{ total }] = await this.db
      .select({
        total: sql<number>`count(distinct ${schema.organizations.id})`,
      })
      .from(schema.memberships)
      .innerJoin(
        schema.organizationUnits,
        eq(schema.memberships.organizationUnitId, schema.organizationUnits.id),
      )
      .innerJoin(
        schema.organizations,
        eq(schema.organizationUnits.organizationId, schema.organizations.id),
      )
      .where(
        and(
          eq(schema.memberships.userId, userId),
          isNotNull(schema.organizationUnits.organizationId),
        ),
      );

    if (organizationIdsPage.length === 0) {
      return {
        items: [],
        total,
      };
    }

    const pageIds = organizationIdsPage.map((organization) => organization.id);
    const organizations = await this.db
      .select()
      .from(schema.organizations)
      .where(inArray(schema.organizations.id, pageIds));

    const uniqueOrganizations = new Map<string, OrganizationEntity>();
    for (const organization of organizations) {
      uniqueOrganizations.set(organization.id, organization);
    }

    return {
      items: pageIds
        .map((organizationId) => uniqueOrganizations.get(organizationId))
        .filter(
          (organization): organization is OrganizationEntity =>
            organization !== undefined,
        ),
      total,
    };
  }

  async findUnits(userId: string): Promise<OrganizationUnitEntity[]> {
    const userMemberships = await this.db.query.memberships.findMany({
      where: { userId },
      with: {
        organizationUnit: {
          columns: { id: true, organizationId: true },
        },
      },
    });

    return this.expandToChildOrgUnits(userMemberships);
  }

  async findAdministrableUnits(
    userId: string,
  ): Promise<OrganizationUnitEntity[]> {
    const administrableMemberships = await this.db.query.memberships.findMany({
      where: {
        userId,
        roles: {
          role: {
            permissions: {}, // select all memberships that have a role that has at least one permission
          },
        },
      },
      with: {
        organizationUnit: {
          columns: { id: true, organizationId: true },
        },
      },
    });

    return this.expandToChildOrgUnits(administrableMemberships);
  }

  private async expandToChildOrgUnits(
    seedMemberships: SeedMembership[],
  ): Promise<OrganizationUnitEntity[]> {
    const memberUnitIdsByOrgId = new Map<string, Set<string>>();
    for (const membership of seedMemberships) {
      const unit = membership.organizationUnit;
      if (!unit?.organizationId) continue;
      const memberUnitIds =
        memberUnitIdsByOrgId.get(unit.organizationId) ?? new Set<string>();
      memberUnitIds.add(unit.id);
      memberUnitIdsByOrgId.set(unit.organizationId, memberUnitIds);
    }

    if (memberUnitIdsByOrgId.size === 0) {
      return [];
    }

    const accessibleByOrg = await Promise.all(
      [...memberUnitIdsByOrgId.entries()].map(
        async ([organizationId, memberUnitIds]) => {
          const units = await this.db.query.organizationUnits.findMany({
            where: { organizationId },
          });
          return this.collectUnitsAccessibleFromMemberships(
            units,
            memberUnitIds,
          );
        },
      ),
    );

    return accessibleByOrg.flat().sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Membership on a unit grants access to that unit and every descendant.
   * Expands member seeds downward instead of walking ancestors per unit.
   */
  private collectUnitsAccessibleFromMemberships(
    units: OrganizationUnitEntity[],
    memberUnitIds: Set<string>,
  ): OrganizationUnitEntity[] {
    const childrenByParentId = new Map<string, string[]>();
    for (const unit of units) {
      if (!unit.parentId) continue;
      const children = childrenByParentId.get(unit.parentId) ?? [];
      children.push(unit.id);
      childrenByParentId.set(unit.parentId, children);
    }

    const accessibleUnitIds = new Set(memberUnitIds);
    const queue = [...memberUnitIds];
    while (queue.length > 0) {
      const parentId = queue.shift();
      if (!parentId) continue;
      for (const childId of childrenByParentId.get(parentId) ?? []) {
        if (accessibleUnitIds.has(childId)) continue;
        accessibleUnitIds.add(childId);
        queue.push(childId);
      }
    }

    return units.filter(
      (unit) => !unit.deletedAt && accessibleUnitIds.has(unit.id),
    );
  }

  async findOrganizationTree(
    userId: string,
    organizationUnitId: string,
  ): Promise<OrganizationTree | null> {
    const rootUnit = (await this.db.query.organizationUnits.findFirst({
      where: { id: organizationUnitId },
      with: { type: true },
    })) as OrganizationUnitWithType;

    if (!rootUnit?.organizationId) return null;

    const canAccess = await this.membershipService.isMemberOfUnitOrAncestor(
      userId,
      organizationUnitId,
    );

    if (!canAccess) return null;

    const allOrgUnits = (await this.db.query.organizationUnits.findMany({
      where: { organizationId: rootUnit.organizationId },
      with: { type: true },
    })) as OrganizationUnitWithType[];

    return {
      root: this.buildRootNode(allOrgUnits, rootUnit),
    };
  }

  private buildRootNode(
    units: OrganizationUnitWithType[],
    root: OrganizationUnitWithType,
  ): OrganizationNode {
    const childrenByParentId = new Map<string, OrganizationUnitWithType[]>();

    for (const unit of units) {
      if (!unit.parentId) continue;
      const siblings = childrenByParentId.get(unit.parentId) ?? [];
      siblings.push(unit);
      childrenByParentId.set(unit.parentId, siblings);
    }

    const buildNode = (unit: OrganizationUnitWithType): OrganizationNode => ({
      id: unit.id,
      name: unit.name,
      slug: unit.slug,
      parentId: unit.parentId,
      deletedAt: unit.deletedAt?.toISOString() ?? null,
      type: {
        id: unit.type.id,
        name: unit.type.name,
        icon: unit.type.icon ?? '',
      },
      children: buildChildren(unit.id),
    });

    const buildChildren = (parentId: string): OrganizationNode[] =>
      (childrenByParentId.get(parentId) ?? []).map(buildNode);

    return buildNode(root);
  }

  async findRootUnit(
    organizationId: string,
  ): Promise<OrganizationUnitEntity | undefined> {
    return this.db.query.organizationUnits.findFirst({
      where: {
        organizationId,
        parentId: {
          isNull: true,
        },
      },
    });
  }

  async findChildrenUnits(
    organizationId: string,
  ): Promise<OrganizationUnitEntity[]> {
    return this.db.query.organizationUnits.findMany({
      where: {
        organizationId,
        parentId: {
          isNotNull: true,
        },
      },
    });
  }

  async findUnitsByOrgIds(orgIds: string[]): Promise<OrganizationUnitEntity[]> {
    if (orgIds.length === 0) {
      return [];
    }

    return this.db.query.organizationUnits.findMany({
      where: {
        organizationId: {
          in: orgIds,
        },
        parentId: {
          isNotNull: true,
        },
      },
    });
  }

  async create(
    userId: string,
    input: CreateOrganizationInput,
  ): Promise<Organization> {
    const allPermissionKeys = Object.values(PERMISSIONS).filter(
      (permission) => !permission.startsWith('org-role:'),
    );

    const [organization, rootUnit] = await this.db.transaction(async (tx) => {
      // Create organization first to get the canonical base data.
      const [createdOrganization] = await tx
        .insert(schema.organizations)
        .values({
          ...input,
          slug: slugify(input.name),
        })
        .returning();

      // Create the default root unit type.
      const [rootType] = await tx
        .insert(schema.organizationUnitTypes)
        .values({
          organizationId: createdOrganization.id,
          name: 'organisation unit',
          description: `organization unit for ${createdOrganization.name}`,
          icon: 'building-2',
        })
        .returning();

      // Create root unit mirroring organization fields.
      const [rootUnit] = await tx
        .insert(schema.organizationUnits)
        .values({
          organizationId: createdOrganization.id,
          parentId: null,
          typeId: rootType.id,
          name: createdOrganization.name,
          slug: createdOrganization.slug,
          logoUrl: createdOrganization.logoUrl,
          websiteUrl: createdOrganization.websiteUrl,
          contactEmail: createdOrganization.contactEmail,
          phone: createdOrganization.phone,
          description: createdOrganization.description,
          address: createdOrganization.address,
        })
        .returning();

      const [ownerRole] = await tx
        .insert(schema.roles)
        .values({
          name: DEFAULT_OWNER_ROLE_NAME,
          description: `Owner role for organization ${createdOrganization.name}`,
          isInternal: true,
          organizationId: createdOrganization.id,
        })
        .returning();

      // Create the default member role.
      const [memberRole] = await tx
        .insert(schema.roles)
        .values({
          name: DEFAULT_MEMBER_ROLE_NAME,
          description: `Member role for organization ${createdOrganization.name}`,
          isInternal: true,
          organizationId: createdOrganization.id,
        })
        .returning();

      const memberPermissionRows = await tx
        .select({
          id: schema.permissions.id,
          key: schema.permissions.key,
        })
        .from(schema.permissions)
        .where(inArray(schema.permissions.key, MEMBER_DEFAULT_PERMISSIONS));

      // Attach default member permissions.
      if (memberPermissionRows.length > 0) {
        await tx.insert(schema.rolePermissions).values(
          memberPermissionRows.map((permission) => ({
            roleId: memberRole.id,
            permissionId: permission.id,
          })),
        );
      }

      const permissionRows = await tx
        .select({
          id: schema.permissions.id,
          key: schema.permissions.key,
        })
        .from(schema.permissions)
        .where(inArray(schema.permissions.key, allPermissionKeys));

      // Attach all permissions to the owner role.
      if (permissionRows.length > 0) {
        await tx.insert(schema.rolePermissions).values(
          permissionRows.map((permission) => ({
            roleId: ownerRole.id,
            permissionId: permission.id,
          })),
        );
      }

      // Link creator as owner member of the organization.
      await this.organizationUnitService.addOwnerMembership(
        userId,
        rootUnit.id,
        createdOrganization.id,
        tx,
      );

      return [createdOrganization, rootUnit];
    });

    this.notificationService.notifyOrganizationCreated({
      organizationUnitId: rootUnit.id,
      organizationName: organization.name,
      userId,
    });

    return this.mapper.toModelOrThrow(organization);
  }
}

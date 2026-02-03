import { Inject, Injectable } from '@nestjs/common';
import { and, eq, or } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { UserEntity } from '../auth/schemas/auth.schema';
import { DATABASE_CONNECTION } from '../database/database-connection';
import * as schema from '../database/schema';
import { MembershipEntity } from '../database/schema';
import { OrganizationRole } from '../organization/enums';

@Injectable()
export class MembershipService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(
    userId: string,
    organizationId: string,
    role: OrganizationRole,
  ): Promise<MembershipEntity> {
    const [membership] = await this.db
      .insert(schema.memberships)
      .values({
        userId,
        organizationId,
        role,
      })
      .returning();
    return membership;
  }

  async findUsersByRole(
    organizationId: string,
    role: OrganizationRole,
  ): Promise<UserEntity[]> {
    const adminMemberships = await this.db.query.memberships.findMany({
      where: and(
        eq(schema.memberships.organizationId, organizationId),
        eq(schema.memberships.role, role),
      ),
      with: {
        user: true,
      },
    });

    const admins = adminMemberships
      .map((membership) => membership.user)
      .filter((user): user is UserEntity => user !== null);
    return admins;
  }

  async isOwner(userId: string, organizationId: string): Promise<boolean> {
    const membership = await this.db.query.memberships.findFirst({
      where: and(
        eq(schema.memberships.userId, userId),
        eq(schema.memberships.organizationId, organizationId),
        eq(schema.memberships.role, OrganizationRole.OWNER),
      ),
    });
    return !!membership;
  }

  async isAdmin(userId: string, organizationId: string): Promise<boolean> {
    const membership = await this.db.query.memberships.findFirst({
      where: and(
        eq(schema.memberships.userId, userId),
        eq(schema.memberships.organizationId, organizationId),
        eq(schema.memberships.role, OrganizationRole.ADMIN),
      ),
    });
    return !!membership;
  }

  async isVolunteer(userId: string, organizationId: string): Promise<boolean> {
    const membership = await this.db.query.memberships.findFirst({
      where: and(
        eq(schema.memberships.userId, userId),
        eq(schema.memberships.organizationId, organizationId),
        eq(schema.memberships.role, OrganizationRole.VOLUNTEER),
      ),
    });
    return !!membership;
  }

  async isStaff(userId: string, organizationId: string): Promise<boolean> {
    const membership = await this.db.query.memberships.findFirst({
      where: and(
        eq(schema.memberships.userId, userId),
        eq(schema.memberships.organizationId, organizationId),
        or(
          eq(schema.memberships.role, OrganizationRole.OWNER),
          eq(schema.memberships.role, OrganizationRole.ADMIN),
        ),
      ),
    });
    return !!membership;
  }
  async isMember(userId: string, organizationId: string): Promise<boolean> {
    const membership = await this.db.query.memberships.findFirst({
      where: and(
        eq(schema.memberships.userId, userId),
        eq(schema.memberships.organizationId, organizationId),
      ),
    });
    return !!membership;
  }

  async getMembership(
    userId: string,
    organizationId: string,
  ): Promise<MembershipEntity | null> {
    const membership = await this.db.query.memberships.findFirst({
      where: and(
        eq(schema.memberships.userId, userId),
        eq(schema.memberships.organizationId, organizationId),
      ),
    });
    return membership ?? null;
  }
}

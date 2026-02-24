import { Inject, Injectable } from '@nestjs/common';
import type { UserEntity } from '../auth/schemas/auth.schema';
import type { Database } from '../database/database.module';
import { DATABASE_CONNECTION } from '../database/database-connection';
import * as schema from '../database/schema';
import { MembershipEntity } from '../database/schema';
import { OrganizationRole } from '../organization/enums';

@Injectable()
export class MembershipService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
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
    const users = await this.db.query.users.findMany({
      where: {
        memberships: {
          organizationId,
          role,
        },
      },
    });
    return users;
  }

  async isOwner(userId: string, organizationId: string): Promise<boolean> {
    const membership = await this.db.query.memberships.findFirst({
      where: {
        userId,
        organizationId,
        role: OrganizationRole.OWNER,
      },
    });
    return !!membership;
  }

  async isAdmin(userId: string, organizationId: string): Promise<boolean> {
    const membership = await this.db.query.memberships.findFirst({
      where: {
        userId,
        organizationId,
        role: OrganizationRole.ADMIN,
      },
    });
    return !!membership;
  }

  async isVolunteer(userId: string, organizationId: string): Promise<boolean> {
    const membership = await this.db.query.memberships.findFirst({
      where: {
        userId,
        organizationId,
        role: OrganizationRole.VOLUNTEER,
      },
    });
    return !!membership;
  }

  async isStaff(userId: string, organizationId: string): Promise<boolean> {
    const membership = await this.db.query.memberships.findFirst({
      where: {
        userId,
        organizationId,
        OR: [
          { role: OrganizationRole.OWNER },
          { role: OrganizationRole.ADMIN },
        ],
      },
    });
    return !!membership;
  }
  async isMember(userId: string, organizationId: string): Promise<boolean> {
    const membership = await this.db.query.memberships.findFirst({
      where: {
        userId,
        organizationId,
      },
    });
    return !!membership;
  }

  async getMembership(
    userId: string,
    organizationId: string,
  ): Promise<MembershipEntity | null> {
    const membership = await this.db.query.memberships.findFirst({
      where: {
        userId,
        organizationId,
      },
    });
    return membership ?? null;
  }
}

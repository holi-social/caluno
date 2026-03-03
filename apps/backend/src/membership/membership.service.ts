import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import type { UserEntity } from '../auth/schemas/auth.schema';
import type { Database } from '../database/database.module';
import { DATABASE_CONNECTION } from '../database/database-connection';
import * as schema from '../database/schema';
import { MembershipEntity } from '../database/schema';
import { NotFoundGraphQLError } from '../graphql/errors';
import { OrganizationRole } from '../organization/enums';
import { MembershipRequestStatus } from './enums';
import { MembershipRequestEntity } from './schemas/membership-request.schema';

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
        role: OrganizationRole.ADMIN,
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

  async createMembershipRequest(
    email: string,
    organizationId: string,
  ): Promise<MembershipRequestEntity> {
    const [membershipRequest] = await this.db
      .insert(schema.membershipRequests)
      .values({
        email,
        organizationId,
      })
      .returning();
    return membershipRequest;
  }

  async approveMembershipRequest(
    userId: string,
    membershipRequestId: string,
  ): Promise<boolean> {
    const [membershipRequest] = await this.db
      .update(schema.membershipRequests)
      .set({
        status: MembershipRequestStatus.ACCEPTED,
      })
      .where(
        and(
          eq(schema.membershipRequests.id, membershipRequestId),
          eq(schema.membershipRequests.status, MembershipRequestStatus.PENDING),
        ),
      )
      .returning();

    if (!membershipRequest) {
      throw new NotFoundGraphQLError('Membership request not found');
    }

    await this.db.insert(schema.memberships).values({
      userId,
      organizationId: membershipRequest.organizationId,
      role: OrganizationRole.VOLUNTEER,
    });

    return true;
  }
}

import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import type { UserEntity } from '../auth/schemas/auth.schema';
import type { Database } from '../database/database.module';
import { DATABASE_CONNECTION } from '../database/database-connection';
import * as schema from '../database/schema';
import { ConflictGraphQLError, NotFoundGraphQLError } from '../graphql/errors';
import { OrganizationRole } from '../organization/enums';
import { MembershipRequestStatus } from './enums';
import { UpdateMembershipRequestInput } from './inputs/update-membership-request.input';
import type { MembershipEntity } from './schemas/membership.schema';
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
    const adminMemberships = await this.db.query.memberships.findMany({
      where: { organizationId, role },
      with: {
        user: true,
      },
    });

    const admins = adminMemberships
      .map((membership) => membership.user)
      .filter((user): user is UserEntity => user !== null);

    return admins;
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

  // Membership requests
  async createMembershipRequest(
    userId: string,
    organizationId: string,
  ): Promise<MembershipRequestEntity> {
    const existing = await this.db.query.membershipRequests.findFirst({
      where: {
        userId,
        organizationId,
        status: MembershipRequestStatus.PENDING,
      },
    });

    if (existing) {
      throw new ConflictGraphQLError(
        'A pending membership request already exists for this organization.',
      );
    }

    const [membershipRequest] = await this.db
      .insert(schema.membershipRequests)
      .values({
        userId,
        organizationId,
      })
      .returning();

    return membershipRequest;
  }

  private async updateMembershipRequest(
    id: string,
    organizationId: string,
    input: UpdateMembershipRequestInput,
    userId?: string,
  ): Promise<MembershipRequestEntity> {
    const [membershipRequest] = await this.db
      .update(schema.membershipRequests)
      .set(input)
      .where(
        and(
          eq(schema.membershipRequests.id, id),
          eq(schema.membershipRequests.organizationId, organizationId),
          eq(schema.membershipRequests.status, MembershipRequestStatus.PENDING),
          userId ? eq(schema.membershipRequests.userId, userId) : undefined,
        ),
      )
      .returning();

    if (!membershipRequest) {
      throw new NotFoundGraphQLError('Membership request not found');
    }

    return membershipRequest;
  }

  async approveMembershipRequest(
    id: string,
    organizationId: string,
    reviewerId: string,
  ): Promise<boolean> {
    const membershipRequest = await this.updateMembershipRequest(
      id,
      organizationId,
      {
        status: MembershipRequestStatus.ACCEPTED,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
      },
    );

    await this.db.insert(schema.memberships).values({
      userId: membershipRequest.userId,
      organizationId: membershipRequest.organizationId,
      role: OrganizationRole.VOLUNTEER,
    });

    return true;
  }

  async rejectMembershipRequest(
    id: string,
    organizationId: string,
    reviewerId: string,
    rejectionReason: string,
  ): Promise<boolean> {
    await this.updateMembershipRequest(id, organizationId, {
      status: MembershipRequestStatus.REJECTED,
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      rejectionReason,
    });

    return true;
  }

  async cancelMembershipRequest(
    id: string,
    organizationId: string,
    userId: string,
  ): Promise<boolean> {
    await this.updateMembershipRequest(
      id,
      organizationId,
      {
        status: MembershipRequestStatus.CANCELLED,
      },
      userId,
    );

    return true;
  }

  async getMembershipRequests(
    organizationId: string,
  ): Promise<MembershipRequestEntity[]> {
    return this.db.query.membershipRequests.findMany({
      where: { organizationId },
    });
  }
}

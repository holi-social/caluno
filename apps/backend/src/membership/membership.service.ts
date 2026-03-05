import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import type { UserEntity } from '../auth/schemas/auth.schema';
import type { Database } from '../database/database.module';
import { DATABASE_CONNECTION } from '../database/database-connection';
import * as schema from '../database/schema';
import { NotFoundGraphQLError } from '../graphql/errors';
import { PaginationInput } from '../graphql/pagination.input';
import { OrganizationRole } from '../organization/enums';
import { UserMapper } from '../user/mappers/user.mapper';
import type { User } from '../user/models/user.model';
import { MembershipRequestStatus } from './enums';
import { UpdateMembershipRequestInput } from './inputs/update-membership-request.input';
import { MembershipMapper } from './mappers/membership.mepper';
import { MembershipRequestMapper } from './mappers/membership-request.mepper';
import { Membership } from './models/membership.model';
import {
  MembershipRequest,
  MembershipRequestPaginatedResponse,
} from './models/membership-request.model';
import { MembershipRequestEntity } from './schemas/membership-request.schema';

@Injectable()
export class MembershipService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
    private readonly membershipMapper: MembershipMapper,
    private readonly membershipRequestMapper: MembershipRequestMapper,
  ) {}

  async create(
    userId: string,
    organizationId: string,
    role: OrganizationRole,
  ): Promise<Membership> {
    const [membership] = await this.db
      .insert(schema.memberships)
      .values({
        userId,
        organizationId,
        role,
      })
      .returning();
    return this.membershipMapper.toModelOrThrow(membership);
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
  ): Promise<Membership | null> {
    const membership = await this.db.query.memberships.findFirst({
      where: {
        userId,
        organizationId,
      },
    });
    return this.membershipMapper.toModel(membership);
  }

  // Membership requests
  async createMembershipRequest(
    userId: string,
    organizationId: string,
  ): Promise<MembershipRequest> {
    const [membershipRequest] = await this.db
      .insert(schema.membershipRequests)
      .values({
        userId,
        organizationId,
      })
      .returning();

    return this.membershipRequestMapper.toModelOrThrow(membershipRequest);
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
    pagination: PaginationInput,
  ): Promise<MembershipRequestPaginatedResponse> {
    const membershipRequests = await this.db.query.membershipRequests.findMany({
      where: { organizationId },
    });
    return new MembershipRequestPaginatedResponse({
      items: this.membershipRequestMapper.toArray(membershipRequests),
      total: membershipRequests.length,
      limit: pagination.limit,
      offset: pagination.offset,
    });
  }
}

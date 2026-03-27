import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DEFAULT_MEMBER_ROLE_NAME } from '../auth/constants';
import type { UserEntity } from '../auth/schemas/auth.schema';
import type { Database } from '../database/database.module';
import { DATABASE_CONNECTION } from '../database/database-connection';
import * as schema from '../database/schema';
import { ConflictGraphQLError, NotFoundGraphQLError } from '../graphql/errors';
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

  async getMembers(organizationId: string): Promise<UserEntity[]> {
    const members = await this.db.query.users.findMany({
      where: {
        memberships: {
          role: {
            organizationId,
          },
        },
      },
    });

    return members;
  }

  async getMembership(
    userId: string,
    organizationUnitId: string,
  ): Promise<MembershipEntity | null> {
    const membership = await this.db.query.memberships.findFirst({
      where: {
        userId,
        role: {
          organizationUnitId,
        },
      },
    });
    return membership ?? null;
  }

  // Membership requests
  async createMembershipRequest(
    userId: string,
    organizationUnitId: string,
  ): Promise<MembershipRequestEntity> {
    const existing = await this.db.query.membershipRequests.findFirst({
      where: {
        userId,
        organizationUnitId,
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
        organizationUnitId,
      })
      .returning();

    return membershipRequest;
  }

  private async updateMembershipRequest(
    id: string,
    organizationUnitId: string,
    input: UpdateMembershipRequestInput,
    userId?: string,
  ): Promise<MembershipRequestEntity> {
    const [membershipRequest] = await this.db
      .update(schema.membershipRequests)
      .set(input)
      .where(
        and(
          eq(schema.membershipRequests.id, id),
          eq(schema.membershipRequests.organizationUnitId, organizationUnitId),
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
    organizationUnitId: string,
    reviewerId: string,
  ): Promise<MembershipRequestEntity> {
    const membershipRequest =
      await this.db.transaction<MembershipRequestEntity>(async (tx) => {
        const organization = await tx.query.organizations.findFirst({
          where: { id: organizationUnitId },
        });

        if (!organization) {
          throw new NotFoundGraphQLError('Organization not found');
        }

        const memberRole = await tx.query.roles.findFirst({
          where: {
            name: DEFAULT_MEMBER_ROLE_NAME,
            isInternal: true,
            organizationUnitId,
          },
        });

        if (!memberRole) {
          throw new NotFoundGraphQLError(
            'Member role not found for this organization',
          );
        }

        const [membershipRequest] = await tx
          .update(schema.membershipRequests)
          .set({
            status: MembershipRequestStatus.ACCEPTED,
            reviewedById: reviewerId,
            reviewedAt: new Date(),
          })
          .where(
            and(
              eq(schema.membershipRequests.id, id),
              eq(schema.membershipRequests.organizationUnitId, organizationUnitId),
              eq(
                schema.membershipRequests.status,
                MembershipRequestStatus.PENDING,
              ),
            ),
          )
          .returning();

        if (!membershipRequest) {
          throw new NotFoundGraphQLError('Membership request not found');
        }

        await tx.insert(schema.memberships).values({
          userId: membershipRequest.userId,
          roleId: memberRole.id,
        });

        return membershipRequest;
      });

    return membershipRequest;
  }

  async rejectMembershipRequest(
    id: string,
    organizationUnitId: string,
    reviewerId: string,
    rejectionReason: string,
  ): Promise<MembershipRequestEntity> {
    return this.updateMembershipRequest(id, organizationUnitId, {
      status: MembershipRequestStatus.REJECTED,
      reviewedById: reviewerId,
      reviewedAt: new Date(),
      rejectionReason,
    });
  }

  async cancelMembershipRequest(
    id: string,
    organizationUnitId: string,
    userId: string,
  ): Promise<MembershipRequestEntity> {
    return this.updateMembershipRequest(
      id,
      organizationUnitId,
      {
        status: MembershipRequestStatus.CANCELLED,
      },
      userId,
    );
  }

  async getMembershipRequests(
    organizationUnitId: string,
    status?: MembershipRequestStatus,
  ): Promise<MembershipRequestEntity[]> {
    return this.db.query.membershipRequests.findMany({
      where: { organizationUnitId, status },
      with: {
        user: true,
        organizationUnit: true,
        reviewedBy: true,
      },
    });
  }

  async assignRoleToMembership(
    membershipId: string,
    roleId: string,
  ): Promise<boolean> {
    const [membership] = await this.db
      .update(schema.memberships)
      .set({ roleId })
      .where(eq(schema.memberships.id, membershipId))
      .returning();

    if (!membership) {
      throw new NotFoundGraphQLError('Membership not found');
    }

    return true;
  }
}

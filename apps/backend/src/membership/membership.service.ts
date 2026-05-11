import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DEFAULT_MEMBER_ROLE_NAME } from '../auth/constants';
import type { UserEntity } from '../auth/schemas/auth.schema';
import type { Database } from '../database/database.module';
import { DATABASE_CONNECTION } from '../database/database-connection';
import * as schema from '../database/schema';
import { ConflictGraphQLError, NotFoundGraphQLError } from '../graphql/errors';
import { NotificationService } from '../notification/notification.service';
import type { RequirementProfileEntity } from '../requirement-profile/schemas/requirement-profile.schema';
import { RequirementProfileService } from '../requirement-profile/services/requirement-profile.service';
import { JoinStatus } from '../shared/enums/join-status.enum';
import { ShiftService } from '../shift/shift.service';
import { MembershipRequestStatus } from './enums';
import { UpdateMembershipRequestInput } from './inputs/update-membership-request.input';
import type { MembershipEntity } from './schemas/membership.schema';
import { MembershipRequestEntity } from './schemas/membership-request.schema';

@Injectable()
export class MembershipService {
  private readonly logger = new Logger(MembershipService.name);

  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
    private readonly notificationService: NotificationService,
    private readonly requirementProfileService: RequirementProfileService,
    @Inject(forwardRef(() => ShiftService))
    private readonly shiftService: ShiftService,
  ) {}

  async getMembers(organizationUnitId: string): Promise<UserEntity[]> {
    const members = await this.db.query.users.findMany({
      where: {
        memberships: {
          organizationUnitId,
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
        organizationUnitId,
      },
    });
    return membership ?? null;
  }

  /**
   * Returns `true` when the user holds a membership on `organizationUnitId`
   * itself or on any of its ancestors within the same organization. Access
   * inherits downward, so sibling and descendant memberships do not count.
   *
   * Returns `false` (never throws) when the unit is missing, has no
   * organization, or the user has no qualifying membership.
   */
  async isMemberOfUnitOrAncestor(
    userId: string,
    organizationUnitId: string,
  ): Promise<boolean> {
    const requestedUnit = await this.db.query.organizationUnits.findFirst({
      where: { id: organizationUnitId },
      columns: { id: true, organizationId: true },
    });

    if (!requestedUnit?.organizationId) return false;

    const userMemberships = await this.db.query.memberships.findMany({
      where: { userId },
      with: {
        organizationUnit: {
          columns: { id: true, organizationId: true },
        },
      },
    });

    // Keep only memberships scoped to the target organization.
    const memberUnitIdsInOrganization = new Set(
      userMemberships.flatMap((membership) => {
        const unit = membership.organizationUnit;
        if (!unit) return [];
        if (unit.organizationId !== requestedUnit.organizationId) return [];
        return [unit.id];
      }),
    );

    if (memberUnitIdsInOrganization.size === 0) return false;

    const units = await this.db.query.organizationUnits.findMany({
      where: { organizationId: requestedUnit.organizationId },
      columns: { id: true, parentId: true },
    });

    const parentByUnitId = new Map<string, string | null>();
    for (const unit of units) {
      parentByUnitId.set(unit.id, unit.parentId);
    }

    // Walk upward; first member-owned ancestor wins.
    let currentUnitId: string | null = organizationUnitId;
    while (currentUnitId) {
      if (memberUnitIdsInOrganization.has(currentUnitId)) return true;
      currentUnitId = parentByUnitId.get(currentUnitId) ?? null;
    }

    return false;
  }

  // Membership requests
  async createMembershipRequest(
    userId: string,
    organizationUnitId: string,
    intendedShiftId?: string,
  ): Promise<MembershipRequestEntity> {
    const existing = await this.db.query.membershipRequests.findFirst({
      where: {
        userId,
        organizationUnitId,
        status: MembershipRequestStatus.PENDING,
      },
    });

    if (existing) {
      if (intendedShiftId) {
        const metadata = (existing.metadata ?? {}) as {
          intendedShiftIds?: string[];
        };
        const intendedShiftIds = Array.from(
          new Set([...(metadata.intendedShiftIds ?? []), intendedShiftId]),
        );

        const [updated] = await this.db
          .update(schema.membershipRequests)
          .set({ metadata: { ...metadata, intendedShiftIds } })
          .where(eq(schema.membershipRequests.id, existing.id))
          .returning();

        return updated;
      }

      throw new ConflictGraphQLError(
        'A pending membership request already exists for this organization.',
      );
    }

    const [membershipRequest] = await this.db
      .insert(schema.membershipRequests)
      .values({
        userId,
        organizationUnitId,
        metadata: intendedShiftId
          ? { intendedShiftIds: [intendedShiftId] }
          : undefined,
      })
      .returning();

    const orgUnit = await this.db.query.organizationUnits.findFirst({
      where: { id: organizationUnitId },
    });
    if (orgUnit) {
      await this.notificationService.notifyOrgOfMembershipRequest(
        membershipRequest,
        orgUnit,
      );
    }

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
    const membershipRequest = await this.db.transaction(async (tx) => {
      const requestToApprove = await tx.query.membershipRequests.findFirst({
        where: { id },
      });

      if (!requestToApprove) {
        throw new NotFoundGraphQLError('Membership request not found');
      }

      const organizationUnit = await tx.query.organizationUnits.findFirst({
        where: { id: organizationUnitId },
      });

      if (!organizationUnit) {
        throw new NotFoundGraphQLError('Organization unit not found');
      }

      if (!organizationUnit.organizationId) {
        throw new ConflictGraphQLError(
          'Cannot approve: organization unit is not linked to an organization.',
        );
      }

      const memberRole = await tx.query.roles.findFirst({
        where: {
          organizationId: organizationUnit.organizationId,
          name: DEFAULT_MEMBER_ROLE_NAME,
          isInternal: true,
        },
      });

      if (!memberRole) {
        throw new NotFoundGraphQLError('Default member role not found');
      }

      if (organizationUnit.requiredMembershipRequirementProfileId) {
        if (!requestToApprove.userId) {
          throw new ConflictGraphQLError(
            'Cannot approve: membership request has no associated user.',
          );
        }
        const requirementStatuses =
          await this.requirementProfileService.getUserRequirementStatus(
            requestToApprove.userId,
            organizationUnit.requiredMembershipRequirementProfileId,
          );
        const allApproved = requirementStatuses.every(
          (s) => s.status === 'APPROVED',
        );
        if (!allApproved) {
          throw new ConflictGraphQLError(
            'Cannot approve: user has not completed the required membership profile.',
          );
        }
      }

      const [updatedRequest] = await tx
        .update(schema.membershipRequests)
        .set({
          status: MembershipRequestStatus.ACCEPTED,
          reviewedById: reviewerId,
          reviewedAt: new Date(),
        })
        .where(
          and(
            eq(schema.membershipRequests.id, id),
            eq(
              schema.membershipRequests.organizationUnitId,
              organizationUnitId,
            ),
            eq(
              schema.membershipRequests.status,
              MembershipRequestStatus.PENDING,
            ),
          ),
        )
        .returning();

      if (!updatedRequest) {
        throw new NotFoundGraphQLError('Membership request not found');
      }

      const [membership] = await tx
        .insert(schema.memberships)
        .values({
          userId: updatedRequest.userId,
          organizationUnitId,
        })
        .returning();

      if (!membership) {
        throw new NotFoundGraphQLError('Membership not found');
      }

      await tx.insert(schema.membershipRoles).values({
        membershipId: membership.id,
        roleId: memberRole.id,
      });

      return updatedRequest;
    });

    await this.notificationService.notifyUserMembershipApproved(
      membershipRequest,
    );

    const metadata = (membershipRequest.metadata ?? {}) as {
      intendedShiftIds?: string[];
    };
    if (metadata.intendedShiftIds?.length && membershipRequest.userId) {
      for (const shiftId of metadata.intendedShiftIds) {
        try {
          const shift = await this.shiftService.findByIdPublic(shiftId);
          if (shift && shift.visibility === 'ALL_MEMBERS') {
            await this.shiftService.joinShift(
              membershipRequest.userId,
              shiftId,
            );
          }
        } catch (e) {
          this.logger.warn(`Failed to auto-join shift ${shiftId}: ${e}`);
        }
      }
    }

    return membershipRequest;
  }

  async rejectMembershipRequest(
    id: string,
    organizationUnitId: string,
    reviewerId: string,
    rejectionReason: string,
  ): Promise<MembershipRequestEntity> {
    const request = await this.updateMembershipRequest(id, organizationUnitId, {
      status: MembershipRequestStatus.REJECTED,
      reviewedById: reviewerId,
      reviewedAt: new Date(),
      rejectionReason,
    });

    await this.notificationService.notifyUserMembershipRejected(request);
    return request;
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
        requirementProfileSubmissions: true,
      },
    });
  }

  async getMyMembershipRequests(
    userId: string,
    status?: MembershipRequestStatus,
  ): Promise<MembershipRequestEntity[]> {
    return this.db.query.membershipRequests.findMany({
      where: { userId, ...(status ? { status } : {}) },
      with: {
        user: true,
        organizationUnit: true,
        reviewedBy: true,
        requirementProfileSubmissions: true,
      },
    });
  }

  async requestOrgJoin(
    userId: string,
    organizationUnitId: string,
    intendedShiftId?: string,
  ): Promise<
    | { status: 'JOINED' }
    | {
        status: 'PENDING';
        membershipRequest: MembershipRequestEntity;
      }
    | {
        status: 'REJECTED';
        membershipRequest: MembershipRequestEntity;
      }
    | {
        status: 'REQUIREMENTS_NEEDED';
        requirementProfile: RequirementProfileEntity;
        requirementStatuses: Array<{
          requirementId: string;
          name: string;
          status: string;
        }>;
      }
  > {
    const membership = await this.getMembership(userId, organizationUnitId);
    if (membership) {
      return { status: 'JOINED' };
    }

    const orgUnit = await this.db.query.organizationUnits.findFirst({
      where: { id: organizationUnitId },
    });
    if (!orgUnit) {
      throw new NotFoundGraphQLError('Organization unit not found');
    }

    if (orgUnit.requiredMembershipRequirementProfileId) {
      const statuses =
        await this.requirementProfileService.getUserRequirementStatus(
          userId,
          orgUnit.requiredMembershipRequirementProfileId,
        );
      const allApproved = statuses.every((s) => s.status === 'APPROVED');
      if (!allApproved) {
        const profile = await this.requirementProfileService.findById(
          orgUnit.requiredMembershipRequirementProfileId,
        );
        if (!profile) {
          throw new NotFoundGraphQLError('Requirement profile not found');
        }
        return {
          status: 'REQUIREMENTS_NEEDED',
          requirementProfile: profile,
          requirementStatuses: statuses,
        };
      }
    }

    const existing = await this.db.query.membershipRequests.findFirst({
      where: {
        userId,
        organizationUnitId,
      },
    });

    if (existing) {
      if (existing.status === MembershipRequestStatus.PENDING) {
        if (intendedShiftId) {
          const metadata = (existing.metadata ?? {}) as {
            intendedShiftIds?: string[];
          };
          const intendedShiftIds = Array.from(
            new Set([...(metadata.intendedShiftIds ?? []), intendedShiftId]),
          );

          const [updated] = await this.db
            .update(schema.membershipRequests)
            .set({ metadata: { ...metadata, intendedShiftIds } })
            .where(eq(schema.membershipRequests.id, existing.id))
            .returning();

          return { status: JoinStatus.PENDING, membershipRequest: updated };
        }

        return { status: JoinStatus.PENDING, membershipRequest: existing };
      }

      if (
        existing.status === MembershipRequestStatus.REJECTED ||
        existing.status === MembershipRequestStatus.CANCELLED
      ) {
        return { status: JoinStatus.REJECTED, membershipRequest: existing };
      }

      return { status: JoinStatus.JOINED };
    }

    const request = await this.createMembershipRequest(
      userId,
      organizationUnitId,
      intendedShiftId,
    );
    return { status: 'PENDING', membershipRequest: request };
  }

  async assignRoleToMembership(
    membershipId: string,
    roleId: string,
  ): Promise<boolean> {
    const membership = await this.db.query.memberships.findFirst({
      where: { id: membershipId },
      with: {
        organizationUnit: true,
      },
    });

    if (!membership) {
      throw new NotFoundGraphQLError('Membership not found');
    }

    if (!membership.organizationUnit?.organizationId) {
      throw new ConflictGraphQLError(
        'Membership organization unit is not linked to an organization.',
      );
    }

    const role = await this.db.query.roles.findFirst({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundGraphQLError('Role not found');
    }

    if (role.organizationId !== membership.organizationUnit.organizationId) {
      throw new ConflictGraphQLError(
        'Role does not belong to the membership organization.',
      );
    }

    const existingRole = await this.db.query.membershipRoles.findFirst({
      where: {
        membershipId,
        roleId,
      },
    });

    if (existingRole) {
      return true;
    }

    const [membershipRole] = await this.db
      .insert(schema.membershipRoles)
      .values({
        membershipId,
        roleId,
      })
      .returning();

    return membershipRole !== undefined;
  }
}

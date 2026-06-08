import { Inject, Injectable } from '@nestjs/common';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { DEFAULT_MEMBER_ROLE_NAME } from '../auth/constants';
import type { UserEntity } from '../auth/schemas/auth.schema';
import type { RoleEntity } from '../auth/schemas/role.schema';
import type { Database } from '../database/database.module';
import { DATABASE_CONNECTION } from '../database/database-connection';
import * as schema from '../database/schema';
import { ConflictGraphQLError, NotFoundGraphQLError } from '../graphql/errors';
import { NotificationService } from '../notification/notification.service';
import type { RequirementProfileEntity } from '../requirement-profile/schemas/requirement-profile.schema';
import { RequirementProfileService } from '../requirement-profile/services/requirement-profile.service';
import { JoinStatus } from '../shared/enums/join-status.enum';
import { MembershipRequestStatus } from './enums';
import { UpdateMembershipRequestInput } from './inputs/update-membership-request.input';
import type { MembershipEntity } from './schemas/membership.schema';
import {
  type MembershipRequestEntity,
  type MembershipRequestMetadata,
} from './schemas/membership-request.schema';

@Injectable()
export class MembershipService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
    private readonly notificationService: NotificationService,
    private readonly requirementProfileService: RequirementProfileService,
  ) {}

  private appendIntendedIdsToMetadata(
    metadata: MembershipRequestMetadata,
    intendedShiftId?: string,
    intendedEventId?: string,
  ): MembershipRequestMetadata {
    const newMetadata: MembershipRequestMetadata = { ...metadata };

    if (intendedShiftId) {
      newMetadata.intendedShiftIds = Array.from(
        new Set([...(newMetadata.intendedShiftIds ?? []), intendedShiftId]),
      );
    }

    if (intendedEventId) {
      newMetadata.intendedEventIds = Array.from(
        new Set([...(newMetadata.intendedEventIds ?? []), intendedEventId]),
      );
    }

    return newMetadata;
  }

  private buildInitialMetadata(
    intendedShiftId?: string,
    intendedEventId?: string,
  ): MembershipRequestMetadata | undefined {
    const metadata: MembershipRequestMetadata = {};

    if (intendedShiftId) {
      metadata.intendedShiftIds = [intendedShiftId];
    }

    if (intendedEventId) {
      metadata.intendedEventIds = [intendedEventId];
    }

    return Object.keys(metadata).length > 0 ? metadata : undefined;
  }

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

  async getMemberships(
    organizationUnitId: string,
  ): Promise<MembershipEntity[]> {
    return this.db.query.memberships.findMany({
      where: { organizationUnitId },
      with: {
        user: true,
        organizationUnit: true,
        roles: {
          with: {
            role: true,
          },
        },
      },
    });
  }

  async getMembershipUser(membershipId: string): Promise<UserEntity | null> {
    const membership = await this.db.query.memberships.findFirst({
      where: { id: membershipId },
      with: { user: true },
    });
    return membership?.user ?? null;
  }

  async getMembershipOrganizationUnit(
    membershipId: string,
  ): Promise<schema.OrganizationUnitEntity | null> {
    const membership = await this.db.query.memberships.findFirst({
      where: { id: membershipId },
      with: { organizationUnit: true },
    });
    return membership?.organizationUnit ?? null;
  }

  async getMembershipRoles(membershipId: string): Promise<RoleEntity[]> {
    const membershipRoles = await this.db.query.membershipRoles.findMany({
      where: { membershipId },
      with: { role: true },
    });
    return membershipRoles
      .map((mr) => mr.role)
      .filter((r): r is RoleEntity => r !== null);
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
    intendedEventId?: string,
  ): Promise<MembershipRequestEntity> {
    const existing = await this.db.query.membershipRequests.findFirst({
      where: {
        userId,
        organizationUnitId,
        status: MembershipRequestStatus.PENDING,
      },
    });

    if (existing) {
      if (intendedShiftId || intendedEventId) {
        const metadata = this.appendIntendedIdsToMetadata(
          (existing.metadata ?? {}) as MembershipRequestMetadata,
          intendedShiftId,
          intendedEventId,
        );

        const [updated] = await this.db
          .update(schema.membershipRequests)
          .set({ metadata })
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
        metadata: this.buildInitialMetadata(intendedShiftId, intendedEventId),
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

  async getMembershipRequestCount(
    organizationUnitId: string,
    status?: MembershipRequestStatus,
  ): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.membershipRequests)
      .where(
        and(
          eq(schema.membershipRequests.organizationUnitId, organizationUnitId),
          status ? eq(schema.membershipRequests.status, status) : undefined,
        ),
      );
    return result[0]?.count ?? 0;
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
    intendedEventId?: string,
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
        if (intendedShiftId || intendedEventId) {
          const metadata = this.appendIntendedIdsToMetadata(
            (existing.metadata ?? {}) as MembershipRequestMetadata,
            intendedShiftId,
            intendedEventId,
          );

          const [updated] = await this.db
            .update(schema.membershipRequests)
            .set({ metadata })
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
      intendedEventId,
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

  async updateMembershipRoles(
    membershipId: string,
    roleIds: string[],
    organizationUnitId?: string,
  ): Promise<MembershipEntity> {
    const membership = await this.db.query.memberships.findFirst({
      where: { id: membershipId },
      with: {
        organizationUnit: true,
      },
    });

    if (!membership) {
      throw new NotFoundGraphQLError('Membership not found');
    }

    if (
      organizationUnitId &&
      membership.organizationUnitId !== organizationUnitId
    ) {
      throw new ConflictGraphQLError(
        'Membership does not belong to the current organization unit.',
      );
    }

    if (!membership.organizationUnit?.organizationId) {
      throw new ConflictGraphQLError(
        'Membership organization unit is not linked to an organization.',
      );
    }

    const organizationId = membership.organizationUnit.organizationId;

    if (roleIds.length === 0) {
      throw new ConflictGraphQLError(
        'A membership must have at least one role assigned.',
      );
    }

    const roles = await this.db
      .select()
      .from(schema.roles)
      .where(inArray(schema.roles.id, roleIds));

    if (roles.length !== roleIds.length) {
      throw new NotFoundGraphQLError('One or more roles not found');
    }

    const allBelongToOrg = roles.every(
      (role) => role.organizationId === organizationId,
    );

    if (!allBelongToOrg) {
      throw new ConflictGraphQLError(
        'One or more roles do not belong to the membership organization.',
      );
    }

    await this.db.transaction(async (tx) => {
      await tx
        .delete(schema.membershipRoles)
        .where(eq(schema.membershipRoles.membershipId, membershipId));

      if (roleIds.length > 0) {
        await tx.insert(schema.membershipRoles).values(
          roleIds.map((roleId) => ({
            membershipId,
            roleId,
          })),
        );
      }
    });

    const updatedMembership = await this.db.query.memberships.findFirst({
      where: { id: membershipId },
      with: {
        user: true,
        organizationUnit: true,
        roles: {
          with: {
            role: true,
          },
        },
      },
    });

    if (!updatedMembership) {
      throw new NotFoundGraphQLError('Membership not found after update');
    }

    await this.notificationService.notifyUserRoleUpgraded(
      updatedMembership,
      roleIds,
    );

    return updatedMembership;
  }
}

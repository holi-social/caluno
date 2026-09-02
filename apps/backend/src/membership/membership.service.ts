import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, eq, gte, inArray, sql } from 'drizzle-orm';
import { AuthService } from '../auth/auth.service';
import { DEFAULT_MEMBER_ROLE_NAME, PERMISSIONS } from '../auth/constants';
import type { UserEntity } from '../auth/schemas/auth.schema';
import type { RoleEntity } from '../auth/schemas/role.schema';
import type { Database } from '../database/database.module';
import { DATABASE_CONNECTION } from '../database/database-connection';
import * as schema from '../database/schema';
import { ConflictGraphQLError, NotFoundGraphQLError } from '../graphql/errors';
import { NotificationService } from '../notification';
import { RequiredFormTargetType } from '../requirement-profile/enums';
import type { RequirementProfileEntity } from '../requirement-profile/schemas/requirement-profile.schema';
import { FormSubmissionService } from '../requirement-profile/services/form-submission.service';
import type { RequiredFormStatus } from '../requirement-profile/services/required-form.service';
import { RequiredFormService } from '../requirement-profile/services/required-form.service';
import { RequirementProfileService } from '../requirement-profile/services/requirement-profile.service';
import { JoinStatus } from '../shared/enums/join-status.enum';
import {
  POSTHOG_EVENT,
  POSTHOG_SURFACE,
} from '../shared/observability/posthog.events';
import { PostHogService } from '../shared/observability/posthog.service';
import { MembershipRequestStatus } from './enums';
import { UpdateMembershipRequestInput } from './inputs/update-membership-request.input';
import type { MembershipEntity } from './schemas/membership.schema';
import {
  type MembershipRequestEntity,
  type MembershipRequestMetadata,
} from './schemas/membership-request.schema';

@Injectable()
export class MembershipService {
  private readonly logger = new Logger(MembershipService.name);

  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
    private readonly requirementProfileService: RequirementProfileService,
    private readonly authService: AuthService,
    private readonly notificationService: NotificationService,
    private readonly requiredFormService: RequiredFormService,
    private readonly formSubmissionService: FormSubmissionService,
    private readonly postHogService: PostHogService,
  ) {}

  private appendIntendedIdsToMetadata(
    metadata: MembershipRequestMetadata,
    intendedShiftInstanceId?: string,
    intendedEventId?: string,
    intendedShiftId?: string,
  ): MembershipRequestMetadata {
    const newMetadata: MembershipRequestMetadata = { ...metadata };

    if (intendedShiftInstanceId) {
      newMetadata.intendedShiftInstanceIds = Array.from(
        new Set([
          ...(newMetadata.intendedShiftInstanceIds ?? []),
          intendedShiftInstanceId,
        ]),
      );
    }

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
    intendedShiftInstanceId?: string,
    intendedEventId?: string,
    intendedShiftId?: string,
  ): MembershipRequestMetadata | undefined {
    const metadata: MembershipRequestMetadata = {};

    if (intendedShiftInstanceId) {
      metadata.intendedShiftInstanceIds = [intendedShiftInstanceId];
    }

    if (intendedShiftId) {
      metadata.intendedShiftIds = [intendedShiftId];
    }

    if (intendedEventId) {
      metadata.intendedEventIds = [intendedEventId];
    }

    return Object.keys(metadata).length > 0 ? metadata : undefined;
  }

  private async countUserMembershipsInOrganization(
    userId: string,
    organizationId: string,
  ): Promise<number> {
    const [row] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.memberships)
      .innerJoin(
        schema.organizationUnits,
        eq(schema.memberships.organizationUnitId, schema.organizationUnits.id),
      )
      .where(
        and(
          eq(schema.memberships.userId, userId),
          eq(schema.organizationUnits.organizationId, organizationId),
        ),
      );

    return Number(row?.count ?? 0);
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

  /**
   * Read-only membership state for a user against an org unit — the same
   * lookups `requestOrgJoin` does before it would create anything, exposed
   * separately so a page can show the right button state before the user
   * clicks "join".
   */
  async getMembershipState(
    userId: string,
    organizationUnitId: string,
  ): Promise<JoinStatus> {
    const membership = await this.getMembership(userId, organizationUnitId);
    if (membership) {
      return JoinStatus.JOINED;
    }

    const existing = await this.db.query.membershipRequests.findFirst({
      where: { userId, organizationUnitId },
    });

    if (existing?.status === MembershipRequestStatus.PENDING) {
      return JoinStatus.PENDING;
    }

    if (
      existing?.status === MembershipRequestStatus.REJECTED ||
      existing?.status === MembershipRequestStatus.CANCELLED
    ) {
      return JoinStatus.REJECTED;
    }

    return JoinStatus.NONE;
  }

  /**
   * The volunteer's open (PENDING) membership request against this exact
   * unit, if any — used by the check-in readiness gate, which needs the
   * request's own id rather than the derived `getMembershipState` enum.
   */
  async findPendingMembershipRequest(
    userId: string,
    organizationUnitId: string,
  ): Promise<{ id: string } | null> {
    const request = await this.db.query.membershipRequests.findFirst({
      where: {
        userId,
        organizationUnitId,
        status: MembershipRequestStatus.PENDING,
      },
      columns: { id: true },
    });
    return request ?? null;
  }

  async getPendingOrganizationUnitIds(userId: string): Promise<string[]> {
    const requests = await this.db.query.membershipRequests.findMany({
      where: {
        userId,
        status: MembershipRequestStatus.PENDING,
      },
      columns: { organizationUnitId: true },
    });

    return requests
      .map((request) => request.organizationUnitId)
      .filter((id): id is string => id !== null);
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

  async getMyMemberships(userId: string): Promise<MembershipEntity[]> {
    return this.db.query.memberships.findMany({
      where: { userId },
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

  async getMyMembership(
    userId: string,
    id: string,
  ): Promise<MembershipEntity | null> {
    const membership = await this.db.query.memberships.findFirst({
      where: { id, userId },
      with: {
        organizationUnit: true,
        roles: { with: { role: true } },
      },
    });

    return membership ?? null;
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

  private async notifyMembershipRequested(
    userId: string,
    organizationUnitId: string,
  ): Promise<void> {
    try {
      const organizationUnit = await this.db.query.organizationUnits.findFirst({
        where: { id: organizationUnitId },
        columns: { id: true, name: true },
      });

      if (!organizationUnit) {
        return;
      }

      const reviewers = await this.authService.findUsersWithPermission(
        organizationUnitId,
        PERMISSIONS.VOLUNTEER_EDIT,
      );
      const recipientUserIds = reviewers
        .filter((reviewer) => reviewer.id !== userId)
        .map((reviewer) => reviewer.id);

      if (recipientUserIds.length === 0) {
        return;
      }

      this.notificationService.notifyMembershipRequested({
        organizationUnitId,
        organizationUnitName: organizationUnit.name,
        requesterUserId: userId,
        recipientUserIds,
      });
    } catch (error) {
      this.logger.error(
        `Failed to emit membership requested notification: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async notifyMembershipLeft(
    userId: string,
    organizationUnitId: string,
  ): Promise<void> {
    try {
      const organizationUnit = await this.db.query.organizationUnits.findFirst({
        where: { id: organizationUnitId },
        columns: { id: true, name: true },
      });

      if (!organizationUnit) {
        return;
      }

      const reviewers = await this.authService.findUsersWithPermission(
        organizationUnitId,
        PERMISSIONS.VOLUNTEER_EDIT,
      );
      const recipientUserIds = reviewers
        .filter((reviewer) => reviewer.id !== userId)
        .map((reviewer) => reviewer.id);

      if (recipientUserIds.length === 0) {
        return;
      }

      this.notificationService.notifyMembershipLeft({
        organizationUnitId,
        organizationUnitName: organizationUnit.name,
        leaverUserId: userId,
        recipientUserIds,
      });
    } catch (error) {
      this.logger.error(
        `Failed to emit membership left notification: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async notifyMembershipRemoved(
    userId: string,
    organizationUnitId: string,
  ): Promise<void> {
    try {
      const organizationUnit = await this.db.query.organizationUnits.findFirst({
        where: { id: organizationUnitId },
        columns: { id: true, name: true },
      });

      if (!organizationUnit) {
        return;
      }

      this.notificationService.notifyMembershipRemoved({
        organizationUnitId,
        organizationName: organizationUnit.name,
        userId,
      });
    } catch (error) {
      this.logger.error(
        `Failed to emit membership removed notification: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // Membership requests
  async createMembershipRequest(
    userId: string,
    organizationUnitId: string,
    intendedShiftInstanceId?: string,
    intendedEventId?: string,
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
      if (intendedShiftInstanceId || intendedEventId || intendedShiftId) {
        const metadata = this.appendIntendedIdsToMetadata(
          (existing.metadata ?? {}) as MembershipRequestMetadata,
          intendedShiftInstanceId,
          intendedEventId,
          intendedShiftId,
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
        metadata: this.buildInitialMetadata(
          intendedShiftInstanceId,
          intendedEventId,
          intendedShiftId,
        ),
      })
      .returning();

    void this.notifyMembershipRequested(userId, organizationUnitId);

    const orgUnit = await this.db.query.organizationUnits.findFirst({
      where: { id: organizationUnitId },
    });
    this.postHogService.capture({
      event: POSTHOG_EVENT.MEMBERSHIP_REQUEST_SUBMIT,
      userId,
      properties: {
        surface: POSTHOG_SURFACE.VOLUNTEERING,
        organization_id: orgUnit?.organizationId,
        organization_unit_id: organizationUnitId,
        membership_request_id: membershipRequest.id,
      },
    });

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
    const { membershipRequest, organizationUnit } = await this.db.transaction(
      async (tx) => {
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

        return { membershipRequest: updatedRequest, organizationUnit };
      },
    );

    if (membershipRequest.userId) {
      this.notificationService.notifyMembershipApproved({
        organizationUnitId,
        organizationName: organizationUnit.name,
        userId: membershipRequest.userId,
      });

      if (organizationUnit.organizationId) {
        this.postHogService.capture({
          event: POSTHOG_EVENT.MEMBERSHIP_REQUEST_APPROVE,
          userId: membershipRequest.userId,
          properties: {
            surface: POSTHOG_SURFACE.BACKOFFICE,
            organization_id: organizationUnit.organizationId,
            organization_unit_id: organizationUnitId,
            membership_request_id: membershipRequest.id,
            source: 'membership_approve',
          },
        });
        this.postHogService.capture({
          event: POSTHOG_EVENT.ORGANIZATION_UNIT_JOIN,
          userId: membershipRequest.userId,
          properties: {
            surface: POSTHOG_SURFACE.BACKOFFICE,
            organization_id: organizationUnit.organizationId,
            organization_unit_id: organizationUnitId,
            source: 'membership_approve',
          },
        });
        const membershipCount = await this.countUserMembershipsInOrganization(
          membershipRequest.userId,
          organizationUnit.organizationId,
        );
        if (membershipCount === 1) {
          this.postHogService.capture({
            event: POSTHOG_EVENT.ORGANIZATION_JOIN,
            userId: membershipRequest.userId,
            properties: {
              surface: POSTHOG_SURFACE.BACKOFFICE,
              organization_id: organizationUnit.organizationId,
              organization_unit_id: organizationUnitId,
              source: 'membership_approve',
            },
          });
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

    if (request.userId) {
      const orgUnit = await this.db.query.organizationUnits.findFirst({
        where: { id: organizationUnitId },
      });
      this.postHogService.capture({
        event: POSTHOG_EVENT.MEMBERSHIP_REQUEST_REJECT,
        userId: request.userId,
        properties: {
          surface: POSTHOG_SURFACE.BACKOFFICE,
          organization_id: orgUnit?.organizationId,
          organization_unit_id: organizationUnitId,
          membership_request_id: request.id,
        },
      });
    }

    return request;
  }

  async cancelMembershipRequest(
    id: string,
    organizationUnitId: string,
    userId: string,
  ): Promise<MembershipRequestEntity> {
    const request = await this.updateMembershipRequest(
      id,
      organizationUnitId,
      {
        status: MembershipRequestStatus.CANCELLED,
      },
      userId,
    );
    const orgUnit = await this.db.query.organizationUnits.findFirst({
      where: { id: organizationUnitId },
    });
    this.postHogService.capture({
      event: POSTHOG_EVENT.MEMBERSHIP_REQUEST_CANCEL,
      userId,
      properties: {
        surface: POSTHOG_SURFACE.VOLUNTEERING,
        organization_id: orgUnit?.organizationId,
        organization_unit_id: organizationUnitId,
        membership_request_id: request.id,
        source: 'self',
      },
    });
    return request;
  }

  async leaveMembership(id: string, userId: string): Promise<MembershipEntity> {
    const { row, identity } = await this.db.transaction(async (tx) => {
      const [deleted] = await tx
        .delete(schema.memberships)
        .where(
          and(
            eq(schema.memberships.id, id),
            eq(schema.memberships.userId, userId),
          ),
        )
        .returning();

      if (!deleted) {
        throw new NotFoundGraphQLError('Membership not found');
      }

      const identity = this.membershipIdentity(deleted);
      await this.purgeOrganizationUnitInvites(
        tx,
        identity.userId,
        identity.organizationUnitId,
      );

      return { row: deleted, identity };
    });

    const orgUnit = row.organizationUnitId
      ? await this.db.query.organizationUnits.findFirst({
          where: { id: row.organizationUnitId },
        })
      : undefined;
    this.postHogService.capture({
      event: POSTHOG_EVENT.ORGANIZATION_UNIT_LEAVE,
      userId,
      properties: {
        surface: POSTHOG_SURFACE.VOLUNTEERING,
        organization_id: orgUnit?.organizationId ?? undefined,
        organization_unit_id: row.organizationUnitId ?? undefined,
        membership_id: row.id,
        source: 'self',
      },
    });

    void this.notifyMembershipLeft(
      identity.userId,
      identity.organizationUnitId,
    );

    return row;
  }

  async removeMembership(
    id: string,
    organizationUnitId: string,
  ): Promise<MembershipEntity> {
    const { row, identity } = await this.db.transaction(async (tx) => {
      const [deleted] = await tx
        .delete(schema.memberships)
        .where(
          and(
            eq(schema.memberships.id, id),
            eq(schema.memberships.organizationUnitId, organizationUnitId),
          ),
        )
        .returning();

      if (!deleted) {
        throw new NotFoundGraphQLError('Membership not found');
      }

      const identity = this.membershipIdentity(deleted);
      await this.purgeOrganizationUnitInvites(
        tx,
        identity.userId,
        identity.organizationUnitId,
      );
      return { row: deleted, identity };
    });

    void this.notifyMembershipRemoved(
      identity.userId,
      identity.organizationUnitId,
    );

    return row;
  }

  private membershipIdentity(row: MembershipEntity): {
    userId: string;
    organizationUnitId: string;
  } {
    if (!row.userId || !row.organizationUnitId) {
      throw new NotFoundGraphQLError('Membership not found');
    }
    return {
      userId: row.userId,
      organizationUnitId: row.organizationUnitId,
    };
  }

  private async purgeOrganizationUnitInvites(
    tx: Database,
    userId: string,
    organizationUnitId: string,
  ): Promise<void> {
    const now = new Date();

    await tx.delete(schema.eventInvites).where(
      and(
        eq(schema.eventInvites.userId, userId),
        inArray(
          schema.eventInvites.eventId,
          tx
            .select({ id: schema.events.id })
            .from(schema.events)
            .where(
              and(
                eq(schema.events.organizationUnitId, organizationUnitId),
                gte(schema.events.endsAt, now),
              ),
            ),
        ),
      ),
    );

    await tx.delete(schema.shiftInstanceInvites).where(
      and(
        eq(schema.shiftInstanceInvites.userId, userId),
        inArray(
          schema.shiftInstanceInvites.instanceId,
          tx
            .select({ id: schema.shiftInstances.id })
            .from(schema.shiftInstances)
            .innerJoin(
              schema.shifts,
              eq(schema.shiftInstances.masterId, schema.shifts.id),
            )
            .where(
              and(
                eq(schema.shifts.organizationUnitId, organizationUnitId),
                gte(schema.shiftInstances.actualEndsAt, now),
              ),
            ),
        ),
      ),
    );

    await tx
      .delete(schema.shiftInvites)
      .where(
        and(
          eq(schema.shiftInvites.userId, userId),
          inArray(
            schema.shiftInvites.shiftId,
            tx
              .select({ id: schema.shifts.id })
              .from(schema.shifts)
              .where(eq(schema.shifts.organizationUnitId, organizationUnitId)),
          ),
        ),
      );

    await tx
      .delete(schema.membershipRequests)
      .where(
        and(
          eq(schema.membershipRequests.userId, userId),
          eq(schema.membershipRequests.organizationUnitId, organizationUnitId),
        ),
      );
  }

  async removeMembershipRequest(
    id: string,
    userId: string,
  ): Promise<MembershipRequestEntity> {
    const [deleted] = await this.db
      .delete(schema.membershipRequests)
      .where(
        and(
          eq(schema.membershipRequests.id, id),
          eq(schema.membershipRequests.userId, userId),
        ),
      )
      .returning();

    if (!deleted) {
      throw new NotFoundGraphQLError('Membership request not found');
    }

    const orgUnit = await this.db.query.organizationUnits.findFirst({
      where: { id: deleted.organizationUnitId },
    });
    this.postHogService.capture({
      event: POSTHOG_EVENT.MEMBERSHIP_REQUEST_DELETE,
      userId,
      properties: {
        surface: POSTHOG_SURFACE.VOLUNTEERING,
        organization_id: orgUnit?.organizationId,
        organization_unit_id: deleted.organizationUnitId,
        membership_request_id: deleted.id,
      },
    });

    return deleted;
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
  ): Promise<MembershipRequestEntity[]> {
    return this.db.query.membershipRequests.findMany({
      where: { userId },
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
    intendedShiftInstanceId?: string,
    intendedEventId?: string,
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
        requirementProfile?: RequirementProfileEntity;
        requirementStatuses?: Array<{
          requirementId: string;
          name: string;
          status: string;
        }>;
        requiredForms?: RequiredFormStatus[];
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

    await this.formSubmissionService.shareSubmissionsWithOrgUnit(userId, {
      targetType: RequiredFormTargetType.ORGANIZATION_UNIT,
      targetId: organizationUnitId,
    });

    let requirementProfile: RequirementProfileEntity | undefined;
    let requirementStatuses:
      | Array<{ requirementId: string; name: string; status: string }>
      | undefined;

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
        requirementProfile = profile;
        requirementStatuses = statuses;
      }
    }

    const requiredFormStatuses =
      await this.requiredFormService.getRequiredFormStatuses(userId, {
        targetType: RequiredFormTargetType.ORGANIZATION_UNIT,
        targetId: organizationUnitId,
      });
    const missingForms = requiredFormStatuses.filter((s) => !s.submitted);

    if (requirementProfile || missingForms.length > 0) {
      this.postHogService.capture({
        event: POSTHOG_EVENT.MEMBERSHIP_REQUEST_START,
        userId,
        properties: {
          surface: POSTHOG_SURFACE.VOLUNTEERING,
          organization_id: orgUnit.organizationId ?? undefined,
          organization_unit_id: organizationUnitId,
        },
      });
      return {
        status: 'REQUIREMENTS_NEEDED',
        ...(requirementProfile && {
          requirementProfile,
          requirementStatuses,
        }),
        requiredForms: requiredFormStatuses,
      };
    }

    const existing = await this.db.query.membershipRequests.findFirst({
      where: {
        userId,
        organizationUnitId,
      },
    });

    if (existing) {
      if (existing.status === MembershipRequestStatus.PENDING) {
        if (intendedShiftInstanceId || intendedEventId || intendedShiftId) {
          const metadata = this.appendIntendedIdsToMetadata(
            (existing.metadata ?? {}) as MembershipRequestMetadata,
            intendedShiftInstanceId,
            intendedEventId,
            intendedShiftId,
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

      if (existing.status === MembershipRequestStatus.REJECTED) {
        this.postHogService.capture({
          event: POSTHOG_EVENT.MEMBERSHIP_REQUEST_REJECT,
          userId,
          properties: {
            surface: POSTHOG_SURFACE.VOLUNTEERING,
            organization_id: orgUnit.organizationId ?? undefined,
            organization_unit_id: organizationUnitId,
            membership_request_id: existing.id,
            source: 'self_join',
          },
        });
        return { status: JoinStatus.REJECTED, membershipRequest: existing };
      }

      if (existing.status === MembershipRequestStatus.CANCELLED) {
        return { status: JoinStatus.REJECTED, membershipRequest: existing };
      }

      return { status: JoinStatus.JOINED };
    }

    const request = await this.createMembershipRequest(
      userId,
      organizationUnitId,
      intendedShiftInstanceId,
      intendedEventId,
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

    if (updatedMembership.userId) {
      this.postHogService.capture({
        event: POSTHOG_EVENT.MEMBERSHIP_UPDATE,
        userId: updatedMembership.userId,
        properties: {
          surface: POSTHOG_SURFACE.BACKOFFICE,
          organization_id: organizationId,
          organization_unit_id:
            updatedMembership.organizationUnitId ?? undefined,
          membership_id: updatedMembership.id,
        },
      });
    }

    return updatedMembership;
  }
}

import { Args, Context, ID, Mutation, Resolver } from '@nestjs/graphql';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { plainToInstance } from 'class-transformer';
import { AuthService } from '../../auth/auth.service';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { ForbiddenGraphQLError } from '../../graphql/errors';
import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { RequiredFormRef } from '../../organization/models/organization-unit-required-form.model';
import { RequiredFormTargetType } from '../../requirement-profile/enums';
import { RequirementForm } from '../../requirement-profile/models/requirement-form.model';
import { RequirementProfile } from '../../requirement-profile/models/requirement-profile.model';
import { UserRequirementStatus } from '../../requirement-profile/models/user-requirement-status.model';
import { RequiredFormService } from '../../requirement-profile/services/required-form.service';
import { ShiftInviteStatus } from '../enums';
import { CreateShiftInput } from '../inputs/create-shift.input';
import { UpdateShiftInput } from '../inputs/update-shift.input';
import { ShiftMapper } from '../mappers/shift.mapper';
import { ShiftInstanceMapper } from '../mappers/shift-instance.mapper';
import { ShiftInstanceInviteMapper } from '../mappers/shift-instance-invite.mapper';
import { ShiftInviteMapper } from '../mappers/shift-invite.mapper';
import { JoinShiftInstanceResult } from '../models/join-shift-instance-result.model';
import { Shift } from '../models/shift.model';
import { ShiftInstance } from '../models/shift-instance.model';
import { ShiftInstanceInvite } from '../models/shift-instance-invite.model';
import { ShiftInvite } from '../models/shift-invite.model';
import { ShiftService } from '../shift.service';

@Resolver(() => Shift)
export class ShiftMutationResolver {
  constructor(
    private readonly shiftService: ShiftService,
    private readonly shiftMapper: ShiftMapper,
    private readonly shiftInstanceMapper: ShiftInstanceMapper,
    private readonly shiftInviteMapper: ShiftInviteMapper,
    private readonly shiftInstanceInviteMapper: ShiftInstanceInviteMapper,
    private readonly authService: AuthService,
    private readonly requiredFormService: RequiredFormService,
  ) {}

  private async assertCanManageInviteForUser(
    actorUserId: string,
    targetUserId: string,
    instanceId: string,
    organizationUnitId: string,
  ): Promise<void> {
    if (actorUserId === targetUserId) {
      return;
    }

    const hasPermission = await this.authService.hasRequiredPermissions(
      actorUserId,
      organizationUnitId,
      [PERMISSIONS.SHIFT_EDIT],
    );

    if (!hasPermission) {
      throw new ForbiddenGraphQLError(
        'You do not have permission to manage invites for other users',
      );
    }

    await this.shiftService.findInstanceById(instanceId, organizationUnitId);
  }

  @Permissions(PERMISSIONS.SHIFT_EDIT)
  @Mutation(() => Shift)
  async createShift(
    @Session() session: UserSession,
    @Args('input') input: CreateShiftInput,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<Shift> {
    const shift = await this.shiftService.create(
      session.user.id,
      context.organizationUnitId,
      input,
    );
    return this.shiftMapper.toModelOrThrow(shift);
  }

  @Permissions(PERMISSIONS.SHIFT_EDIT)
  @Mutation(() => Shift)
  async updateShift(
    @Session() session: UserSession,
    @Args('id', { type: () => String }) id: string,
    @Args('input') input: UpdateShiftInput,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<Shift> {
    const shift = await this.shiftService.update(
      session.user.id,
      id,
      context.organizationUnitId,
      input,
    );
    return this.shiftMapper.toModelOrThrow(shift);
  }

  @Permissions(PERMISSIONS.SHIFT_EDIT)
  @Mutation(() => ShiftInstance)
  async updateMembersForShiftInstance(
    @Args('instanceId', { type: () => String }) instanceId: string,
    @Args('memberIds', { type: () => [String] }) memberIds: string[],
    @Args('inviteToAllInstances', { type: () => Boolean, nullable: true })
    inviteToAllInstances: boolean | null | undefined,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<ShiftInstance> {
    const instance = await this.shiftService.updateMembersForShiftInstance(
      instanceId,
      memberIds,
      context.organizationUnitId,
      { inviteToAllInstances },
    );
    return this.shiftInstanceMapper.toModelOrThrow(instance);
  }

  @Permissions(PERMISSIONS.SHIFT_EDIT)
  @Mutation(() => Shift)
  async deleteShift(
    @Args('id', { type: () => String }) id: string,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<Shift> {
    const result = await this.shiftService.delete(
      id,
      context.organizationUnitId,
    );
    return this.shiftMapper.toModelOrThrow(result);
  }

  @Permissions(PERMISSIONS.SHIFT_EDIT)
  @Mutation(() => [RequiredFormRef])
  async setShiftRequiredForms(
    @Args('shiftId', { type: () => ID }) shiftId: string,
    @Args('formIds', { type: () => [String] }) formIds: string[],
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<RequiredFormRef[]> {
    await this.shiftService.findOrgUnitsShift(
      shiftId,
      context.organizationUnitId,
    );

    const requiredForms = await this.requiredFormService.setRequiredForms(
      { targetType: RequiredFormTargetType.SHIFT, targetId: shiftId },
      formIds,
    );

    return requiredForms.map(({ form, order }) => ({
      form: plainToInstance(RequirementForm, form),
      order,
    }));
  }

  @Mutation(() => JoinShiftInstanceResult)
  async joinShiftInstance(
    @Args('instanceId', { type: () => String }) instanceId: string,
    @Session() session: UserSession,
  ): Promise<JoinShiftInstanceResult> {
    const result = await this.shiftService.requestJoinShiftInstance(
      session.user.id,
      instanceId,
    );

    return {
      status: result.status,
      shiftInstance: this.shiftInstanceMapper.toModelOrThrow(
        result.shiftInstance,
      ),
      membershipRequestId: result.membershipRequest?.id ?? null,
      requirementProfile: result.requirementProfile
        ? plainToInstance(RequirementProfile, result.requirementProfile)
        : null,
      requirementStatuses:
        result.requirementStatuses?.map((s) =>
          plainToInstance(UserRequirementStatus, s),
        ) ?? null,
      requiredForms:
        result.requiredForms?.map((s) => ({
          form: plainToInstance(RequirementForm, s.form),
          order: s.order,
          submitted: s.submitted,
          submissionId: s.submissionId,
          targetType: s.targetType,
          targetId: s.targetId,
        })) ?? null,
    };
  }

  @Mutation(() => ShiftInvite)
  async updateShiftInviteStatus(
    @Session() session: UserSession,
    @Args('shiftId', { type: () => String }) shiftId: string,
    @Args('status', { type: () => ShiftInviteStatus })
    status: ShiftInviteStatus,
  ): Promise<ShiftInvite> {
    const invite = await this.shiftService.updateShiftInviteStatus(
      session.user.id,
      shiftId,
      status,
    );
    return this.shiftInviteMapper.toModelOrThrow(invite);
  }

  @Mutation(() => ShiftInstanceInvite)
  async updateShiftInstanceInviteStatus(
    @Session() session: UserSession,
    @Args('instanceId', { type: () => String }) instanceId: string,
    @Args('status', { type: () => ShiftInviteStatus })
    status: ShiftInviteStatus,
    @Args('userId', { type: () => String, nullable: true })
    userId: string | null | undefined,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<ShiftInstanceInvite> {
    const targetUserId = userId ?? session.user.id;

    await this.assertCanManageInviteForUser(
      session.user.id,
      targetUserId,
      instanceId,
      context.organizationUnitId,
    );

    const invite = await this.shiftService.updateShiftInstanceInviteStatus(
      targetUserId,
      instanceId,
      status,
    );
    return this.shiftInstanceInviteMapper.toModelOrThrow(invite);
  }
}

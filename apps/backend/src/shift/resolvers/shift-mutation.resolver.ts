import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { plainToInstance } from 'class-transformer';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { RequirementForm } from '../../requirement-profile/models/requirement-form.model';
import { RequirementProfile } from '../../requirement-profile/models/requirement-profile.model';
import { UserRequirementStatus } from '../../requirement-profile/models/user-requirement-status.model';
import { CreateShiftInput } from '../inputs/create-shift.input';
import { UpdateShiftInput } from '../inputs/update-shift.input';
import { ShiftMapper } from '../mappers/shift.mapper';
import { ShiftInstanceMapper } from '../mappers/shift-instance.mapper';
import { JoinShiftInstanceResult } from '../models/join-shift-instance-result.model';
import { Shift } from '../models/shift.model';
import { ShiftInstance } from '../models/shift-instance.model';
import { ShiftService } from '../shift.service';

@Resolver(() => Shift)
export class ShiftMutationResolver {
  constructor(
    private readonly shiftService: ShiftService,
    private readonly shiftMapper: ShiftMapper,
    private readonly shiftInstanceMapper: ShiftInstanceMapper,
  ) {}

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
    const instance =
      await this.shiftService.updateMembersForShiftWithAutoApproval(
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
        })) ?? null,
    };
  }
}

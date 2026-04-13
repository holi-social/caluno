import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { CreateShiftInput } from '../inputs/create-shift.input';
import { UpdateShiftInput } from '../inputs/update-shift.input';
import { ShiftMapper } from '../mappers/shift.mapper';
import { Shift } from '../models/shift.model';
import { ShiftService } from '../shift.service';

@Resolver(() => Shift)
export class ShiftMutationResolver {
  constructor(
    private readonly shiftService: ShiftService,
    private readonly shiftMapper: ShiftMapper,
  ) {}

  @Permissions(PERMISSIONS.SHIFT_CREATE)
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

  @Permissions(PERMISSIONS.SHIFT_UPDATE)
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

  @Permissions(PERMISSIONS.SHIFT_UPDATE)
  @Mutation(() => Shift)
  async inviteMembersToShift(
    @Args('shiftId', { type: () => String }) shiftId: string,
    @Args('memberIds', { type: () => [String] }) memberIds: string[],
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<Shift> {
    const shift = await this.shiftService.inviteMembersToShiftWithAutoApproval(
      shiftId,
      memberIds,
      context.organizationUnitId,
    );
    return this.shiftMapper.toModelOrThrow(shift);
  }

  @Permissions(PERMISSIONS.SHIFT_DELETE)
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
}

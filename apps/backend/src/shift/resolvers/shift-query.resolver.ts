import { Args, Context, ID, Query, Resolver } from '@nestjs/graphql';
import {
  AllowAnonymous,
  Session,
  type UserSession,
} from '@thallesp/nestjs-better-auth';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { PaginationInput } from '../../graphql/pagination.input';
import { UserMapper } from '../../user/mappers/user.mapper';
import { User } from '../../user/models/user.model';
import { ShiftMapper } from '../mappers/shift.mapper';
import { ShiftInstanceMapper } from '../mappers/shift-instance.mapper';
import { Shift, ShiftPaginatedResponse } from '../models/shift.model';
import {
  ShiftInstance,
  ShiftInstancePaginatedResponse,
} from '../models/shift-instance.model';
import { ShiftService } from '../shift.service';

@Resolver(() => Shift)
export class ShiftQueryResolver {
  constructor(
    private readonly shiftService: ShiftService,
    private readonly shiftMapper: ShiftMapper,
    private readonly shiftInstanceMapper: ShiftInstanceMapper,
    private readonly userMapper: UserMapper,
  ) {}

  @AllowAnonymous()
  @Query(() => Shift)
  async shift(
    @Args('id') id: string,
    @Session() session: UserSession,
  ): Promise<Shift> {
    const shift = await this.shiftService.findById(id);
    return this.shiftMapper.toModelOrThrow(shift);
  }

  @Query(() => ShiftPaginatedResponse)
  async shifts(
    @Args() pagination: PaginationInput,
    @Session() session: UserSession,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<ShiftPaginatedResponse> {
    const { shifts, total } = await this.shiftService.findAll(
      session.user.id,
      context.organizationUnitId,
      pagination,
    );
    return new ShiftPaginatedResponse({
      items: this.shiftMapper.toArray(shifts),
      total: total,
      limit: pagination.limit,
      offset: pagination.offset,
    });
  }

  @Permissions(PERMISSIONS.SHIFT_VIEW)
  @Query(() => [ShiftInstance])
  async activeShifts(
    @Context() context: AuthenticatedGraphQLContext,
    @Args('userId') userId: string,
  ): Promise<ShiftInstance[]> {
    const instances = await this.shiftService.findActiveShifts(
      context.organizationUnitId,
      userId,
    );

    return this.shiftInstanceMapper.toArray(instances);
  }

  @Permissions(PERMISSIONS.SHIFT_VIEW)
  @Query(() => [ShiftInstance])
  async shiftInstances(
    @Args('shiftId', { type: () => ID }) shiftId: string,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<ShiftInstance[]> {
    const instances = await this.shiftService.findInstances(
      shiftId,
      context.organizationUnitId,
    );
    return this.shiftInstanceMapper.toArray(instances);
  }

  @Permissions(PERMISSIONS.SHIFT_VIEW)
  @Query(() => [User])
  async shiftVolunteers(
    @Args('instanceId', { type: () => ID }) instanceId: string,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<User[]> {
    const volunteers = await this.shiftService.findVolunteers(
      instanceId,
      context.organizationUnitId,
    );
    return this.userMapper.toArray(volunteers);
  }

  @Permissions(PERMISSIONS.SHIFT_VIEW)
  @Query(() => [ShiftInstance])
  async weeklyShifts(
    @Args('from', { type: () => Date }) from: Date,
    @Args('to', { type: () => Date }) to: Date,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<ShiftInstance[]> {
    const instances = await this.shiftService.findShiftsForWeek(
      context.organizationUnitId,
      from,
      to,
    );
    return this.shiftInstanceMapper.toArray(instances);
  }
}

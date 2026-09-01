import { Args, Context, ID, Query, Resolver } from '@nestjs/graphql';
import {
  AllowAnonymous,
  Session,
  type UserSession,
} from '@thallesp/nestjs-better-auth';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import {
  DateRangePaginationInput,
  PaginationInput,
} from '../../graphql/pagination.input';
import { UserMapper } from '../../user/mappers/user.mapper';
import { User } from '../../user/models/user.model';
import { ShiftInviteStatus, SortOrder } from '../enums';
import { ShiftMapper } from '../mappers/shift.mapper';
import { ShiftInstanceMapper } from '../mappers/shift-instance.mapper';
import { Shift, ShiftPaginatedResponse } from '../models/shift.model';
import {
  ShiftInstance,
  ShiftInstancePaginatedResponse,
} from '../models/shift-instance.model';
import { ShiftInstancesByMaster } from '../models/shift-instances-by-master.model';
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
  async shift(@Args('id') id: string): Promise<Shift> {
    const shift = await this.shiftService.findById(id);
    return this.shiftMapper.toModelOrThrow(shift);
  }

  @Permissions(PERMISSIONS.SHIFT_VIEW)
  @Query(() => ShiftInstance)
  async shiftInstance(
    @Args('id', { type: () => ID }) id: string,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<ShiftInstance> {
    const shiftInstance = await this.shiftService.findInstanceById(
      id,
      context.organizationUnitId,
    );
    return this.shiftInstanceMapper.toModelOrThrow(shiftInstance);
  }

  @AllowAnonymous()
  @Query(() => [ShiftInstance])
  async publicShiftInstances(
    @Args('shiftId', { type: () => ID }) shiftId: string,
  ): Promise<ShiftInstance[]> {
    const instances =
      await this.shiftService.findPublicInstancesByShiftId(shiftId);
    return this.shiftInstanceMapper.toArray(instances);
  }

  @AllowAnonymous()
  @Query(() => ShiftInstance)
  async publicShiftInstance(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<ShiftInstance> {
    const instance = await this.shiftService.findPublicInstance(id);
    return this.shiftInstanceMapper.toModelOrThrow(instance);
  }

  @AllowAnonymous()
  @Query(() => [Shift])
  async publicShiftsByOrganizationUnit(
    @Args('organizationUnitId', { type: () => ID }) organizationUnitId: string,
  ): Promise<Shift[]> {
    const shifts =
      await this.shiftService.findIndividualShiftsByOrgUnit(organizationUnitId);
    return this.shiftMapper.toArray(shifts);
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
  async activeShiftInstances(
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<ShiftInstance[]> {
    const instances = await this.shiftService.findActiveShiftInstances(
      context.organizationUnitId,
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
  @Query(() => [ShiftInstancesByMaster])
  async shiftInstancesByMasterIds(
    @Args('masterIds', { type: () => [ID] }) masterIds: string[],
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<ShiftInstancesByMaster[]> {
    const instancesByMasterId =
      await this.shiftService.findInstancesByMasterIds(
        masterIds,
        context.organizationUnitId,
      );
    return [...instancesByMasterId.entries()].map(([masterId, instances]) => ({
      masterId,
      instances: this.shiftInstanceMapper.toArray(instances),
    }));
  }

  @Permissions(PERMISSIONS.SHIFT_VIEW)
  @Query(() => [User])
  async shiftVolunteers(
    @Args('instanceId', { type: () => ID }) instanceId: string,
    @Args('statuses', { type: () => [ShiftInviteStatus], nullable: true })
    statuses: ShiftInviteStatus[] | null | undefined,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<User[]> {
    const volunteers = await this.shiftService.findVolunteers(
      instanceId,
      context.organizationUnitId,
      statuses ?? undefined,
    );
    return this.userMapper.toArray(volunteers);
  }

  @Permissions(PERMISSIONS.SHIFT_VIEW)
  @Query(() => [ShiftInstance])
  async weeklyShifts(
    @Args() pagination: DateRangePaginationInput,
    @Args('eventId', { type: () => ID, nullable: true })
    eventId: string | null | undefined,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<ShiftInstance[]> {
    const instances = await this.shiftService.findInstancesForOrgUnitInRange(
      context.organizationUnitId,
      pagination.startsAfter,
      pagination.endsBefore,
      eventId,
    );
    return this.shiftInstanceMapper.toArray(instances);
  }

  // Check-in surface: `check-in:manage` is a separate permission from
  // `shift:view`, and the guard requires every listed permission, so a
  // front-desk admin cannot use `weeklyShifts`. Scoped by the header unit
  // like every other query here.
  @Permissions(PERMISSIONS.CHECK_IN_MANAGE)
  @Query(() => [ShiftInstance])
  async checkInShiftInstances(
    @Args() pagination: DateRangePaginationInput,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<ShiftInstance[]> {
    const instances = await this.shiftService.findInstancesForOrgUnitInRange(
      context.organizationUnitId,
      pagination.startsAfter,
      pagination.endsBefore,
    );
    return this.shiftInstanceMapper.toArray(instances);
  }

  @Query(() => ShiftInstancePaginatedResponse)
  async myShiftInstances(
    @Args('includePast', { type: () => Boolean, defaultValue: false })
    includePast: boolean,
    @Args() pagination: DateRangePaginationInput,
    @Args('order', { type: () => SortOrder, defaultValue: SortOrder.ASC })
    order: SortOrder,
    @Args('statuses', { type: () => [ShiftInviteStatus], nullable: true })
    statuses: ShiftInviteStatus[] | null | undefined,
    @Args('includeIntended', {
      type: () => Boolean,
      defaultValue: false,
      nullable: true,
    })
    includeIntended: boolean | undefined,
    @Session() session: UserSession,
  ): Promise<ShiftInstancePaginatedResponse> {
    const { instances, total } = await this.shiftService.findMyShiftInstances(
      session.user.id,
      includePast,
      pagination.startsAfter,
      pagination.endsBefore,
      pagination.limit,
      pagination.offset,
      order,
      statuses ?? undefined,
      includeIntended ?? false,
    );
    return new ShiftInstancePaginatedResponse({
      items: this.shiftInstanceMapper.toArray(instances),
      total,
      limit: pagination.limit,
      offset: pagination.offset,
    });
  }

  @Query(() => ShiftInstancePaginatedResponse)
  async availableShiftInstances(
    @Args() pagination: DateRangePaginationInput,
    @Args('organizationUnitIds', { type: () => [ID], nullable: true })
    organizationUnitIds: string[] | null,
    @Session() session: UserSession,
  ): Promise<ShiftInstancePaginatedResponse> {
    const { instances, total } =
      await this.shiftService.findAvailableShiftInstances(
        session.user.id,
        pagination.startsAfter,
        pagination.endsBefore,
        organizationUnitIds,
        pagination.limit,
        pagination.offset,
      );
    return new ShiftInstancePaginatedResponse({
      items: this.shiftInstanceMapper.toArray(instances),
      total,
      limit: pagination.limit,
      offset: pagination.offset,
    });
  }
}

import { Args, Context, Query, Resolver } from '@nestjs/graphql';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { PaginationInput } from '../../graphql/pagination.input';
import { ShiftMapper } from '../mappers/shift.mapper';
import { ShiftInstanceMapper } from '../mappers/shift-instance.mapper';
import { Shift, ShiftPaginatedResponse } from '../models/shift.model';
import { ShiftInstancePaginatedResponse } from '../models/shift-instance.model';
import { ShiftService } from '../shift.service';

@Resolver(() => Shift)
export class ShiftQueryResolver {
  constructor(
    private readonly shiftService: ShiftService,
    private readonly shiftMapper: ShiftMapper,
    private readonly shiftInstanceMapper: ShiftInstanceMapper,
  ) {}

  @AllowAnonymous()
  @Query(() => Shift)
  async shift(@Args('id') id: string): Promise<Shift> {
    const shift = await this.shiftService.findByIdPublic(id);
    if (!shift) {
      throw new Error('Shift not found');
    }
    return this.shiftMapper.toModelOrThrow(shift);
  }

  @Permissions(PERMISSIONS.SHIFT_READ)
  @Query(() => ShiftPaginatedResponse)
  async shifts(
    @Args() pagination: PaginationInput,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<ShiftPaginatedResponse> {
    const { items, total } = await this.shiftService.findAll(
      context.organizationUnitId,
      pagination,
    );
    return new ShiftPaginatedResponse({
      items: this.shiftMapper.toArray(items),
      total: total,
      limit: pagination.limit,
      offset: pagination.offset,
    });
  }

  @Permissions(PERMISSIONS.SHIFT_READ)
  @Query(() => ShiftInstancePaginatedResponse)
  async activeShifts(
    @Args() pagination: PaginationInput,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<ShiftInstancePaginatedResponse> {
    const { instances, total } = await this.shiftService.findActiveShifts(
      context.organizationUnitId,
      pagination,
    );

    return new ShiftInstancePaginatedResponse({
      items: this.shiftInstanceMapper.toArray(instances),
      total: total,
      limit: pagination.limit,
      offset: pagination.offset,
    });
  }
}

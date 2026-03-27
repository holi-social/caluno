import { Args, Context, Query, Resolver } from '@nestjs/graphql';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { PaginationInput } from '../../graphql/pagination.input';
import { ShiftMapper } from '../mappers/shift.mapper';
import { Shift, ShiftPaginatedResponse } from '../models/shift.model';
import { ShiftService } from '../shift.service';

@Resolver(() => Shift)
export class ShiftQueryResolver {
  constructor(
    private readonly shiftService: ShiftService,
    private readonly shiftMapper: ShiftMapper,
  ) {}

  @AllowAnonymous()
  @Query(() => Shift)
  async shift(@Args('id') id: string): Promise<Shift> {
    const shift = await this.shiftService.findById(id);
    return this.shiftMapper.toModelOrThrow(shift);
  }

  @Permissions(PERMISSIONS.SHIFT_READ)
  @Query(() => ShiftPaginatedResponse)
  async shifts(
    @Args() pagination: PaginationInput,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<ShiftPaginatedResponse> {
    const { shifts, total } = await this.shiftService.findAll(
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

  @Permissions(PERMISSIONS.SHIFT_READ)
  @Query(() => ShiftPaginatedResponse)
  async activeShifts(
    @Args() pagination: PaginationInput,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<ShiftPaginatedResponse> {
    const { shifts, total } = await this.shiftService.findActiveShifts(
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
}

import { Args, Query, Resolver } from '@nestjs/graphql';
import type { PaginationInput } from 'src/graphql/pagination.input';
import type { ShiftMapper } from '../mappers/shift.mapper';
import { Shift, ShiftPaginatedResponse } from '../models/shift.model';
import type { ShiftService } from '../shift.service';

@Resolver(() => Shift)
export class ShiftQueryResolver {
  constructor(
    private readonly shiftService: ShiftService,
    private readonly shiftMapper: ShiftMapper,
  ) {}

  @Query(() => Shift)
  async shift(@Args('id') id: string): Promise<Shift | null> {
    const shift = await this.shiftService.findById(id);
    return this.shiftMapper.toModel(shift);
  }

  @Query(() => ShiftPaginatedResponse)
  async shifts(
    @Args() pagination: PaginationInput,
  ): Promise<ShiftPaginatedResponse> {
    const { shifts, total } = await this.shiftService.findAll(pagination);
    return new ShiftPaginatedResponse({
      items: this.shiftMapper.toArray(shifts),
      total: total,
      limit: pagination.limit,
      offset: pagination.offset,
    });
  }
}

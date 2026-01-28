import { Args, Query, Resolver } from '@nestjs/graphql';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PaginationInput } from 'src/graphql/pagination.input';
import { ShiftMapper } from '../mappers/shift.mapper';
import { Shift, ShiftPaginatedResponse } from '../models/shift.model';
import { ShiftService } from '../shift.service';

@Resolver(() => Shift)
export class ShiftQueryResolver {
  constructor(
    private readonly shiftService: ShiftService,
    private readonly shiftMapper: ShiftMapper,
  ) {}

  @Roles('MEMBER')
  @Query(() => Shift)
  async shift(@Args('id') id: string): Promise<Shift | null> {
    const shift = await this.shiftService.findById(id);
    return this.shiftMapper.toModel(shift);
  }

  @Roles('MEMBER')
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

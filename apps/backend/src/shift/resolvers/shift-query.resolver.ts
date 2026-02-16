import { Args, Context, Query, Resolver } from '@nestjs/graphql';
import {
  AllowAnonymous,
  Session,
  type UserSession,
} from '@thallesp/nestjs-better-auth';
import { Roles } from 'src/auth/decorators/roles.decorator';
import type { AuthenticatedGraphQLContext } from 'src/graphql/graphql.context';
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

  @AllowAnonymous()
  @Query(() => Shift)
  async shift(@Args('id') id: string): Promise<Shift> {
    const shift = await this.shiftService.findById(id);
    return this.shiftMapper.toModelOrThrow(shift);
  }

  @Roles('MEMBER')
  @Query(() => ShiftPaginatedResponse)
  async shifts(
    @Args() pagination: PaginationInput,
    @Session() session: UserSession,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<ShiftPaginatedResponse> {
    const { shifts, total } = await this.shiftService.findAll(
      session.user.id,
      context.organizationId,
      null,
      pagination,
    );
    return new ShiftPaginatedResponse({
      items: this.shiftMapper.toArray(shifts),
      total: total,
      limit: pagination.limit,
      offset: pagination.offset,
    });
  }

  @Roles('MEMBER')
  @Query(() => ShiftPaginatedResponse)
  async shiftsByProjectId(
    @Args('projectId') projectId: string,
    @Args() pagination: PaginationInput,
    @Session() session: UserSession,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<ShiftPaginatedResponse> {
    const { shifts, total } = await this.shiftService.findAll(
      session.user.id,
      context.organizationId,
      projectId,
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

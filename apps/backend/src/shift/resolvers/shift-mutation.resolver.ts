import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { Roles } from 'src/auth/decorators/roles.decorator';
import type { AuthenticatedGraphQLContext } from 'src/graphql/graphql.context';
import { CreateShiftInput } from '../inputs/create-shift.input';
import { ShiftMapper } from '../mappers/shift.mapper';
import { Shift } from '../models/shift.model';
import { ShiftService } from '../shift.service';

@Resolver(() => Shift)
export class ShiftMutationResolver {
  constructor(
    private readonly shiftService: ShiftService,
    private readonly shiftMapper: ShiftMapper,
  ) {}

  @Roles('STAFF')
  @Mutation(() => Shift)
  async createShift(
    @Session() session: UserSession,
    @Args('input') input: CreateShiftInput,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<Shift> {
    const shift = await this.shiftService.create(
      session.user.id,
      context.organizationId,
      input,
    );
    return this.shiftMapper.toModelOrThrow(shift);
  }
}

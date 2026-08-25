import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { Loader } from '../../graphql/decorators';
import { Shift } from '../../shift/models/shift.model';
import type { ShiftEntity } from '../../shift/schemas/shift.schema';
import { Event } from '../models/event.model';
import { ShiftEventLoader } from './shift-event.loader';

@Resolver(() => Shift)
export class ShiftEventFieldResolver {
  @AllowAnonymous()
  @ResolveField(() => Event, { nullable: true })
  async event(
    @Parent() shift: ShiftEntity,
    @Loader(ShiftEventLoader) loader: ShiftEventLoader,
  ): Promise<Event | null> {
    if (!shift.eventId) {
      return null;
    }

    return loader.eventById.load(shift.eventId);
  }
}

import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { ShiftMapper } from '../../shift/mappers/shift.mapper';
import { Shift } from '../../shift/models/shift.model';
import { TimeEntryMapper } from '../mappers/time-entry.mapper';
import { TimeEntry } from '../models/time-entry.model';
import { VolunteerSession } from '../models/volunteer-session.model';
import * as volunteerSessionSchema from '../schemas/volunteer-session.schema';
import { TimeTrackingService } from '../time-tracking.service';

@Resolver(() => VolunteerSession)
export class VolunteerSessionFieldResolver {
  constructor(
    private readonly timeTrackingService: TimeTrackingService,
    private readonly entryMapper: TimeEntryMapper,

    private readonly shiftMapper: ShiftMapper,
  ) {}

  @Permissions(PERMISSIONS.VOLUNTEER_SESSION_READ)
  @ResolveField(() => [TimeEntry])
  async entries(
    @Parent() volunteerSession: volunteerSessionSchema.VolunteerSessionEntity,
    @Session() session: UserSession,
  ): Promise<TimeEntry[]> {
    //  TODO: get time entries for org
    return this.entryMapper.toArray([]);
  }

  @Permissions(PERMISSIONS.VOLUNTEER_SESSION_READ)
  @ResolveField(() => Shift, { nullable: true })
  async shift(
    @Parent() volunteerSession: volunteerSessionSchema.VolunteerSessionEntity,
  ): Promise<Shift | null> {
    const shift = await this.timeTrackingService.findShiftBySessionId(
      volunteerSession.id,
    );
    if (!shift) {
      return null;
    }
    return this.shiftMapper.toModel(shift);
  }
}

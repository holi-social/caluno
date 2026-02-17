import { Args, Context, Query, Resolver } from '@nestjs/graphql';
import { Roles } from 'src/auth/decorators/roles.decorator';
import type { AuthenticatedGraphQLContext } from 'src/graphql/graphql.context';
import { VolunteerSessionStatus } from '../enums';
import { VolunteerSessionMapper } from '../mappers/volunteer-session.mapper';
import { VolunteerSession } from '../models/volunteer-session.model';
import { TimeTrackingService } from '../time-tracking.service';

@Resolver()
export class TimeTrackingQueryResolver {
  constructor(
    private readonly timeTrackingService: TimeTrackingService,
    private readonly volunteerSessionMapper: VolunteerSessionMapper,
  ) {}

  @Roles('MEMBER')
  @Query(() => [VolunteerSession])
  async volunteerSessions(
    @Args('status', { type: () => VolunteerSessionStatus, nullable: true })
    status: VolunteerSessionStatus | null,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<VolunteerSession[]> {
    const sessions = await this.timeTrackingService.findAll(
      context.organizationId,
      status ?? undefined,
    );
    return this.volunteerSessionMapper.toArray(sessions);
  }
}

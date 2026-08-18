import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { RegisterLoader } from '../../graphql/interceptors';
import { EventService } from '../event.service';

@RegisterLoader()
@Injectable({ scope: Scope.REQUEST })
export class EventInviteCountLoader {
  constructor(private readonly eventService: EventService) {}

  public readonly countByEventId = new DataLoader<string, number>(
    async (eventIds: readonly string[]) => {
      const results = await this.eventService.countInvitesByEventIds(
        eventIds as string[],
      );

      const countsByEventId = new Map(
        results.map((row) => [row.eventId, row.count]),
      );

      return eventIds.map((eventId) => countsByEventId.get(eventId) ?? 0);
    },
  );
}

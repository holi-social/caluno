import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { RegisterLoader } from '../../graphql/interceptors';
import { EventService } from '../event.service';
import { EventMapper } from '../mappers/event.mapper';
import type { Event } from '../models/event.model';

@RegisterLoader()
@Injectable({ scope: Scope.REQUEST })
export class ShiftEventLoader {
  constructor(
    private readonly eventService: EventService,
    private readonly eventMapper: EventMapper,
  ) {}

  // Many shifts share an event, so DataLoader dedups the repeated ids.
  public readonly eventById = new DataLoader<string, Event | null>((eventIds) =>
    settleEach(eventIds, async (id) => {
      const event = await this.eventService.findByIdPublic(id);
      return event ? this.eventMapper.toModelOrThrow(event) : null;
    }),
  );
}

async function settleEach<T>(
  ids: readonly string[],
  load: (id: string) => Promise<T>,
): Promise<(T | Error)[]> {
  return Promise.all(
    ids.map(async (id) => {
      try {
        return await load(id);
      } catch (error) {
        return error instanceof Error ? error : new Error(String(error));
      }
    }),
  );
}

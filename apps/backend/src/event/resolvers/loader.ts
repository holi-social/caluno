import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { RegisterLoader } from '../../graphql/interceptors';
import { ShiftMapper } from '../../shift/mappers/shift.mapper';
import type { Shift } from '../../shift/models/shift.model';
import { ShiftService } from '../../shift/shift.service';

@RegisterLoader()
@Injectable({ scope: Scope.REQUEST })
export class EventShiftsLoader {
  constructor(
    private readonly shiftService: ShiftService,
    private readonly shiftMapper: ShiftMapper,
  ) {}

  public readonly shiftsByEventId = new DataLoader<string, Shift[]>(
    async (eventIds: readonly string[]) => {
      const results = await Promise.all(
        eventIds.map((eventId) => this.shiftService.findByEventId(eventId)),
      );
      return eventIds.map((_, i) => this.shiftMapper.toArray(results[i] ?? []));
    },
  );

  public readonly countByEventId = new DataLoader<string, number>(
    async (eventIds: readonly string[]) => {
      const counts = await Promise.all(
        eventIds.map((eventId) => this.shiftService.countByEventId(eventId)),
      );
      return counts;
    },
  );
}

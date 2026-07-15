import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { RegisterLoader } from '../../graphql/interceptors';
import { ShiftMapper } from '../../shift/mappers/shift.mapper';
import type { Shift } from '../../shift/models/shift.model';
import { ShiftEntity } from '../../shift/schemas/shift.schema';
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
      const shifts = await this.shiftService.findByEventIds(
        eventIds as string[],
      );
      const shiftsByEventId = new Map<string, ShiftEntity[]>();
      for (const shift of shifts) {
        if (shift.eventId) {
          const existingUnits = shiftsByEventId.get(shift.eventId) ?? [];
          existingUnits.push(shift);
          shiftsByEventId.set(shift.eventId, existingUnits);
        }
      }
      return eventIds.map((eventId) => {
        return this.shiftMapper.toArray(shiftsByEventId.get(eventId) ?? []);
      });
    },
  );

  public readonly countByEventId = new DataLoader<string, number>(
    async (eventIds: readonly string[]) => {
      const results = await this.shiftService.countByEventIds(
        eventIds as string[],
      );

      const countsByEventId = new Map(
        results.map((row) => [row.eventId, row.count]),
      );

      return eventIds.map((eventId) => countsByEventId.get(eventId) ?? 0);
    },
  );
}

import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { RegisterLoader } from '../../graphql/interceptors';
import { ShiftVisibility } from '../../shift/enums';
import { ShiftMapper } from '../../shift/mappers/shift.mapper';
import type { Shift } from '../../shift/models/shift.model';
import { ShiftEntity } from '../../shift/schemas/shift.schema';
import { ShiftService } from '../../shift/shift.service';

type EventShiftsKey = {
  eventId: string;
  userId?: string;
};

@RegisterLoader()
@Injectable({ scope: Scope.REQUEST })
export class EventShiftsLoader {
  constructor(
    private readonly shiftService: ShiftService,
    private readonly shiftMapper: ShiftMapper,
  ) {}

  public readonly shiftsByEventId = new DataLoader<
    EventShiftsKey,
    Shift[],
    string
  >(
    async (keys: readonly EventShiftsKey[]) => {
      const eventIds = [...new Set(keys.map((key) => key.eventId))];
      const userId = keys[0]?.userId;
      const shifts = await this.shiftService.findByEventIds(eventIds);

      const privateShiftIds = shifts
        .filter((shift) => shift.visibility === ShiftVisibility.INVITED_MEMBERS)
        .map((shift) => shift.id);
      const invitedShiftIds = new Set(
        userId
          ? await this.shiftService.findInvitedShiftIds(privateShiftIds, userId)
          : [],
      );

      const visibleShiftsByEventId = new Map<string, ShiftEntity[]>();
      for (const shift of shifts) {
        if (
          shift.visibility === ShiftVisibility.INVITED_MEMBERS &&
          !invitedShiftIds.has(shift.id)
        ) {
          continue;
        }
        if (!shift.eventId) {
          continue;
        }
        const existing = visibleShiftsByEventId.get(shift.eventId) ?? [];
        existing.push(shift);
        visibleShiftsByEventId.set(shift.eventId, existing);
      }

      return eventIds.map((eventId) =>
        this.shiftMapper.toArray(visibleShiftsByEventId.get(eventId) ?? []),
      );
    },
    { cacheKeyFn: (key) => `${key.eventId}:${key.userId ?? ''}` },
  );

  public readonly countByEventId = new DataLoader<
    EventShiftsKey,
    number,
    string
  >(
    async (keys: readonly EventShiftsKey[]) => {
      const shifts = await this.shiftsByEventId.loadMany(keys);
      return shifts.map((shiftOrError) =>
        Array.isArray(shiftOrError) ? shiftOrError.length : 0,
      );
    },
    { cacheKeyFn: (key) => `${key.eventId}:${key.userId ?? ''}` },
  );
}

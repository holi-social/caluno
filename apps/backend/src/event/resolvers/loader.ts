import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { RegisterLoader } from '../../graphql/interceptors';
import { MembershipService } from '../../membership/membership.service';
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
    private readonly membershipService: MembershipService,
  ) {}
  private readonly activeInstanceCounts = new Map<string, number>();

  public readonly shiftsByEventId = new DataLoader<
    EventShiftsKey,
    Shift[],
    string
  >(
    async (keys: readonly EventShiftsKey[]) => {
      const eventIds = [...new Set(keys.map((key) => key.eventId))];
      const userId = keys[0]?.userId;
      const shifts = await this.shiftService.findByEventIds(eventIds);

      // Members-only shifts are hidden from non-members; any member
      // (volunteer or admin) of the shift's org unit or an ancestor sees them.
      const privateOrgUnitIds = [
        ...new Set(
          shifts
            .filter(
              (shift) => shift.visibility === ShiftVisibility.INVITED_MEMBERS,
            )
            .map((shift) => shift.organizationUnitId),
        ),
      ];

      const memberOrgUnitIds = new Set(
        userId
          ? (
              await Promise.all(
                privateOrgUnitIds.map(async (organizationUnitId) => ({
                  organizationUnitId,
                  isMember:
                    await this.membershipService.isMemberOfUnitOrAncestor(
                      userId,
                      organizationUnitId,
                    ),
                })),
              )
            )
              .filter((result) => result.isMember)
              .map((result) => result.organizationUnitId)
          : [],
      );

      const visibleShiftsByEventId = new Map<string, ShiftEntity[]>();
      for (const shift of shifts) {
        if (
          shift.visibility === ShiftVisibility.INVITED_MEMBERS &&
          !memberOrgUnitIds.has(shift.organizationUnitId)
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

      const visibleShifts = [...visibleShiftsByEventId.values()].flat();
      const instanceCounts =
        await this.shiftService.countActiveInstancesByMasterIds(
          visibleShifts.map((shift) => shift.id),
        );
      for (const [shiftId, count] of instanceCounts) {
        this.activeInstanceCounts.set(shiftId, count);
      }
      const liveShiftIds = new Set(
        visibleShifts
          .filter((shift) => (instanceCounts.get(shift.id) ?? 0) > 0)
          .map((shift) => shift.id),
      );

      return eventIds.map((eventId) =>
        this.shiftMapper.toArray(
          (visibleShiftsByEventId.get(eventId) ?? []).filter((shift) =>
            liveShiftIds.has(shift.id),
          ),
        ),
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
      const shiftsPerEvent = await this.shiftsByEventId.loadMany(keys);

      return shiftsPerEvent.map((shiftOrError) =>
        Array.isArray(shiftOrError)
          ? shiftOrError.reduce(
              (total, shift) =>
                total + (this.activeInstanceCounts.get(shift.id) ?? 0),
              0,
            )
          : 0,
      );
    },
    { cacheKeyFn: (key) => `${key.eventId}:${key.userId ?? ''}` },
  );
}

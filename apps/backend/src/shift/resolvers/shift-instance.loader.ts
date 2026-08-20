import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { RegisterLoader } from '../../graphql/interceptors';
import { ShiftInviteStatus } from '../enums';
import type { ShiftInstanceEntity } from '../schemas/shift-instance.schema';
import { ShiftService } from '../shift.service';

@RegisterLoader()
@Injectable({ scope: Scope.REQUEST })
export class ShiftInstanceLoader {
  constructor(private readonly shiftService: ShiftService) {}

  public readonly filledCountByInstanceId = new DataLoader<string, number>(
    async (instanceIds) => {
      const counts = await this.shiftService.getFilledCounts(
        instanceIds as string[],
      );
      return instanceIds.map((id) => counts.get(id) ?? 0);
    },
  );

  public readonly instancesByShiftId = new DataLoader<
    string,
    ShiftInstanceEntity[]
  >(async (shiftIds) => {
    const rows = await this.shiftService.findPublicInstancesByShiftIds(
      shiftIds as string[],
    );
    const byShiftId = new Map<string, ShiftInstanceEntity[]>();
    for (const row of rows) {
      const list = byShiftId.get(row.masterId) ?? [];
      list.push(row);
      byShiftId.set(row.masterId, list);
    }
    return shiftIds.map((id) => byShiftId.get(id) ?? []);
  });

  // Keyed by `${instanceId}::${userId}` so the loader stays stateless — the
  // current user is otherwise not a DataLoader key.
  public readonly isCheckedInByKey = new DataLoader<string, boolean>(
    async (keys) => {
      const parsed = keys.map((key) => {
        const sep = key.lastIndexOf('::');
        return { instanceId: key.slice(0, sep), userId: key.slice(sep + 2) };
      });

      const instancesByUser = new Map<string, string[]>();
      for (const { instanceId, userId } of parsed) {
        const list = instancesByUser.get(userId) ?? [];
        list.push(instanceId);
        instancesByUser.set(userId, list);
      }

      const openKeys = new Set<string>();
      for (const [userId, instanceIds] of instancesByUser) {
        const entries = await this.shiftService.findOpenTimeEntriesForUser(
          userId,
          instanceIds,
        );
        for (const entry of entries) {
          openKeys.add(`${entry.shiftInstanceId}::${userId}`);
        }
      }

      return keys.map((key) => openKeys.has(key));
    },
  );

  // Keyed by `${instanceId}::${userId}`; null when the user has no direct invite.
  public readonly myInviteStatusByKey = new DataLoader<
    string,
    ShiftInviteStatus | null
  >(async (keys) => {
    const parsed = keys.map((key) => {
      const sep = key.lastIndexOf('::');
      return { instanceId: key.slice(0, sep), userId: key.slice(sep + 2) };
    });

    const instancesByUser = new Map<string, string[]>();
    for (const { instanceId, userId } of parsed) {
      const list = instancesByUser.get(userId) ?? [];
      list.push(instanceId);
      instancesByUser.set(userId, list);
    }

    const statusByKey = new Map<string, ShiftInviteStatus>();
    for (const [userId, instanceIds] of instancesByUser) {
      const rows = await this.shiftService.findInviteStatusesForUser(
        userId,
        instanceIds,
      );
      for (const row of rows) {
        statusByKey.set(`${row.shiftInstanceId}::${userId}`, row.status);
      }
    }

    return keys.map((key) => statusByKey.get(key) ?? null);
  });

  // Keyed by `${instanceId}::${userId}`; null when the user has no direct invite.
  public readonly myInvitedAtByKey = new DataLoader<string, Date | null>(
    async (keys) => {
      const parsed = keys.map((key) => {
        const sep = key.lastIndexOf('::');
        return { instanceId: key.slice(0, sep), userId: key.slice(sep + 2) };
      });

      const instancesByUser = new Map<string, string[]>();
      for (const { instanceId, userId } of parsed) {
        const list = instancesByUser.get(userId) ?? [];
        list.push(instanceId);
        instancesByUser.set(userId, list);
      }

      const createdAtByKey = new Map<string, Date>();
      for (const [userId, instanceIds] of instancesByUser) {
        const rows = await this.shiftService.findInviteStatusesForUser(
          userId,
          instanceIds,
        );
        for (const row of rows) {
          createdAtByKey.set(
            `${row.shiftInstanceId}::${userId}`,
            row.createdAt,
          );
        }
      }

      return keys.map((key) => createdAtByKey.get(key) ?? null);
    },
  );

  // Keyed by `${instanceId}::${userId}`; true when the instance is stored in the
  // user's pending membership request metadata as an intended shift instance.
  public readonly isIntendingToJoinByKey = new DataLoader<string, boolean>(
    async (keys) => {
      const parsed = keys.map((key) => {
        const sep = key.lastIndexOf('::');
        return { instanceId: key.slice(0, sep), userId: key.slice(sep + 2) };
      });

      const intendedKeys =
        await this.shiftService.findIntendedInstanceIdsForUsers(parsed);

      return keys.map((key) => intendedKeys.has(key));
    },
  );
}

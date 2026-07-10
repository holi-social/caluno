import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { RegisterLoader } from '../../graphql/interceptors';
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
}

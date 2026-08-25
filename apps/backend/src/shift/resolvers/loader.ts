import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { RegisterLoader } from '../../graphql/interceptors';
import type { ShiftInviteStatus } from '../enums';
import type { ShiftInstanceInviteEntity } from '../schemas/shift-instance-invite.schema';
import { ShiftService } from '../shift.service';

type InviteInstanceQueryParams = {
  organizationUnitId: string;
  instanceId: string;
  userId: string;
};

type InstanceInvitesListQueryParams = {
  organizationUnitId: string;
  instanceId: string;
  statuses?: readonly ShiftInviteStatus[] | null;
};

const toInviteLoaderKey = ({
  organizationUnitId,
  instanceId,
  userId,
}: InviteInstanceQueryParams) =>
  `${organizationUnitId}:${instanceId}:${userId}`;

const toStatusesKey = (
  statuses?: readonly ShiftInviteStatus[] | null,
): string => {
  if (!statuses?.length) {
    return 'all';
  }
  return [...statuses].sort().join(',');
};

const toInstanceInvitesListLoaderKey = ({
  organizationUnitId,
  instanceId,
  statuses,
}: InstanceInvitesListQueryParams) =>
  `${organizationUnitId}:${instanceId}:${toStatusesKey(statuses)}`;

@RegisterLoader()
@Injectable({ scope: Scope.REQUEST })
export class ShiftInstanceInvitesLoader {
  constructor(private readonly shiftService: ShiftService) {}

  public readonly invitesByInstanceId = new DataLoader<
    InviteInstanceQueryParams,
    ShiftInstanceInviteEntity | null,
    string
  >(
    async (keys: readonly InviteInstanceQueryParams[]) => {
      const organizationUnitId = keys[0].organizationUnitId;
      const instanceIds = [...new Set(keys.map((key) => key.instanceId))];
      const userIds = [...new Set(keys.map((key) => key.userId))];
      const results = await this.shiftService.findInvites(
        organizationUnitId,
        instanceIds,
        userIds,
      );

      const inviteByInstanceAndUser = new Map(
        results.map((row) => [
          toInviteLoaderKey({
            organizationUnitId,
            instanceId: row.instanceId,
            userId: row.userId,
          }),
          row,
        ]),
      );

      return keys.map(
        (key) => inviteByInstanceAndUser.get(toInviteLoaderKey(key)) ?? null,
      );
    },
    {
      cacheKeyFn: (key: InviteInstanceQueryParams): string =>
        `${key.organizationUnitId}:${key.instanceId}:${key.userId}`,
    },
  );

  public readonly instanceInvitesByKey = new DataLoader<
    InstanceInvitesListQueryParams,
    ShiftInstanceInviteEntity[],
    string
  >(
    async (keys: readonly InstanceInvitesListQueryParams[]) => {
      const resultsByKey = new Map<string, ShiftInstanceInviteEntity[]>();
      const groups = new Map<string, InstanceInvitesListQueryParams[]>();

      for (const key of keys) {
        const groupKey = `${key.organizationUnitId}:${toStatusesKey(key.statuses)}`;
        const list = groups.get(groupKey) ?? [];
        list.push(key);
        groups.set(groupKey, list);
      }

      for (const groupKeys of groups.values()) {
        const { organizationUnitId, statuses } = groupKeys[0];
        const instanceIds = [
          ...new Set(groupKeys.map((key) => key.instanceId)),
        ];
        const rows = await this.shiftService.findInstanceInvitesByInstanceIds(
          instanceIds,
          organizationUnitId,
          statuses,
        );

        const byInstanceId = new Map<string, ShiftInstanceInviteEntity[]>();
        for (const row of rows) {
          const list = byInstanceId.get(row.instanceId) ?? [];
          list.push(row);
          byInstanceId.set(row.instanceId, list);
        }

        for (const key of groupKeys) {
          resultsByKey.set(
            toInstanceInvitesListLoaderKey(key),
            byInstanceId.get(key.instanceId) ?? [],
          );
        }
      }

      return keys.map(
        (key) => resultsByKey.get(toInstanceInvitesListLoaderKey(key)) ?? [],
      );
    },
    {
      cacheKeyFn: toInstanceInvitesListLoaderKey,
    },
  );
}

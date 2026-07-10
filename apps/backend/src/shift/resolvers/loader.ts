import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { RegisterLoader } from '../../graphql/interceptors';
import { ShiftInviteStatus } from '../enums';
import { ShiftService } from '../shift.service';

type InviteInstanceQueryParams = {
  organizationUnitId: string;
  instanceId: string;
  userId: string;
};

const toInviteLoaderKey = ({
  organizationUnitId,
  instanceId,
  userId,
}: InviteInstanceQueryParams) =>
  `${organizationUnitId}:${instanceId}:${userId}`;

@RegisterLoader()
@Injectable({ scope: Scope.REQUEST })
export class ShiftInstanceInvitesLoader {
  constructor(private readonly shiftService: ShiftService) {}

  public readonly inviteStatusByInstanceId = new DataLoader<
    InviteInstanceQueryParams,
    ShiftInviteStatus | null,
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

      const inviteStatusByInstanceAndUser = new Map(
        results.map((row) => [
          toInviteLoaderKey({
            organizationUnitId,
            instanceId: row.instanceId,
            userId: row.userId,
          }),
          row.status as ShiftInviteStatus,
        ]),
      );

      return keys.map(
        (key) =>
          inviteStatusByInstanceAndUser.get(toInviteLoaderKey(key)) ?? null,
      );
    },
    {
      cacheKeyFn: (key: InviteInstanceQueryParams): string =>
        `${key.organizationUnitId}:${key.instanceId}:${key.userId}`,
    },
  );

  // loadInviteStatus(
  //   params: InviteInstanceQueryParams,
  // ): Promise<ShiftInviteStatus | null> {
  //   return this.inviteStatusByInstanceId.load(toInviteLoaderKey(params));
  // }
}

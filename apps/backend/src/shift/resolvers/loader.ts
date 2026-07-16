import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { RegisterLoader } from '../../graphql/interceptors';
import type { ShiftInstanceInviteEntity } from '../schemas/shift-instance-invite.schema';
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
}

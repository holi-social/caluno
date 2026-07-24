import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import type { UserEntity } from '../../auth/schemas/auth.schema';
import { RegisterLoader } from '../../graphql/interceptors';
import { ShiftService } from '../shift.service';

@RegisterLoader()
@Injectable({ scope: Scope.REQUEST })
export class ShiftInstanceInviteUsersLoader {
  constructor(private readonly shiftService: ShiftService) {}

  public readonly byId = new DataLoader<string, UserEntity | null>(
    async (userIds) => {
      const users = await this.shiftService.findUsersByIds([
        ...new Set(userIds),
      ]);
      const byId = new Map(users.map((user) => [user.id, user]));
      return userIds.map((id) => byId.get(id) ?? null);
    },
  );
}

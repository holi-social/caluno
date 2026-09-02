import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import type { UserEntity } from '../../auth/schemas/auth.schema';
import { RegisterLoader } from '../../graphql/interceptors';
import { UserService } from '../../user/user.service';

@RegisterLoader()
@Injectable({ scope: Scope.REQUEST })
export class EventInviteUsersLoader {
  constructor(private readonly userService: UserService) {}

  public readonly byId = new DataLoader<string, UserEntity | null>(
    async (userIds) => {
      const users = await this.userService.findByIds([...new Set(userIds)]);
      const byId = new Map(users.map((user) => [user.id, user]));
      return userIds.map((id) => byId.get(id) ?? null);
    },
  );
}
